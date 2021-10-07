package fr.cgi.edt.services.impl;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.helper.HolidayHelper;
import fr.cgi.edt.models.holiday.HolidayRecord;
import fr.cgi.edt.models.holiday.HolidaysConfig;
import fr.cgi.edt.services.InitService;
import fr.cgi.edt.services.ServiceFactory;
import fr.cgi.edt.utils.DateHelper;
import fr.cgi.edt.utils.SqlQueryUtils;
import fr.wseduc.webutils.Either;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.web.client.HttpResponse;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.codec.BodyCodec;
import org.entcore.common.service.impl.SqlCrudService;

import java.util.*;
import java.util.stream.Collectors;

public class DefaultInitImpl extends SqlCrudService implements InitService {

    Logger log = LoggerFactory.getLogger(DefaultInitImpl.class);
    public static final String PUBLIC_HOLIDAY_ENDPOINT = "/jours-feries/metropole/";
    public static final String SCHOOL_HOLIDAY_ENDPOINT = "/api/records/1.0/search/";
    private static final String STATEMENT = "statement";
    private static final String VALUES = "values";
    private static final String ACTION = "action";
    private static final String PREPARED = "prepared";
    private static final String HOUR_START = "00:00:00";
    private static final String HOUR_END = "23:59:59";
    private final HolidaysConfig holidaysConfig;


    private final WebClient client;

    public DefaultInitImpl(String table, ServiceFactory serviceFactory, HolidaysConfig holidaysConfig) {
        super(table);
        this.client = WebClient.create(serviceFactory.vertx());
        this.holidaysConfig = holidaysConfig;
    }

    /**
     * Script method to initialize all dates to viescolaire table setting period
     *
     * @param structure     structure identifier
     * @param zone          school's zone (A, B or C accepted)
     * @param handler       handler method will reply {@link JsonObject}
     */
    @Override
    public void init(String structure, String zone, Handler<Either<String, JsonObject>> handler) {
        InitDateFuture initDateFuture = new InitDateFuture(structure, zone);

        clearDatesFromStructure(initDateFuture)
                .compose(this::addSchoolPeriod)
                .compose(this::addExcludePeriod)
                .compose(this::addHolidaysPeriod)
                .onSuccess(statementsRes -> sql.transaction(initDateFuture.statements(), response -> {
                    Number id = Integer.parseInt("1");
                    handler.handle(SqlQueryUtils.getTransactionHandler(response, id));
                }))
                .onFailure(statementErr -> {
                    String message = String.format("[Edt@%s::init] An error has occured" +
                            " during clear/initializing dates: %s", this.getClass().getSimpleName(), statementErr.getMessage());
                    log.error(message, statementErr.getMessage());
                    handler.handle(new Either.Left<>(statementErr.getMessage()));
                });

    }

    /**
     * clear all dates (holidays, school period) from structure statement
     *
     * @param initDateFuture     init date future workflow to compose
     *
     * @return {@link Future} of {@link InitDateFuture} containing statements list of statements sent to SQL
     */
    private Future<InitDateFuture> clearDatesFromStructure(InitDateFuture initDateFuture) {
        Promise<InitDateFuture> promise = Promise.promise();
        String query = "DELETE FROM viesco.setting_period where id_structure = ? ";
        initDateFuture.statements().add(new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, new JsonArray().add(initDateFuture.structure()))
                .put(ACTION, PREPARED));
        promise.complete(initDateFuture);
        return promise.future();
    }

    /**
     * add school period from structure statement
     *
     * @param initDateFuture     init date future workflow to compose
     *
     * @return {@link Future} of {@link InitDateFuture} containing statements list of statements sent to SQL
     */
    private Future<InitDateFuture> addSchoolPeriod(InitDateFuture initDateFuture) {
        Promise<InitDateFuture> promise = Promise.promise();
        String query = "INSERT INTO  viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) " +
                "VALUES (to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?)";
        int year = Calendar.getInstance().get(Calendar.YEAR);
        initDateFuture.setSchoolStartAt(year + "-08-01 " + HOUR_START);
        year++;
        initDateFuture.setSchoolEndAt(year + "-07-31 " + HOUR_END);

        JsonArray params = new JsonArray()
                .add(initDateFuture.schoolStartAt())
                .add(initDateFuture.schoolEndAt())
                .add("Année scolaire")
                .add(initDateFuture.structure())
                .add(true)
                .add(Field.YEAR);

        initDateFuture.statements().add(new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, params )
                .put(ACTION, PREPARED));
        promise.complete(initDateFuture);
        return promise.future();
    }

    /**
     * add exclude period from structure statement
     *
     * @param initDateFuture     init date future workflow to compose {@link InitDateFuture}
     *
     * @return {@link Future} of {@link InitDateFuture} containing statements list of statements sent to SQL
     */
    private Future<InitDateFuture> addExcludePeriod(InitDateFuture initDateFuture) {
        Promise<InitDateFuture> promise = Promise.promise();

        fetchExcludeDate(initDateFuture)
                .onSuccess(holidays -> {
                    insertExcludeDateStatement(initDateFuture, holidays);
                    promise.complete(initDateFuture);
                })
                .onFailure(promise::fail);


        return promise.future();
    }

    /**
     * fetch Exclude dates twice (school date start and end period)
     *
     * @param initDateFuture        init date future workflow to compose {@link InitDateFuture}
     *
     * @return {@link Future} of {@link JsonObject} containing a map of exclude dates
     */
    private Future<JsonObject> fetchExcludeDate(InitDateFuture initDateFuture) {
        Promise<JsonObject> promise = Promise.promise();

        Future<JsonObject> currentYearFuture = searchExcludeDate(initDateFuture.schoolStartAt());
        Future<JsonObject> nextYearFuture = searchExcludeDate(initDateFuture.schoolEndAt());

        CompositeFuture.all(currentYearFuture, nextYearFuture)
                .onSuccess(unused -> {
                    JsonObject concatHolidays = currentYearFuture.result().mergeIn(nextYearFuture.result());

                    String schoolStartPeriod = DateHelper.getDateString(
                            initDateFuture.schoolStartAt(),
                            DateHelper.MONGO_FORMAT,
                            DateHelper.YEAR_MONTH_DAY
                    );
                    String schoolEndPeriod = DateHelper.getDateString(
                            initDateFuture.schoolEndAt(),
                            DateHelper.MONGO_FORMAT,
                            DateHelper.YEAR_MONTH_DAY
                    );

                    // creating a new holidays json object in which holiday is between start and end school period
                    JsonObject holidays = new JsonObject();

                    for (String holiday : concatHolidays.fieldNames()) {
                        if (DateHelper.isDateAfter(holiday, schoolStartPeriod) && DateHelper.isDateBefore(holiday, schoolEndPeriod)) {
                            holidays.put(holiday, concatHolidays.getString(holiday));
                        }
                    }
                    promise.complete(holidays);
                })
                .onFailure(promise::fail);

        return promise.future();
    }

    /**
     * search using HTTP Client exclude date list
     *
     * @param date  year date to format

     * @return {@link Future} of {@link JsonObject} containing a HTTP response
     */
    private Future<JsonObject> searchExcludeDate(String date) {
        Promise<JsonObject> promise = Promise.promise();
        String yearDate = DateHelper.getDateString(date, DateHelper.MONGO_FORMAT, DateHelper.YEAR);
        client.getAbs(holidaysConfig.publicHolidaysUrl() + PUBLIC_HOLIDAY_ENDPOINT + yearDate + ".json")
                .as(BodyCodec.jsonObject())
                .send(ar -> {
                    if (ar.failed()) {
                        String message = String.format("[Edt@%s::searchExcludeDate] An error has occured" +
                                " during HTTP Get: %s", this.getClass().getSimpleName(), ar.cause().getMessage());
                        log.error(message, ar.cause().getMessage());
                        promise.fail(ar.cause().getMessage());
                    } else {
                        HttpResponse<JsonObject> response = ar.result();
                        if (response.statusCode() != 200) {
                            String message = String.format("[Edt@%s::searchExcludeDate] Response status is not a HTTP 200: [%s] : %s",
                                    this.getClass().getSimpleName(), response.statusCode(), response.statusMessage());
                            log.error(message, response.statusMessage());
                            promise.fail(response.statusMessage());
                        } else {
                            promise.complete(response.body());
                        }
                    }
                });

        return promise.future();
    }

    /**
     * with holidays fetched, insert exclude date from structure statement
     *
     * @param initDateFuture        init date future workflow to compose {@link InitDateFuture}
     * @param holidays              list of holidays fetched {@link JsonObject}
     *                              {"yyyy-MM-dd": description name, "yyyy-MM-dd": ...}
     */
    private void insertExcludeDateStatement(InitDateFuture initDateFuture, JsonObject holidays) {
        if (holidays.isEmpty() || holidays.fieldNames().isEmpty()) return;
        StringBuilder query = new StringBuilder("INSERT INTO viesco.setting_period (start_date, end_date, " +
                "description, id_structure, is_opening, code) VALUES");
        JsonArray params = new JsonArray();

        for(String holiday : holidays.fieldNames()) {
            query.append("(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?),");
            params.add(holiday + " " + HOUR_START)
                    .add(holiday + " " + HOUR_END)
                    .add(holidays.getString(holiday))
                    .add(initDateFuture.structure())
                    .add(false)
                    .add(Field.EXCLUSION);
        }
        query = new StringBuilder(query.substring(0, query.length() - 1));
        initDateFuture.statements().add(new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, params )
                .put(ACTION, PREPARED));
    }

    /**
     * add exclude period from structure statement
     *
     * @param initDateFuture     init date future workflow to compose {@link InitDateFuture}
     *
     * @return {@link Future} of {@link InitDateFuture} containing statements list of statements sent to SQL
     */
    private Future<InitDateFuture> addHolidaysPeriod(InitDateFuture initDateFuture) {
        Promise<InitDateFuture> promise = Promise.promise();
        searchHolidaysDate(initDateFuture)
                .onSuccess(holidays -> {
                    List<HolidayRecord> holidaysDistinctByDescription = formatDistinctHoliday(holidays);
                    insertHolidaysDateStatement(initDateFuture, holidaysDistinctByDescription);
                    promise.complete(initDateFuture);
                })
                .onFailure(promise::fail);


        return promise.future();
    }

    /**
     * recreate list of {@link HolidayRecord} but distinct by description in order to prevent
     * multiple same value (christmas holidays etc...)
     *
     * @param holidays  {@link HolidayRecord} containing a HTTP response
     *
     * @return {@link List} of {@link HolidayRecord} containing new list distinct
     */
    private List<HolidayRecord> formatDistinctHoliday(List<HolidayRecord> holidays) {
        Set<String> descriptionSet = new HashSet<>();
        return holidays.stream()
                .filter(e -> descriptionSet.add(e.description()))
                .collect(Collectors.toList());
    }

    /**
     * search using HTTP Client holidays date list
     *
     * @param initDateFuture  {@link InitDateFuture}

     * @return {@link Future} of {@link List<HolidayRecord>} containing a HTTP response
     */
    private Future<List<HolidayRecord>> searchHolidaysDate(InitDateFuture initDateFuture) {
        Promise<List<HolidayRecord>> promise = Promise.promise();
        String startYear = DateHelper.getDateString(initDateFuture.schoolStartAt(), DateHelper.MONGO_FORMAT, DateHelper.YEAR);
        String endYear = DateHelper.getDateString(initDateFuture.schoolEndAt(), DateHelper.MONGO_FORMAT, DateHelper.YEAR);
        String schoolYear = startYear + "-" + endYear;
        client.getAbs(holidaysConfig.schoolHolidaysUrl() + SCHOOL_HOLIDAY_ENDPOINT)
                .addQueryParam("dataset", "fr-en-calendrier-scolaire")
                .addQueryParam("refine.annee_scolaire", schoolYear)
                .addQueryParam("facet", "location")
                .addQueryParam("refine.zones", "Zone " + initDateFuture.zone())
                .addQueryParam("timezone", "Europe/Paris")
                .as(BodyCodec.jsonObject())
                .send(ar -> {
                    if (ar.failed()) {
                        String message = String.format("[Edt@%s::searchHolidaysDate] An error has occurred" +
                                " during HTTP Get: %s", this.getClass().getSimpleName(), ar.cause().getMessage());
                        log.error(message, ar.cause().getMessage());
                        promise.fail(ar.cause().getMessage());
                    } else {
                        HttpResponse<JsonObject> response = ar.result();
                        if (response.statusCode() != 200) {
                            String message = String.format("[Edt@%s::searchHolidaysDate] Response status is not a HTTP 200: [%s] : %s",
                                    this.getClass().getSimpleName(), response.statusCode(), response.statusMessage());
                            log.error(message, response.statusMessage());
                            promise.fail(response.statusMessage());
                        } else {
                            List<HolidayRecord> holidayRecords = HolidayHelper.holidaysRecords(response.body().getJsonArray(Field.RECORDS, new JsonArray()));
                            promise.complete(holidayRecords);
                        }
                    }
                });

        return promise.future();
    }

    /**
     * with school holidays fetched, insert holidays date from structure statement
     *
     * @param initDateFuture        init date future workflow to compose {@link InitDateFuture}
     * @param holidays              list of holidays fetched {@link List<HolidayRecord>}
     */
    private void insertHolidaysDateStatement(InitDateFuture initDateFuture, List<HolidayRecord> holidays) {
        if (holidays.isEmpty()) return;
        JsonArray params = new JsonArray();
        StringBuilder query = new StringBuilder("INSERT INTO viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) VALUES");
        for(HolidayRecord holiday : holidays) {
            String startAt = DateHelper.getDateString(
                    holiday.startAt(),
                    DateHelper.SQL_FORMAT,
                    DateHelper.YEAR_MONTH_DAY
            );

            String endAt = DateHelper.getDateString(
                    holiday.endAt(),
                    DateHelper.SQL_FORMAT,
                    DateHelper.YEAR_MONTH_DAY
            );
            query.append("(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?),");
            params.add(startAt + " " + HOUR_START)
                    .add(endAt + " " + getEndDateHoliday(startAt, endAt))
                    .add(holiday.description())
                    .add(initDateFuture.structure())
                    .add(false)
                    .add(Field.EXCLUSION);

        }
        query = new StringBuilder(query.substring(0, query.length() - 1));

        initDateFuture.statements().add(new JsonObject()
                .put(STATEMENT, query.toString())
                .put(VALUES, params)
                .put(ACTION, PREPARED));
    }

    private String getEndDateHoliday(String startAt, String endAt) {
        return startAt != null && endAt != null && (startAt.equals(endAt) ||
                DateHelper.isDateDayOfWeek(DateHelper.getDate(endAt, DateHelper.YEAR_MONTH_DAY), Calendar.SUNDAY))
                ?  HOUR_END : HOUR_START;
    }
}

class InitDateFuture {
    private final String structure;

    private String schoolStartAt;
    private String schoolEndAt;
    private String zone; // A || B || C

    private JsonArray statements;

    public InitDateFuture(String structure, String zone) {
        this.structure = structure;
        this.zone = zone;
        this.statements = new JsonArray();
    }

    public String structure() {
        return structure;
    }

    public String schoolStartAt() {
        return schoolStartAt;
    }

    public void setSchoolStartAt(String schoolStartAt) {
        this.schoolStartAt = schoolStartAt;
    }

    public String schoolEndAt() {
        return schoolEndAt;
    }

    public void setSchoolEndAt(String schoolEndAt) {
        this.schoolEndAt = schoolEndAt;
    }

    public String zone() {
        return zone;
    }

    public InitDateFuture setZone(String zone) {
        this.zone = zone;
        return this;
    }

    public JsonArray statements() {
        return statements;
    }

    public void setStatements(JsonArray statements) {
        this.statements = statements;
    }
}
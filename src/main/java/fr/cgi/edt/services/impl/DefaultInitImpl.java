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
import io.vertx.core.*;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.web.client.HttpRequest;
import io.vertx.ext.web.client.HttpResponse;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.codec.BodyCodec;
import org.entcore.common.service.impl.SqlCrudService;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

public class DefaultInitImpl extends SqlCrudService implements InitService {

    Logger log = LoggerFactory.getLogger(DefaultInitImpl.class);
    public static final String PUBLIC_HOLIDAY_ENDPOINT = "/jours-feries/metropole/";
    public static final String SCHOOL_HOLIDAY_DATASET = "fr-en-calendrier-scolaire";
    public static final String SCHOOL_HOLIDAY_ENDPOINT = "/api/explore/v2.1/catalog/datasets/"+ SCHOOL_HOLIDAY_DATASET + "/exports/json";
    private static final String STATEMENT = "statement";
    private static final String VALUES = "values";
    private static final String ACTION = "action";
    private static final String PREPARED = "prepared";
    public static final String HOUR_START = "00:00:00";
    public static final String HOUR_END = "23:59:59";
    private final HolidaysConfig holidaysConfig;


    private final WebClient client;

    public DefaultInitImpl(String table, Vertx vertx, HolidaysConfig holidaysConfig) {
        super(table);
        this.client = WebClient.create(vertx);
        this.holidaysConfig = holidaysConfig;
    }

    @Override
    public Future<JsonObject> init(String structure, String zone, boolean initSchoolYear, String schoolYearStartDate,
                                   String schoolYearEndDate) {
        Promise<JsonObject> promise = Promise.promise();

        InitDateFuture initDateFuture = new InitDateFuture(structure, zone, schoolYearStartDate, schoolYearEndDate);

        clearDatesFromStructure(initDateFuture, initSchoolYear)
                .compose(res -> {
                    if (initSchoolYear) {
                        return addSchoolPeriod(res);
                    } else {
                        return Future.succeededFuture(res);
                    }
                })
                .compose(this::addExcludePeriod)
                .compose(this::addHolidaysPeriod)
                .onSuccess(statementsRes -> sql.transaction(initDateFuture.statements(), response -> {
                    Either<String, JsonObject> handler = SqlQueryUtils.getTransactionHandler(response, 1);
                    if (handler.isLeft()) {
                        promise.fail(handler.left().getValue());
                    } else {
                        promise.complete(handler.right().getValue());
                    }
                }))
                .onFailure(statementErr -> {
                    String message = String.format("[Edt@%s::init] An error has occurred" +
                            " during clear/initializing dates: %s", this.getClass().getSimpleName(), statementErr.getMessage());
                    log.error(message, statementErr.getMessage());
                    promise.fail(statementErr.getMessage());
                });
       return promise.future();
    }

    /**
     * clear all dates (holidays, school period) from structure statement
     *
     * @param initDateFuture     init date future workflow to compose
     * @param initSchoolYear     boolean to know if we need to init school year
     * @return {@link Future} of {@link InitDateFuture} containing statements list of statements sent to SQL
     */
    private Future<InitDateFuture> clearDatesFromStructure(InitDateFuture initDateFuture, boolean initSchoolYear) {
        Promise<InitDateFuture> promise = Promise.promise();
        String query = "DELETE FROM viesco.setting_period WHERE id_structure = ?";
        if (!initSchoolYear)
            query += " AND code != 'YEAR'";
        initDateFuture.statements().add(new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, new JsonArray()
                        .add(initDateFuture.structure()))
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

        Future.all(currentYearFuture, nextYearFuture)
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
                        String message = String.format("[Edt@%s::searchExcludeDate] An error has occurred" +
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
        return holidays
                .stream()
                .filter(e -> descriptionSet.add(e.description()))
                .collect(Collectors.toList());
    }

    /**
     * search using HTTP Client holidays date list
     *
     * @param initDateFuture  {@link InitDateFuture}

     * @return {@link Future} of {@link List<HolidayRecord>} containing a HTTP response
     */
    Future<List<HolidayRecord>> searchHolidaysDate(InitDateFuture initDateFuture) {
        Promise<List<HolidayRecord>> promise = Promise.promise();

        // Calculate school year
        String startYear = DateHelper.getDateString(initDateFuture.schoolStartAt(), DateHelper.MONGO_FORMAT, DateHelper.YEAR);
        String endYear = DateHelper.getDateString(initDateFuture.schoolEndAt(), DateHelper.MONGO_FORMAT, DateHelper.YEAR);
        String schoolYear = startYear + "-" + endYear;

        // Fetch Zone Holidays based on zone and school year
        getZoneHolidaysHttpRequest(initDateFuture.zone(), schoolYear)
                .send(res -> {
                    if (res.succeeded() && res.result() != null && res.result().statusCode() == 200) {
                        // Check if results are not empty
                        if (res.result().body() != null && !res.result().body().isEmpty()) {
                            // OK => Complete promise with results
                            List<HolidayRecord> holidayRecords = HolidayHelper.holidaysRecords(res.result().body());
                            promise.complete(holidayRecords);
                        } else {
                            // If results are empty, try again with the endYear, for example 2025 instead of school year 2024-2025
                            // (that case may happen with zone that does not support school year on 2 different years,
                            // like for example Nouvelle Calédonie and Wallis et Futuna)
                            getZoneHolidaysHttpRequest(initDateFuture.zone(), endYear)
                                    .send(basedOnCurrentYearRes -> {
                                        if (basedOnCurrentYearRes.succeeded()
                                                && basedOnCurrentYearRes.result() != null
                                                && basedOnCurrentYearRes.result().statusCode() == 200
                                                && basedOnCurrentYearRes.result().body() != null
                                                && !basedOnCurrentYearRes.result().body().isEmpty()) {
                                            // OK => Complete promise with results
                                            List<HolidayRecord> holidayRecords = HolidayHelper.holidaysRecords(basedOnCurrentYearRes.result().body());
                                            promise.complete(holidayRecords);
                                        } else {
                                            String message = String.format(
                                                    "[Edt@%s::searchHolidaysDate] Failed to fetch holidays for zone %s and year %s: %s",
                                                    this.getClass().getSimpleName(),
                                                    initDateFuture.zone(),
                                                    endYear,
                                                    basedOnCurrentYearRes.cause().getMessage());
                                            log.error(message, basedOnCurrentYearRes.cause().getMessage());
                                            promise.fail(basedOnCurrentYearRes.cause().getMessage());
                                        }
                                    });
                        }
                    } else {
                        String message = String.format(
                                "[Edt@%s::searchHolidaysDate] Failed to fetch holidays for zone %s and school year %s: %s",
                                this.getClass().getSimpleName(),
                                initDateFuture.zone(),
                                schoolYear,
                                res.cause().getMessage());
                        log.error(message, res.cause().getMessage());
                        promise.fail(res.cause().getMessage());
                    }
                });

        return promise.future();
    }

    /**
     * Get the zone holidays Http Request depending on the zone and the schoolYear,
     * If the schoolYear pattern is a school year pattern (like 2024-2025), it uses the refine.annee_scolaire query param
     * otherwise it uses the refine.start_date query param
     *
     * @param zone the holidays zone (Zone A, Zone B, Zone C, Corse, Guadeloupe, etc...)
     * @param schoolYear the school year (2024-2025) or (2025)
     * @return the HttpRequest based on zone and schoolYear
     */
    private HttpRequest<JsonArray> getZoneHolidaysHttpRequest(String zone, String schoolYear) {
        final HttpRequest<Buffer> buffer = client
                .getAbs(holidaysConfig.schoolHolidaysUrl() + SCHOOL_HOLIDAY_ENDPOINT)
                .addQueryParam("refine", "zones:" + zone)
                .addQueryParam("refine", "annee_scolaire:" + schoolYear)
                .addQueryParam("timezone", "Europe/Paris");

        return buffer.as(BodyCodec.jsonArray());
    }

    /**
     * with school holidays fetched, insert holidays date from structure statement
     *
     * @param initDateFuture        init date future workflow to compose {@link InitDateFuture}
     * @param holidays              list of holidays fetched {@link List<HolidayRecord>}
     */
    private void insertHolidaysDateStatement(InitDateFuture initDateFuture, List<HolidayRecord> holidays) {
        if (holidays.isEmpty()) {
            return;
        }

        final JsonArray params = new JsonArray();
        final StringBuilder query = new StringBuilder("INSERT INTO viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) VALUES ");

        // append the values and params for each holiday
        for (int i = 0; i < holidays.size(); i++) {
            final HolidayRecord holiday = holidays.get(i);

            // format start and end dates
            final String startDateYYYYMMDD = DateHelper.getDateString(
                    holiday.startAt(),
                    DateHelper.DATA_GOUV_API_DATE_FORMAT,
                    DateHelper.YEAR_MONTH_DAY);
            final String endDateYYYYMMDD = DateHelper.getDateString(
                    holiday.endAt(),
                    DateHelper.DATA_GOUV_API_DATE_FORMAT,
                    DateHelper.YEAR_MONTH_DAY);

            final String startDateYYYYMMDD_HHMMSS = startDateYYYYMMDD + " " + HOUR_START;
            String endDateYYYYMMDD_HHMMSS = endDateYYYYMMDD + " " + HOUR_END;

            // Holidays like Christmas, Toussaint... given by the data.education.gouv API ends on Monday,
            // so we need to insert in the database the date corresponding to the day before => the Sunday
            if (endDateYYYYMMDD != null && !endDateYYYYMMDD.equals(startDateYYYYMMDD)) {
                final Date endDate = DateHelper.getDate(endDateYYYYMMDD, DateHelper.YEAR_MONTH_DAY);
                final Date endDateMinusOneDay = DateHelper.addDays(endDate, -1);
                endDateYYYYMMDD_HHMMSS = DateHelper.getDateString(endDateMinusOneDay, DateHelper.YEAR_MONTH_DAY) + " " + HOUR_END;
            }

            // values
            query.append("(")
                    .append("to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ") // start_date
                    .append("to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ") // end_date
                    .append("?, ?, ?, ?") // description, structure_id, is_opening, code
                    .append(")");
            // add a comma if not the last element
            if (i < holidays.size() - 1) {
                query.append(",");
            }
            // params
            params.add(startDateYYYYMMDD_HHMMSS)
                    .add(endDateYYYYMMDD_HHMMSS)
                    .add(holiday.description())
                    .add(initDateFuture.structure())
                    .add(false)
                    .add(Field.EXCLUSION);
        }

        final JsonObject statement = new JsonObject()
                .put(STATEMENT, query.toString())
                .put(VALUES, params)
                .put(ACTION, PREPARED);

        initDateFuture.statements().add(statement);
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

    public InitDateFuture(String structure, String zone, String schoolStartAt, String schoolEndAt) {
        this.structure = structure;
        this.zone = zone;
        this.statements = new JsonArray();
        this.schoolStartAt = schoolStartAt + " " + DefaultInitImpl.HOUR_START;
        this.schoolEndAt = schoolEndAt + " " + DefaultInitImpl.HOUR_END;
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

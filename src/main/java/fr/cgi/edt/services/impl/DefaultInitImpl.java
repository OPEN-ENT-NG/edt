package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.InitService;
import fr.cgi.edt.utils.SqlQueryUtils;
import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.service.impl.SqlCrudService;
import org.entcore.common.sql.SqlResult;

import java.util.Calendar;

import static fr.wseduc.webutils.Utils.handlerToAsyncHandler;

public class DefaultInitImpl   extends SqlCrudService implements InitService {
    private static final String STATEMENT = "statement";
    private static final String VALUES = "values";
    private static final String ACTION = "action";
    private static final String PREPARED = "prepared";
    private static final Logger LOGGER = LoggerFactory.getLogger(DefaultInitImpl.class);
    private EventBus eb;

    public DefaultInitImpl(String table, EventBus eb) {
        super(table);
        this.eb = eb;

    }

    @Override
    public void init(final Handler<Either<String, JsonObject>> handler) {

        String structQuery = "SELECT DISTINCT id_structure as struct from viesco.setting_period ";
        sql.raw(structQuery, SqlResult.validResultHandler(new Handler<Either<String, JsonArray>>() {
            @Override
            public void handle(Either<String, JsonArray> event) {
                JsonArray structuresRegistered = new JsonArray();
                for (Integer i = 0; i < event.right().getValue().size(); i++) {
                    structuresRegistered.add(event.right().getValue().getJsonObject(i).getString("struct"));
                }

                JsonArray statements = new fr.wseduc.webutils.collections.JsonArray();

                JsonArray types = new JsonArray();
                JsonObject action = new JsonObject()
                        .put("action", "structure.getAllStructures")
                        .put("types", types);
                eb.send("viescolaire", action, handlerToAsyncHandler(new Handler<Message<JsonObject>>() {
                    @Override
                    public void handle(Message<JsonObject> message) {
                        JsonObject body = message.body();
                        if ("ok".equals(body.getString("status"))) {
                            JsonArray structList = body.getJsonArray("results");
                            for (Integer k = 0; k < structList.size(); k++) {
                                if (!structuresRegistered.contains(structList.getJsonObject(k).getString("s.id"))) {
                                    statements.add(getInitSchoolPeriod(structList.getJsonObject(k)));
                                    statements.add(getExludSchoolPeriod(structList.getJsonObject(k)));
                                }
                            }
                            try {
                                sql.transaction(statements, new Handler<Message<JsonObject>>() {
                                    @Override
                                    public void handle(Message<JsonObject> event) {
                                        Number id = Integer.parseInt("1");
                                        handler.handle(SqlQueryUtils.getTransactionHandler(event, id));
                                    }
                                });
                            } catch (ClassCastException e) {
                                LOGGER.error("An error occurred when init", e);
                                handler.handle(new Either.Left<String, JsonObject>(""));

                            }

                        }
                    }
                }));

            }
        }));

    }

    private JsonObject getExludSchoolPeriod(JsonObject jsonObject) {
        int year = Calendar.getInstance().get(Calendar.YEAR);

        String query = "INSERT INTO  viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) VALUES" ;
        for(int i=0;i<8;i++ )
            query += "(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?),";
        query = query.substring(0, query.length() - 1);
    //holidays of one day
        String  elevenNovember  = year + "-11-11 ",
                fourteenNovember  = year + "-11-14 ",
                christmas = year + "-12-25 ",
                firstMay = year + 1 + "-05-01 ",
                eightMay  = year +1 + "-05-08 ",
                newYear = year + 1 +"-01-01 ",
                fourteenJuly = year + 1 + "-07-14 ",
                fifteenAugust = year + "-08-15 ";

        String hourStart = "00:00:00", hourEnd = "23:59:59";
        JsonArray params = new JsonArray()
                .add(elevenNovember + hourStart ).add(elevenNovember + hourEnd).add("Année scolaire").add(jsonObject.getString("s.id")).add("EXCLUSION")
                .add(christmas + hourStart ).add(christmas + hourEnd).add("Année scolaire").add(jsonObject.getString("s.id")).add("EXCLUSION")
                .add(fourteenNovember + hourStart ).add(fourteenNovember + hourEnd).add("Année scolaire").add(jsonObject.getString("s.id")).add("EXCLUSION")
                .add(firstMay + hourStart ).add(firstMay + hourEnd).add("Année scolaire").add(jsonObject.getString("s.id")).add("EXCLUSION")
                .add(eightMay + hourStart ).add(eightMay + hourEnd).add("Année scolaire").add(jsonObject.getString("s.id")).add("EXCLUSION")
                .add(newYear + hourStart ).add(newYear + hourEnd).add("Année scolaire").add(jsonObject.getString("s.id")).add("EXCLUSION")
                .add(fourteenJuly + hourStart ).add(fourteenJuly + hourEnd).add("Année scolaire").add(jsonObject.getString("s.id")).add("EXCLUSION")
                .add(fifteenAugust + hourStart ).add(fifteenAugust + hourEnd).add("Année scolaire").add(jsonObject.getString("s.id")).add("EXCLUSION");
        return new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, params )
                .put(ACTION, PREPARED);
    }



    private JsonObject getInitSchoolPeriod(JsonObject jsonObject) {
        String startDate,endDate;

        String query = "INSERT INTO  viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) " +
                "VALUES (to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?)";

        int year = Calendar.getInstance().get(Calendar.YEAR);
        startDate = year + "-08-01 00:00:00";
        year++;
        endDate = year + "-09-31 00:00:00";
        JsonArray params = new JsonArray().add(startDate).add(endDate).add("Année scolaire").add(jsonObject.getString("s.id")).add("YEAR");
        return new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, params )
                .put(ACTION, PREPARED);
    }
}
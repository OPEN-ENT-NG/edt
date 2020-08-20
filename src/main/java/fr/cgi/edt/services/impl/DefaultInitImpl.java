package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.InitService;
import fr.cgi.edt.utils.SqlQueryUtils;
import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.service.impl.SqlCrudService;


import java.util.Calendar;


public class DefaultInitImpl extends SqlCrudService implements InitService {
    private static final String STATEMENT = "statement";
    private static final String VALUES = "values";
    private static final String ACTION = "action";
    private static final String PREPARED = "prepared";


    public DefaultInitImpl(String table) {
        super(table);
    }

    @Override
    public void init(String structure, Handler<Either<String, JsonObject>> handler) {
        JsonArray statements = new JsonArray();
        /* Delete dates and will replace by these last statements */ 
        statements.add(deleteDatesFromStructure(structure));
        /* Add exclude day period */
        statements.add(getExludSchoolPeriod(structure));
        /* Add school period */
        statements.add(getInitSchoolPeriod(structure));
        /* Add holidays period */
        statements.add(getInitHolidaysPeriod(structure));

        sql.transaction(statements, response -> {
            Number id = Integer.parseInt("1");
            handler.handle(SqlQueryUtils.getTransactionHandler(response, id));
        });
    }

    
    private JsonObject deleteDatesFromStructure(String structure) {
        String query = "DELETE FROM viesco.setting_period where id_structure = ? ";
        return new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, new JsonArray().add(structure))
                .put(ACTION, PREPARED);
    }


    // todo: raw (to year 2021) mode for now but must do dynamic script get exclude school period (see ME-185)
    private JsonObject getExludSchoolPeriod(String structure) {
        int year = Calendar.getInstance().get(Calendar.YEAR);

        String query = "INSERT INTO  viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) VALUES" ;
        for(int i = 0; i < 8; i++) {
            query += "(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?),";
        }
        query = query.substring(0, query.length() - 1);
        // holidays of one day
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
                .add(elevenNovember + hourStart ).add(elevenNovember + hourEnd).add("11 novembre").add(structure).add(false).add("EXCLUSION")
                .add(christmas + hourStart ).add(christmas + hourEnd).add("25 décembre").add(structure).add(false).add("EXCLUSION")
                .add(fourteenNovember + hourStart ).add(fourteenNovember + hourEnd).add("14 novembre").add(structure).add(false).add("EXCLUSION")
                .add(firstMay + hourStart ).add(firstMay + hourEnd).add("1er mai").add(structure).add(false).add("EXCLUSION")
                .add(eightMay + hourStart ).add(eightMay + hourEnd).add("8 mai").add(structure).add(false).add("EXCLUSION")
                .add(newYear + hourStart ).add(newYear + hourEnd).add("1er janvier").add(structure).add(false).add("EXCLUSION")
                .add(fourteenJuly + hourStart ).add(fourteenJuly + hourEnd).add("14 juillet").add(structure).add(false).add("EXCLUSION")
                .add(fifteenAugust + hourStart ).add(fifteenAugust + hourEnd).add("15 août").add(structure).add(false).add("EXCLUSION");
        return new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, params )
                .put(ACTION, PREPARED);
    }

    // todo: raw (to year 2021) mode for now but must do dynamic script get holidays (see ME-185)
    private JsonObject getInitHolidaysPeriod(String structure) {
        int year = Calendar.getInstance().get(Calendar.YEAR);

        String query = "INSERT INTO  viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) VALUES" ;
        for(int i = 0; i < 6; i++) {
            query += "(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?),";
        }
        query = query.substring(0, query.length() - 1);

        JsonObject toussaint = new JsonObject().put("start_at", year + "-10-17").put("end_at", year + "-11-01");
        JsonObject christmas = new JsonObject().put("start_at", year + "-12-19").put("end_at", year + 1 + "-01-03");
        JsonObject winter = new JsonObject().put("start_at", year + 1 + "-02-13").put("end_at", year + 1 + "-02-28");
        JsonObject spring = new JsonObject().put("start_at", year + 1 + "-04-17").put("end_at", year + 1 + "-05-02");
        JsonObject ascension = new JsonObject().put("start_at", year + 1 + "-05-13").put("end_at", year + 1 + "-05-16");
        JsonObject summer = new JsonObject().put("start_at", year + 1 + "-07-06").put("end_at", year + 1 + "-07-31");

        String hourStart = "00:00:00", hourEnd = "23:59:59";
        JsonArray params = new JsonArray()
                .add(toussaint.getString("start_at") + " " + hourStart ).add(toussaint.getString("end_at") + " " + hourEnd).add("Vacances Toussaint").add(structure).add(false).add("EXCLUSION")
                .add(christmas.getString("start_at") + " " + hourStart ).add(christmas.getString("end_at") + " " + hourEnd).add("Vacances Noël").add(structure).add(false).add("EXCLUSION")
                .add(winter.getString("start_at") + " " + hourStart ).add(winter.getString("end_at") + " " + hourEnd).add("Vacances Hiver").add(structure).add(false).add("EXCLUSION")
                .add(spring.getString("start_at") + " " + hourStart ).add(spring.getString("end_at") + " " + hourEnd).add("Vacances Printemps").add(structure).add(false).add("EXCLUSION")
                .add(ascension.getString("start_at") + " " + hourStart ).add(ascension.getString("end_at") + " " + hourEnd).add("Pont de l'ascension").add(structure).add(false).add("EXCLUSION")
                .add(summer.getString("start_at") + " " + hourStart ).add(summer.getString("end_at") + " " + hourEnd).add("Vacances d'été").add(structure).add(false).add("EXCLUSION");
        return new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, params )
                .put(ACTION, PREPARED);
    }

    // todo: raw (to year 2021) mode for now but must do dynamic script get school period (see ME-185)
    private JsonObject getInitSchoolPeriod(String structure) {
        String startDate,endDate;

        String query = "INSERT INTO  viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) " +
                "VALUES (to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?)";

        int year = Calendar.getInstance().get(Calendar.YEAR);
        startDate = year + "-08-01 00:00:00";
        year++;
        endDate = year + "-07-31 00:00:00";
        JsonArray params = new JsonArray().add(startDate).add(endDate).add("Année scolaire").add(structure).add(true).add("YEAR");
        return new JsonObject()
                .put(STATEMENT, query)
                .put(VALUES, params )
                .put(ACTION, PREPARED);
    }
}
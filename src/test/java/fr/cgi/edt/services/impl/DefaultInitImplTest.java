package fr.cgi.edt.services.impl;


import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.models.holiday.HolidayRecord;
import fr.cgi.edt.services.InitService;
import fr.cgi.edt.services.ServiceFactory;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.sql.Sql;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.reflect.Whitebox;

import java.util.Arrays;
import java.util.Calendar;
import java.util.List;

import static org.mockito.Mockito.mock;


@RunWith(VertxUnitRunner.class)
public class DefaultInitImplTest {

    Sql sql = mock(Sql.class);
    Neo4j neo4j = mock(Neo4j.class);
    MongoDb mongoDb = mock(MongoDb.class);

    private InitService initService;
    InitDateFuture initDateFuture;


    @Before
    public void setUp(TestContext context) {
        this.initService = new DefaultInitImpl("edt", Vertx.vertx(), null);
        this.initDateFuture = new InitDateFuture("structure", "C");
    }

    @Test
    public void testClearDatesFromStructureShouldCallSQLRequestCorrectly(TestContext ctx) {
        // Arguments
        InitDateFuture initDateFuture = new InitDateFuture("structure", "C");

        // expected data
        String expectedQuery = "DELETE FROM viesco.setting_period WHERE id_structure = ?";
        String expectedStructure = "structure";

        try {
            Future<InitDateFuture> res = Whitebox.invokeMethod(initService, "clearDatesFromStructure", initDateFuture, true);
            ctx.assertEquals(res.result().statements().getJsonObject(0).getString("statement"), expectedQuery);
            ctx.assertEquals(res.result().statements().getJsonObject(0).getJsonArray("values"), new JsonArray().add(expectedStructure));
        } catch (Exception e) {
            ctx.assertNull(e);
        }
    }

    @Test
    public void testAddSchoolPeriod_Should_Enter_Correct_Data(TestContext ctx) {
        // expected data
        String expectedQuery = "INSERT INTO  viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) " +
                "VALUES (to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?)";
        int year = Calendar.getInstance().get(Calendar.YEAR);
        String expectedStartAt = year + "-08-01 00:00:00";
        year++;
        String expectedEndAt =  year + "-07-31 23:59:59";
        JsonArray expectedParams = new JsonArray()
                .add(expectedStartAt)
                .add(expectedEndAt)
                .add("Année scolaire")
                .add(initDateFuture.structure())
                .add(true)
                .add(Field.YEAR);

        try {
            Future<InitDateFuture> res = Whitebox.invokeMethod(initService, "addSchoolPeriod", initDateFuture);
            ctx.assertEquals(res.result().statements().getJsonObject(0).getString("statement"), expectedQuery);
            ctx.assertEquals(res.result().statements().getJsonObject(0).getJsonArray("values"), expectedParams);
            ctx.assertEquals(res.result().schoolStartAt(), expectedStartAt);
            ctx.assertEquals(res.result().schoolEndAt(), expectedEndAt);
        } catch (Exception e) {
            ctx.assertNull(e);
        }
    }

    @Test
    public void testInsertExcludeDateStatement_Should_Insert_Correct_Data_Into_SQLStatement(TestContext ctx) {

        JsonObject mockedDate = new JsonObject()
                .put("2021-12-25", "Noel")
                .put("2022-07-14", "14 février");

        // expected data
        String expectedQuery = "INSERT INTO viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) " +
                "VALUES" +
                "(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?)," +
                "(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?)";
        JsonArray expectedParams = new JsonArray()
                .add("2021-12-25 00:00:00")
                .add("2021-12-25 23:59:59")
                .add("Noel")
                .add(initDateFuture.structure())
                .add(false)
                .add(Field.EXCLUSION)
                .add("2022-07-14 00:00:00")
                .add("2022-07-14 23:59:59")
                .add("14 février")
                .add(initDateFuture.structure())
                .add(false)
                .add(Field.EXCLUSION);
        try {
            Whitebox.invokeMethod(initService, "insertExcludeDateStatement", initDateFuture, mockedDate);
            ctx.assertEquals(initDateFuture.statements().getJsonObject(0).getString("statement"), expectedQuery);
            ctx.assertEquals(initDateFuture.statements().getJsonObject(0).getJsonArray("values"), expectedParams);
        } catch (Exception e) {
            ctx.assertNull(e);
        }
    }

    @Test
    public void testInsertHolidaysDateStatement_Should_Insert_Correct_Data_Into_SQLStatement(TestContext ctx) {

        JsonObject holiday1 = new JsonObject()
                .put("description", "Noel")
                .put("start_date", "2021-12-17T23:00:00+00:00")
                .put("end_date", "2022-01-02T23:00:00+00:00");

        JsonObject holiday2 = new JsonObject()
                .put("description", "Hiver")
                .put("start_date", "2022-02-18T23:00:00+00:00")
                .put("end_date", "2022-03-06T23:00:00+00:00");

        HolidayRecord holidayRecord1 = new HolidayRecord(holiday1);
        HolidayRecord holidayRecord2 = new HolidayRecord(holiday2);
        List<HolidayRecord> holidayRecordList = Arrays.asList(holidayRecord1, holidayRecord2);

        // expected data
        String expectedQuery = "INSERT INTO viesco.setting_period (start_date, end_date, description, id_structure, is_opening, code) VALUES" +
                "(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?)," +
                "(to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?, ?, ?)";
        JsonArray expectedParams = new JsonArray()
                .add("2021-12-17 00:00:00")
                .add("2022-01-02 00:00:00")
                .add("Noel")
                .add(initDateFuture.structure())
                .add(false)
                .add(Field.EXCLUSION)
                .add("2022-02-18 00:00:00")
                .add("2022-03-06 00:00:00")
                .add("Hiver")
                .add(initDateFuture.structure())
                .add(false)
                .add(Field.EXCLUSION);

        try {
            Whitebox.invokeMethod(initService, "insertHolidaysDateStatement", initDateFuture, holidayRecordList);
            ctx.assertEquals(initDateFuture.statements().getJsonObject(0).getString("statement"), expectedQuery);
            ctx.assertEquals(initDateFuture.statements().getJsonObject(0).getJsonArray("values"), expectedParams);
        } catch (Exception e) {
            ctx.assertNull(e);
        }
    }

}

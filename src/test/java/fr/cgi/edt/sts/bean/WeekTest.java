package fr.cgi.edt.sts.bean;


import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.text.ParseException;
import java.text.SimpleDateFormat;

@RunWith(VertxUnitRunner.class)
public class WeekTest {

    private Week week;
    public static String DATE = "2020-05-12";
    private String DATE_EXPECTED = "2020-05-14";
    private SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
    @Before
    public void init() throws ParseException {
        week = new Week(DATE);
    }

    @Test(expected = ParseException.class)
    public void constructor_Should_ThrowParseException() throws ParseException {
        new Week("");
    }

    @Test
    public void constructor_ShouldNot_ThrowParseException(TestContext ctx) {
        try {
            new Week("2020-05-12");
            ctx.assertTrue(true);
        } catch (ParseException e) {
            ctx.fail(e);
        }
    }

    @Test
    public void getDateOfWeek_With4thDayOfWeekNumber_Should_ReturnsMay14th(TestContext ctx) {
        ctx.assertEquals(sdf.format(week.getDateOfWeek(4)), DATE_EXPECTED);
    }

    @Test
    public void isFutureOrCurrentWeek_Should_Returns_True(TestContext ctx) {
        try {
            Week week = new Week("2099-05-26");
            ctx.assertTrue(week.isFutureOrCurrentWeek());
        } catch (ParseException e) {
            ctx.fail(e);
        }
    }

    @Test
    public void isFutureOrCurrentWeek_Should_Returns_False(TestContext ctx) {
        try {
            Week week = new Week("2017-05-26");
            ctx.assertFalse(week.isFutureOrCurrentWeek());
        } catch (ParseException e) {
            ctx.fail(e);
        }
    }

    @Test
    public void toJSON_Should_Returns_ValidJsonObject(TestContext ctx) {
        JsonObject expected = new JsonObject().put("start", DATE);
        ctx.assertEquals(week.toJSON(), expected);
    }
}

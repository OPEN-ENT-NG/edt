package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.text.ParseException;

@RunWith(VertxUnitRunner.class)
public class AlternationTest {
    Alternation alternation;

    String NAME = "SP";
    String LABEL = "semaine paire";

    @Before
    public void init() {
        alternation = new Alternation(NAME);
    }

    @Test
    public void constructor_Should_Init_WithAnEmptyWeeksList(TestContext ctx) {
        ctx.assertTrue(alternation.weeks().isEmpty());
    }

    @Test
    public void name_Should_Returns_NameValue(TestContext ctx) {
        ctx.assertEquals(alternation.name(), NAME);
    }

    @Test
    public void setLabel_Should_Set_ValidLabel(TestContext ctx) {
        alternation.setLabel(LABEL);
        ctx.assertEquals(alternation.label(), LABEL);
    }

    @Test
    public void putWeek_Should_Insert_WeekInWeeksList(TestContext ctx) {
        try {
            Week week = new Week(WeekTest.DATE);
            alternation.putWeek(week);
            ctx.assertEquals(alternation.weeks().get(0), week);
        } catch (ParseException e) {
            ctx.fail(e);
        }
    }

    @Test
    public void toJSON_Should_Returns_ValidAlternationJsonObject(TestContext ctx) {
        alternation.setLabel(LABEL);
        JsonObject expected = new JsonObject()
                .put("name", NAME)
                .put("label", LABEL)
                .put("weeks", new JsonArray());
        ctx.assertEquals(alternation.toJSON(), expected);
    }
}

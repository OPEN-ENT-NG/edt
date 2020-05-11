package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(VertxUnitRunner.class)
public class SubjectTest {
    Subject subject;

    public static String CODE = "090100";
    public static String NAME = "ARTS PLASTIQUES";

    @Before
    public void init() {
        subject = new Subject().setCode(CODE).setName(NAME);
    }

    @Test
    public void code_Should_Returns_090100(TestContext ctx) {
        ctx.assertEquals(subject.code(), CODE);
    }

    @Test
    public void name_Should_Returns_ArtsPlastiques(TestContext ctx) {
        ctx.assertEquals(subject.name(), NAME);
    }

    @Test
    public void toJSON_Should_Returns_ValidJsonObject(TestContext ctx) {
        JsonObject expected = new JsonObject()
                .put("code", CODE)
                .put("name", NAME);

        ctx.assertEquals(subject.toJSON(), expected);
    }
}

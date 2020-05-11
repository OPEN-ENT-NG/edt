package fr.cgi.edt.sts.bean;

import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(VertxUnitRunner.class)
public class AudienceTest {
    String NAME = "6ALL2-A";

    @Test
    public void constructor_Should_Not_ThrowAnyException(TestContext ctx) {
        try {
            new Audience(AudienceType.CLASS, NAME);
        } catch (Exception e) {
            ctx.fail(e);
        }
    }

    @Test
    public void type_Should_Returns_CorrectAudienceType(TestContext ctx) {
        ctx.assertEquals(new Audience(AudienceType.GROUP, NAME).type(), AudienceType.GROUP);
    }

    @Test
    public void name_Should_Returns_CorrectName(TestContext ctx) {
        ctx.assertEquals(new Audience(AudienceType.GROUP, NAME).name(), NAME);
    }
}

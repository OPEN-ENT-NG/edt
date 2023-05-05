package fr.cgi.edt.audience;

import fr.cgi.edt.models.Audience;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Test;
import org.junit.runner.RunWith;

import static org.mockito.Mockito.mock;

@RunWith(VertxUnitRunner.class)
public class AudienceModelTest {

    private final JsonObject audienceJsonObject_1 = new JsonObject()
            .put("id", "c142699b-38f8-49aa-93dd-45d0fd513e15")
            .put("externalId", "3284$3G")
            .put("name", "3G")
            .put("labels", new JsonArray().add("Class"));

    @Test
    public void testAudienceNotNull(TestContext ctx) {
        JsonObject audienceObjectMock = mock(JsonObject.class);
        Audience audience = new Audience(audienceObjectMock);
        ctx.assertNotNull(audience);
    }

    @Test
    public void testAudienceHasContentWithObject(TestContext ctx) {
        Audience audience = new Audience(audienceJsonObject_1);
        boolean isNotEmpty = !audience.getId().isEmpty() &&
                !audience.getExternalId().isEmpty() &&
                !audience.getName().isEmpty();
        ctx.assertTrue(isNotEmpty);
    }

    @Test
    public void testAudienceHasBeenInstantiated(TestContext ctx) {
        Audience audience = new Audience(audienceJsonObject_1);
        ctx.assertEquals(audience.toJson(), audienceJsonObject_1);
    }
}

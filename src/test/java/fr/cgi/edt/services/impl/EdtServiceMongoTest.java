package fr.cgi.edt.services.impl;
import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.services.EdtService;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.mockito.internal.util.reflection.FieldSetter;
import org.powermock.reflect.Whitebox;

import static fr.cgi.edt.Edt.EDT_COLLECTION;
import static org.mockito.Mockito.mock;


@RunWith(VertxUnitRunner.class)
public class EdtServiceMongoTest {

    MongoDb mongoDb = mock(MongoDb.class);

    private EdtService edtService;

    @Before
    public void setUp(TestContext context) throws NoSuchFieldException {
        this.edtService = new EdtServiceMongoImpl("courses", null);
        FieldSetter.setField(edtService, edtService.getClass().getSuperclass().getDeclaredField("mongo"), mongoDb);
    }

    @Test
    public void testRetrieveRecurrencesDatesPipeline(TestContext ctx) {

        String recurrenceId = "recurrenceId";
        JsonObject expected = expectedRetrieveRecurrencesDatesPipeline(recurrenceId);

        Mockito.doAnswer(invocation -> {
            String query = invocation.getArgument(0);
            ctx.assertEquals(new JsonObject(query), expected);
            return null;
        }).when(mongoDb).command(Mockito.anyString(), Mockito.any(Handler.class));


        try {
            Whitebox.invokeMethod(edtService, "retrieveRecurrencesDates", "recurrenceId");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private JsonObject expectedRetrieveRecurrencesDatesPipeline(String recurrenceId) {
        return new JsonObject()
                .put("aggregate", EDT_COLLECTION)
                .put("allowDiskUse", true)
                .put("cursor", new JsonObject().put("batchSize", 2147483647))
                .put("pipeline", new JsonArray()
                        .add(new JsonObject().put("$match", new JsonObject()
                                .put(Field.RECURRENCE, recurrenceId)
                                .put(Field.DELETED, new JsonObject().put("$exists", false))
                                .put("$or", new JsonArray()
                                        .add(new JsonObject().put("theoretical", new JsonObject().put("$exists", false)))
                                        .add(new JsonObject().put("theoretical", false)))))
                        .add(new JsonObject().put("$group", new JsonObject()
                                .put(Field._ID, "")
                                .put(Field.STARTDATE, new JsonObject().put("$min", "$" + Field.STARTDATE))
                                .put(Field.ENDDATE, new JsonObject().put("$max", "$" + Field.ENDDATE))))
                        .add(new JsonObject().put("$project", new JsonObject()
                                .put(Field._ID, 0)
                                .put(Field.STARTDATE, 1)
                                .put(Field.ENDDATE, 1))));
    }
}

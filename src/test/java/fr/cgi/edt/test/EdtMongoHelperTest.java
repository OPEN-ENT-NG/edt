/*
package fr.cgi.edt.test;
import fr.cgi.edt.utils.EdtMongoHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.Either;
import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.*;

public class EdtMongoHelperTest {

    @Mock
    private MongoDb mongo;

    @InjectMocks
    private EdtMongoHelper helper;

    public EdtMongoHelperTest() {}

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
    }

    @Test
    public void checkTransactionStatus_should_return_200_status() {
        Boolean onError = false;
        List<String> ids = new ArrayList<>();
        ids.add(UUID.randomUUID().toString());
        this.helper.checkTransactionStatus(onError, ids.size(), ids, new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> handler) {
                if (handler.isLeft()) {
                    fail("Handler returned by checkTransactionStatus should be Right");
                } else {
                    JsonObject response = handler.right().getValue();
                    assertEquals(response.getNumber("status"), 200);
                }
            }
        });
    }

    @Test
    @SuppressWarnings("unchecked")
    public void transaction_should_return_200_status() {
        final Message<JsonObject> message = mock(Message.class);
        JsonObject bodyResponse = new JsonObject()
                .put("status", "ok")
                .put("_id", UUID.randomUUID().toString());
        when(message.body()).thenReturn(bodyResponse);
        doAnswer(new Answer<Message<JsonObject>>() {
            @Override
            public Message<JsonObject> answer(InvocationOnMock invocationOnMock) throws Throwable {
                ((Handler<Message<JsonObject>>) invocationOnMock.getArgument(2)).handle(message);
                return null;
            }
        }).when(mongo).save(isA(String.class), isA(JsonObject.class), any(Handler.class));

        JsonArray values = new fr.wseduc.webutils.collections.JsonArray().add(new JsonObject());
        helper.transaction(values, new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> response) {
                if (response.isRight()) {
                    JsonObject body = response.right().getValue();
                    assertEquals(body.getNumber("status"), 200);
                } else {
                    fail("Transaction handler returned should be <Right> : found <Left>");
                }
            }
        });
    }
}
*/

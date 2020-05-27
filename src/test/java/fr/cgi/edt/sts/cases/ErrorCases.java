package fr.cgi.edt.sts.cases;

import fr.cgi.edt.sts.StsCase;
import fr.cgi.edt.sts.StsDAO;
import fr.cgi.edt.sts.StsError;
import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;

import java.util.UUID;

@RunWith(VertxUnitRunner.class)
public class ErrorCases extends StsCase {

    private String DEFAULT_PATH = "./src/main/resources/sts/tests/case8";

    public ErrorCases() {
        super(Mockito.mock(StsDAO.class));
    }

    @Test
    public void importSts_Should_Trigger_ParsingError(TestContext ctx) {
        String path = "./src/main/resources/sts/tests/parsing-error-case";
        expectedError(ctx, path, StsError.PARSING_ERROR);
    }

    @Test
    public void importSts_Should_Trigger_ImportServerError(TestContext ctx) {

        Mockito.doAnswer(invocation -> {
            Future future = invocation.getArgument(1);
            future.fail("This is a fake fail to trigger IMPORT_SERVER_ERROR");
            return null;
        }).when(dao).retrieveStructureIdentifier(Mockito.anyString(), Mockito.any(Future.class));

        expectedError(ctx, DEFAULT_PATH, StsError.IMPORT_SERVER_ERROR);
    }

    @Test
    public void importSts_Should_Trigger_UnknownStructureError(TestContext ctx) {
        mockStructure(new JsonObject());
        expectedError(ctx, DEFAULT_PATH, StsError.UNKNOWN_STRUCTURE_ERROR);
    }

    @Test
    public void importSts_Should_Trigger_Unauthorized(TestContext ctx) {
        JsonObject structure = new JsonObject().put("id", UUID.randomUUID().toString());
        mockStructure(structure);
        expectedError(ctx, DEFAULT_PATH, StsError.UNAUTHORIZED);
    }

    @Test
    public void importSts_Should_Trigger_InsertionError(TestContext ctx) {
        mockStructure();
        Mockito.doAnswer(invocation -> {
            Handler<AsyncResult<Void>> handler = invocation.getArgument(1);
            handler.handle(Future.failedFuture("This is a fake error to trigger INSERTION_ERROR"));
            return null;
        }).when(dao).insertCourses(Mockito.any(JsonArray.class), Mockito.any(Handler.class));

        expectedError(ctx, DEFAULT_PATH, StsError.INSERTION_ERROR);
    }

    @Test
    public void importSts_Should_Trigger_DirectoryReadingError(TestContext ctx) {
        String path = "./src/main/resources/sts/tests/wrong_folder_name";
        expectedError(ctx, path, StsError.DIRECTORY_READING_ERROR);
    }
}

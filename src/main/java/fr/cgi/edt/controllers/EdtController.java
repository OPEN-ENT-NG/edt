package fr.cgi.edt.controllers;

import fr.cgi.edt.security.ManageCourseWorkflowAction;
import fr.cgi.edt.security.ManageSettingsWorkflowAction;
import fr.cgi.edt.services.EdtService;
import fr.cgi.edt.services.UserService;
import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import fr.cgi.edt.services.impl.UserServiceNeo4jImpl;
import fr.wseduc.rs.*;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.http.Renders;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.AsyncResult;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.http.response.DefaultResponseHandler;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.user.UserUtils;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;

import static org.entcore.common.http.response.DefaultResponseHandler.arrayResponseHandler;
import static org.entcore.common.http.response.DefaultResponseHandler.notEmptyResponseHandler;

/**
 * Vert.x backend controller for the application using Mongodb.
 */
public class EdtController extends MongoDbControllerHelper {

    private final EdtService edtService;
    private final UserService userService;

    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);

    private static final String
            read_only 			= "edt.view",
            modify 				= "edt.manage";

    /**
     * Creates a new controller.
     * @param collection Name of the collection stored in the mongoDB database.
     */
    public EdtController(String collection, EventBus eb) {
        super(collection);
        edtService = new EdtServiceMongoImpl(collection, eb);
        userService = new UserServiceNeo4jImpl();
    }

    /**
     * Displays the home view.
     * @param request Client request
     */
    @Get("")
    @SecuredAction(read_only)
    public void view(HttpServerRequest request) {
        renderView(request);
    }

    private Handler<Either<String, JsonObject>> getServiceHandler (final HttpServerRequest request) {
        return new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> result) {
                if (result.isRight()) {
                    renderJson(request, result.right().getValue());
                } else {
                    renderError(request);
                }
            }
        };
    }

    @Post("/course")
    @SecuredAction(modify)
    @ApiDoc("Create a course with 1 or more occurrences")
    public void create(final HttpServerRequest request) {
        RequestUtils.bodyToJsonArray(request, body -> edtService.create(body, getServiceHandler(request)));
    }

    @Put("/course")
    @SecuredAction(value = "", type = ActionType.RESOURCE)
    @ResourceFilter(ManageCourseWorkflowAction.class)
    @ApiDoc("Update course")
    public void update (final HttpServerRequest request) {
        RequestUtils.bodyToJsonArray(request, body -> edtService.update(body, getServiceHandler(request)));
    }

    @Put("/occurrence/:timestamp")
    @SecuredAction(value = "", type = ActionType.RESOURCE)
    @ResourceFilter(ManageCourseWorkflowAction.class)
    @ApiDoc("Update course occurrence")
    public void updateOccurrence (final HttpServerRequest request) {
        RequestUtils.bodyToJsonArray(request, (body) -> {
            String dateOccurrence = request.getParam("timestamp");
            edtService.updateOccurrence(body.getJsonObject(0), dateOccurrence, getServiceHandler(request));
        });
    }

    @Get("/user/children")
    @SecuredAction(value = "", type = ActionType.AUTHENTICATED)
    @ApiDoc("Return information needs by relative profiles")
    public void getChildrenInformation(final HttpServerRequest request) {
        UserUtils.getUserInfos(eb, request, user -> userService.getChildrenInformation(user, arrayResponseHandler(request)));
    }

    @Delete("/course/:id")
    @SecuredAction(value = "", type = ActionType.RESOURCE)
    @ResourceFilter(ManageSettingsWorkflowAction.class)
    @ApiDoc("Delete a course")
    public void delete (final HttpServerRequest request) {
        try {
            String id = request.params().get("id");
            edtService.delete(id, notEmptyResponseHandler(request));
        } catch (ClassCastException e) {
            log.error("");
            badRequest(request);
        }
    }

    @Delete("/occurrence/:timestamp/:id")
    @SecuredAction(value = "", type = ActionType.RESOURCE)
    @ResourceFilter(ManageCourseWorkflowAction.class)
    @ApiDoc("delete course occurrence")
    public void deleteOccurrence (final HttpServerRequest request) {
        String dateOccurrence = request.getParam("timestamp");
        String id = request.params().get("id");
        edtService.deleteOccurrence(id,dateOccurrence, notEmptyResponseHandler(request));
    }

    @Get("/time-slots")
    @SecuredAction(value = "", type = ActionType.AUTHENTICATED)
    public void getSlots(final HttpServerRequest request) {
        if (!request.params().contains("structureId")){
            badRequest(request);
        }
        String structureId = request.getParam("structureId");
        JsonObject action = new JsonObject()
                .put("action", "timeslot.getSlotProfiles")
                .put("structureId", structureId);

        Handler<Either<String, JsonArray>> handler = DefaultResponseHandler.arrayResponseHandler(request);
            eb.send("viescolaire", action, (Handler<AsyncResult<Message<JsonObject>>>) event -> {
                String status = event.result().body().getString("status");
                JsonObject body = event.result().body();
                JsonArray slots = new JsonArray();
                if ("ok".equals(status) && body.getJsonObject("result").containsKey("slots")
                        && !body.getJsonObject("result").getJsonArray("slots").isEmpty()) {
                        slots = body.getJsonObject("result").getJsonArray("slots");
                        Renders.renderJson(request, slots);
                }
                else if ("ok".equals(status) && body.getJsonObject("result").getJsonArray("slots").isEmpty()) {
                    Renders.noContent(request);
                }
                else {
                    LOGGER.error("[EDT@DefaultRegistrerService] Failed to retrieve slot profile");
                    String message = "[Edt@DefaultRegisterService] Failed to parse slots";
                    handler.handle(new Either.Left<>(message));
                }
            });
    }

}

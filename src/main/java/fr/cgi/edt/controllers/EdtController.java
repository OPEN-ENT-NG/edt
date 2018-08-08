package fr.cgi.edt.controllers;

import fr.cgi.edt.Edt;
import fr.cgi.edt.security.ManageCourseWorkflowAction;
import fr.cgi.edt.security.ManageSettingsWorkflowAction;
import fr.cgi.edt.services.EdtService;
import fr.cgi.edt.services.SettingsService;
import fr.cgi.edt.services.UserService;
import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import fr.cgi.edt.services.impl.SettingsServicePostgresImpl;
import fr.cgi.edt.services.impl.UserServiceNeo4jImpl;
import fr.wseduc.rs.*;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.request.RequestUtils;
import org.entcore.common.http.filter.ResourceFilter;
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
    private final SettingsService settingsService;

    private static final String
            read_only 			= "edt.view",
            modify 				= "edt.create",
            manage              = "edt.manage";

    /**
     * Creates a new controller.
     * @param collection Name of the collection stored in the mongoDB database.
     */
    public EdtController(String collection) {
        super(collection);
        edtService = new EdtServiceMongoImpl(collection);
        userService = new UserServiceNeo4jImpl();
        settingsService = new SettingsServicePostgresImpl(Edt.EDT_SCHEMA, Edt.EXCLUSION_TABLE);
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

    @Get("/settings/exclusions")
    @SecuredAction(value = "", type = ActionType.AUTHENTICATED)
    @ApiDoc("List all exclusions")
    public void getExclusion (final HttpServerRequest request) {
        if (!request.params().contains("structureId")) {
            badRequest(request);
        } else {
            settingsService.listExclusion(request.params().get("structureId"),
                    arrayResponseHandler(request));
        }
    }

    @Post("/settings/exclusion")
    @SecuredAction(manage)
    @ApiDoc("Create a period exclusion")
    public void createExclusion (final HttpServerRequest request) {
        RequestUtils.bodyToJson(request, pathPrefix + Edt.EXCLUSION_JSON_SCHEMA,
                exclusion -> settingsService.createExclusion(exclusion, arrayResponseHandler(request)));
    }

    //TODO Manage security. Switch authenticated filter to ressource filter
    @Put("/settings/exclusion/:id")
    @SecuredAction(value = "", type = ActionType.RESOURCE)
    @ResourceFilter(ManageSettingsWorkflowAction.class)
    @ApiDoc("Update a period exclusion based on provided id")
    public void updateExclusion (final HttpServerRequest request) {
        try {
            final Integer id = Integer.parseInt(request.params().get("id"));
            RequestUtils.bodyToJson(request, pathPrefix + Edt.EXCLUSION_JSON_SCHEMA,
                    exclusion -> settingsService.updateExclusion(id, exclusion, arrayResponseHandler(request)));
        } catch (ClassCastException e) {
            log.error("E008 : An error occurred when casting exclusion id");
            badRequest(request);
        }
    }

    //TODO Manage security. Switch authenticated filter to resource filter
    @Delete("/settings/exclusion/:id")
    @SecuredAction(value = "", type = ActionType.RESOURCE)
    @ResourceFilter(ManageSettingsWorkflowAction.class)
    @ApiDoc("Delete a period exclusion based on provided id")
    public void deleteExclusion (final HttpServerRequest request) {
        try {
            Integer id = Integer.parseInt(request.params().get("id"));
            settingsService.deleteExclusion(id, arrayResponseHandler(request));
        } catch (ClassCastException e) {
            log.error("E009 : An error occurred when casting exclusion id");
            badRequest(request);
        }
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

}

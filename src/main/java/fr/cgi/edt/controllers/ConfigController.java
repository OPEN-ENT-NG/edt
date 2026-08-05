package fr.cgi.edt.controllers;


import fr.wseduc.rs.Get;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import org.entcore.common.controller.ControllerHelper;
import org.entcore.common.http.filter.AdminFilter;
import org.entcore.common.http.filter.ResourceFilter;

public class ConfigController extends ControllerHelper {

    @Get("/config")
    @SecuredAction(value = "", type = ActionType.RESOURCE)
    @ResourceFilter(AdminFilter.class)
    public void getConfig(final HttpServerRequest request) {
        renderJson(request, config);
    }

    @Get("/conf/public")
    @SecuredAction(value = "", type = ActionType.AUTHENTICATED)
    public void getPublicConf(final HttpServerRequest request) {
        renderJson(request, config.getJsonObject("publicConf", new JsonObject()));
    }
}

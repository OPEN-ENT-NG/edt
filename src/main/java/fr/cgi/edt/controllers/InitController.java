package fr.cgi.edt.controllers;

import fr.cgi.edt.core.enums.Zone;
import fr.cgi.edt.security.WorkflowActionUtils;
import fr.cgi.edt.services.InitService;
import fr.wseduc.rs.Get;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import org.entcore.common.controller.ControllerHelper;

public class InitController extends ControllerHelper {

    private final InitService initService;
    private final Vertx vertx;

    public InitController(InitService initService, Vertx vertx) {
        this.initService = initService;
        this.vertx = vertx;
    }

    @Get("/init/:id")
    @SecuredAction(value = WorkflowActionUtils.VIESCO_SETTING_INIT_DATA, type = ActionType.WORKFLOW)
    public void initPeriod(final HttpServerRequest request) {
        String structure = request.getParam("id");
        String zone = request.getParam("zone");
        if (Boolean.TRUE.equals(isValidZone(zone))) {
            initService.init(structure, zone, event -> {
                if (event.isRight()) {
                    renderJson(request, event.right().getValue());
                } else {
                    String message = "[EDT@InitController::initPeriod] Failed to initialize structure ";
                    log.error(message + event.left().getValue());
                    badRequest(request);
                }
            });
        } else {
            String message = String.format("[EDT@%s::initPeriod] Wrong zone value: %s", this.getClass().getSimpleName(), zone);
            log.error(message);
            badRequest(request);
        }

    }

    private Boolean isValidZone(String zone) {
        return Zone.A.zone().equals(zone) || Zone.B.zone().equals(zone) || Zone.C.zone().equals(zone);
    }
}


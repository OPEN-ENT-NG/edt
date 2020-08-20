package fr.cgi.edt.controllers;

import fr.cgi.edt.security.WorkflowActionUtils;
import fr.cgi.edt.services.InitService;
import fr.wseduc.rs.Get;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import io.vertx.core.http.HttpServerRequest;
import org.entcore.common.controller.ControllerHelper;

public class InitController extends ControllerHelper {

    private final InitService initService;

    public InitController(InitService initService) {
        this.initService = initService;
    }

    @Get("/init/:id")
    @SecuredAction(value = WorkflowActionUtils.VIESCO_SETTING_INIT_DATA, type = ActionType.WORKFLOW)
    public void initPeriod(final HttpServerRequest request) {
        String structure = request.getParam("id");
        initService.init(structure, event -> {
            if (event.isRight()) {
                renderJson(request, event.right().getValue());
            } else {
                String message = "[EDT@InitController::initPeriod] Failed to initialize structure ";
                log.error(message + event.left().getValue());
                badRequest(request);
            }
        });
    }

}


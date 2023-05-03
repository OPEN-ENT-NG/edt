package fr.cgi.edt.controllers;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.core.enums.Zone;
import fr.cgi.edt.security.WorkflowActionUtils;
import fr.cgi.edt.services.InitService;
import fr.cgi.edt.services.ServiceFactory;
import fr.wseduc.rs.Get;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import io.vertx.core.http.HttpServerRequest;
import org.entcore.common.controller.ControllerHelper;

public class InitController extends ControllerHelper {

    private final InitService initService;

    public InitController(ServiceFactory serviceFactory) {
        this.initService = serviceFactory.initService();
        this.vertx = serviceFactory.vertx();
    }

    @Get("/init/:id")
    @SecuredAction(value = WorkflowActionUtils.VIESCO_SETTING_INIT_DATA, type = ActionType.WORKFLOW)
    public void initPeriod(final HttpServerRequest request) {
        String structure = request.getParam(Field.ID);
        String zone = request.getParam(Field.ZONE);
        boolean initSchoolYear = request.getParam(Field.INITSCHOOLYEAR) == null || Boolean.parseBoolean(request.getParam(Field.INITSCHOOLYEAR));
        if (Boolean.TRUE.equals(isValidZone(zone))) {
            initService.init(structure, zone, initSchoolYear)
                    .onFailure(err -> {
                        String message = "[EDT@InitController::initPeriod] Failed to initialize structure ";
                        log.error(message + err.getMessage());
                        badRequest(request);
                    })
                    .onSuccess(event -> renderJson(request, event));

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


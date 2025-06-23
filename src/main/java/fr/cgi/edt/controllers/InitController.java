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

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.stream.Stream;

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
        String schoolYearStartDate = request.getParam(Field.SCHOOLYEAR_START_DATE);
        String schoolYearEndDate = request.getParam(Field.SCHOOLYEAR_END_DATE);

        if (structure == null || zone == null || schoolYearStartDate == null || schoolYearEndDate == null) {
            badRequest(request);
            return;
        }

        boolean initSchoolYear = request.getParam(Field.INITSCHOOLYEAR) == null || Boolean.parseBoolean(request.getParam(Field.INITSCHOOLYEAR));

        if (Boolean.TRUE.equals(isValidZone(zone))) {
            initService.init(structure, zone, initSchoolYear, schoolYearStartDate, schoolYearEndDate)
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
        return Stream.of(Zone.values()).anyMatch(z -> z.zone().equals(zone));
    }
}


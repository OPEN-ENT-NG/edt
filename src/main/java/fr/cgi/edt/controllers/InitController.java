package fr.cgi.edt.controllers;

import fr.cgi.edt.services.InitService;
import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import fr.cgi.edt.services.impl.UserServiceNeo4jImpl;
import fr.wseduc.rs.Get;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import org.entcore.common.controller.ControllerHelper;

public class InitController extends ControllerHelper {

    private InitService initService;

    public InitController(InitService initService) {
        this.initService = initService;
    }

    @Get("/init")
    @SecuredAction(value = "", type = ActionType.AUTHENTICATED)
    public void initHomeworksType(final HttpServerRequest request) {

        initService.init(new Handler<Either<String, JsonObject>>() {
            @Override
            public void handle(Either<String, JsonObject> event) {
                if (event.isRight()) {
                    renderJson(request, event.right().getValue());
                } else {
                    log.error("Error when init");
                    badRequest(request);
                }
            }
        });
    }

}


package fr.cgi.edt.controllers;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.services.CourseTagService;
import fr.cgi.edt.services.InitService;
import fr.cgi.edt.services.ServiceFactory;
import fr.cgi.edt.services.impl.DefaultCourseTagService;
import fr.wseduc.bus.BusAddress;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonObject;
import org.entcore.common.bus.BusResponseHandler;
import org.entcore.common.controller.ControllerHelper;
import org.entcore.common.sql.Sql;


public class EventBusController extends ControllerHelper {


    private final CourseTagService courseTagService;
    private final InitService initService;

    public EventBusController(ServiceFactory serviceFactory, Sql sql, MongoDb mongoDb) {
        this.eb = serviceFactory.eventBus();
        this.courseTagService = new DefaultCourseTagService(sql, mongoDb);
        this.initService = serviceFactory.initService();
    }


    @BusAddress("fr.cgi.edt")
    public void bus(final Message<JsonObject> message) {
        JsonObject body = message.body();
        String action = body.getString("action");
        String structureId;

        switch (action) {
            case "get-course-tags":
                structureId = body.getString(Field.STRUCTUREID);
                this.courseTagService.getCourseTags(structureId,
                        BusResponseHandler.busArrayHandler(message));
                break;
            case "init":
                structureId = body.getString(Field.STRUCTUREID);
                String zone = body.getString(Field.ZONE);
                boolean initSchoolYear = body.getBoolean(Field.INITSCHOOLYEAR, false);
                this.initService.init(structureId, zone, initSchoolYear)
                        .onFailure(e -> message.reply(new JsonObject()
                                .put(Field.STATUS, Field.ERROR)
                                .put(Field.MESSAGE, e.getMessage())))
                        .onSuccess(v -> message.reply(new JsonObject()));
                break;
            default:
                message.reply(new JsonObject()
                        .put(Field.STATUS, Field.ERROR)
                        .put(Field.MESSAGE, "Invalid action."));
        }
    }








}

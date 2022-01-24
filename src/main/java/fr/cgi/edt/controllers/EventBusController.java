package fr.cgi.edt.controllers;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.services.CourseTagService;
import fr.cgi.edt.services.impl.DefaultCourseTagService;
import fr.wseduc.bus.BusAddress;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.bus.BusResponseHandler;
import org.entcore.common.controller.ControllerHelper;
import org.entcore.common.sql.Sql;

import java.util.List;

public class EventBusController extends ControllerHelper {


    private final CourseTagService courseTagService;
    private final MongoDb mongoDb;
    private final Sql sql;

    public EventBusController(EventBus eb, Sql sql, MongoDb mongoDb) {
        this.eb = eb;
        this.sql = sql;
        this.mongoDb = mongoDb;
        this.courseTagService = new DefaultCourseTagService(sql, mongoDb);
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
            default:
                message.reply(new JsonObject()
                        .put("status", "error")
                        .put("message", "Invalid action."));
        }
    }








}

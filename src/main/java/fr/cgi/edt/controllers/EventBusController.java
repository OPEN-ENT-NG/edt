package fr.cgi.edt.controllers;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.helper.IModelHelper;
import fr.cgi.edt.models.InitFormTimetable;
import fr.cgi.edt.models.Timeslot;
import fr.cgi.edt.services.CourseService;
import fr.cgi.edt.services.CourseTagService;
import fr.cgi.edt.services.InitService;
import fr.cgi.edt.services.ServiceFactory;
import fr.cgi.edt.services.impl.DefaultCourseTagService;
import fr.cgi.edt.utils.DateHelper;
import fr.wseduc.bus.BusAddress;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.bus.BusResponseHandler;
import org.entcore.common.controller.ControllerHelper;

import java.text.ParseException;
import java.util.Date;
import java.util.List;


public class EventBusController extends ControllerHelper {


    private final CourseTagService courseTagService;
    private final InitService initService;

    private final CourseService courseService;

    public EventBusController(ServiceFactory serviceFactory) {
        this.eb = serviceFactory.eventBus();
        this.courseTagService = new DefaultCourseTagService(serviceFactory.sql(), serviceFactory.mongoDb());
        this.initService = serviceFactory.initService();
        this.courseService = serviceFactory.courseService();
    }


    @BusAddress("fr.cgi.edt")
    public void bus(final Message<JsonObject> message) {
        JsonObject body = message.body();
        String action = body.getString("action");
        String structureId;
        String subjectId;

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
                String schoolYearStartDate = body.getString(Field.SCHOOLYEAR_START_DATE);
                String schoolYearEndDate = body.getString(Field.SCHOOLYEAR_END_DATE);
                this.initService.init(structureId, zone, initSchoolYear, schoolYearStartDate, schoolYearEndDate)
                        .onFailure(e -> message.reply(new JsonObject()
                                .put(Field.STATUS, Field.ERROR)
                                .put(Field.MESSAGE, e.getMessage())))
                        .onSuccess(v -> message.reply(
                                new JsonObject()
                                        .put(Field.STATUS, Field.OK)
                                        .put(Field.RESULT, v)));
                break;
            case "init-courses":
                structureId = body.getString(Field.STRUCTUREID);
                subjectId = body.getString(Field.SUBJECTID);
                Date startDate;
                Date endDate;
                try {
                    startDate = DateHelper.parse(body.getString(Field.STARTDATE));
                    endDate = DateHelper.parse(body.getString(Field.ENDDATE));
                } catch (ParseException e) {
                    message.reply(new JsonObject()
                            .put(Field.STATUS, Field.ERROR)
                            .put(Field.MESSAGE, e.getMessage()));
                    return;
                }
                String userId = body.getString(Field.USERID);
                List<Timeslot> timeslots = IModelHelper.toList(body.getJsonArray(Field.TIMESLOTS, new JsonArray()), Timeslot.class);
                InitFormTimetable initFormTimetable = new InitFormTimetable(body.getJsonObject(Field.TIMETABLE));
                this.courseService.createInitCourses(structureId, subjectId, startDate, endDate, initFormTimetable,
                                timeslots, userId)
                        .onFailure(e -> message.reply(new JsonObject()
                                .put(Field.STATUS, Field.ERROR)
                                .put(Field.MESSAGE, e.getMessage())))
                        .onSuccess(v -> message.reply(
                                new JsonObject()
                                        .put(Field.STATUS, Field.OK)
                                        .put(Field.RESULT, v)));
                break;
            case "delete-courses-subject":
                structureId = body.getString(Field.STRUCTUREID);
                subjectId = body.getString(Field.SUBJECTID);
                this.courseService.deleteCoursesWithSubjectId(structureId, subjectId)
                        .onFailure(e -> message.reply(new JsonObject()
                                .put(Field.STATUS, Field.ERROR)
                                .put(Field.MESSAGE, e.getMessage())))
                        .onSuccess(v -> message.reply(
                                new JsonObject()
                                        .put(Field.STATUS, Field.OK)
                                        .put(Field.RESULT, v)));
                break;

            default:
                message.reply(new JsonObject()
                        .put(Field.STATUS, Field.ERROR)
                        .put(Field.MESSAGE, "Invalid action."));
        }
    }








}

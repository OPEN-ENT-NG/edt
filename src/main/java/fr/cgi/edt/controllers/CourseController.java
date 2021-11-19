package fr.cgi.edt.controllers;


import fr.cgi.edt.services.CourseService;
import fr.cgi.edt.services.impl.DefaultCourseService;
import fr.wseduc.rs.*;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import org.entcore.common.controller.ControllerHelper;
import org.entcore.common.user.UserUtils;

import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Vert.x backend controller for the application using Mongodb.
 */
public class CourseController extends ControllerHelper {

    private final CourseService courseService;

    public CourseController(EventBus eb, CourseService courseService) {
        this.courseService = courseService;
    }

    @Post("/structures/:structureId/common/courses/:startAt/:endAt")
    @ApiDoc("get courses")
    public void getCourses(final HttpServerRequest request) {
        RequestUtils.bodyToJson(request, event -> {
            final String structureId = request.getParam("structureId");
            final String startAt = request.getParam("startAt");
            final String endAt = request.getParam("endAt");
            final JsonArray teacherIds = event.getJsonArray("teacherIds");
            final JsonArray groupIds = event.getJsonArray("groupIds");
            final JsonArray groupExternalIds = new JsonArray(event.getJsonArray("groupExternalIds").stream()
                    .filter(Objects::nonNull).collect(Collectors.toList()));
            final JsonArray groupNames = event.getJsonArray("groupNames");
            final String startTime = event.getString("startTime");
            final String endTime = event.getString("endTime");
            final Boolean union = event.getBoolean("union");
            final Boolean crossDateFilter = event.getBoolean("crossDateFilter");

            UserUtils.getUserInfos(eb, request, user -> courseService.getCourses(structureId, startAt, endAt, teacherIds, groupIds, groupExternalIds, groupNames,
                            startTime, endTime, union, crossDateFilter, user)
                    .onSuccess(result -> renderJson(request, result))
                    .onFailure(err -> badRequest(request)));
        });
    }
}

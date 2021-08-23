package fr.cgi.edt.services.impl;

import fr.cgi.edt.Edt;
import fr.cgi.edt.services.CourseService;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

public class DefaultCourseService implements CourseService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DefaultCourseService.class);
    private final EventBus eb;

    public DefaultCourseService(EventBus eb) {
        this.eb = eb;
    }


    @Override
    public Future<JsonArray> getCourses(String structureId, String startAt, String endAt, JsonArray teacherIds, JsonArray groupIds,
                           JsonArray groupExternalIds, JsonArray groupNames, String startTime, String endTime,
                           Boolean union, Boolean crossDateFilter) {
        JsonObject action = new JsonObject()
                .put("action", "course.getCoursesOccurences")
                .put("structureId", structureId)
                .put("begin", startAt)
                .put("end", endAt)
                .put("startTime", startTime)
                .put("endTime", endTime)
                .put("teacherId", teacherIds)
                .put("groupIds", groupIds)
                .put("groupExternalIds", groupExternalIds)
                .put("group", groupNames)
                .put("crossDateFilter", crossDateFilter != null ? crossDateFilter.toString() : null)
                .put("union", union != null ? union.toString() : null);

        Promise<JsonArray> promise = Promise.promise();

        eb.request(Edt.EB_VIESCO_ADDRESS, action, event -> {
            JsonObject body = (JsonObject) event.result().body();
            if (event.succeeded() && "ok".equals(body.getString("status"))) {
                promise.complete(body.getJsonArray("results"));
            } else {
                promise.fail(event.cause().getMessage());
            }
        });

        return promise.future();
    }
}


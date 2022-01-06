package fr.cgi.edt.services.impl;

import fr.cgi.edt.Edt;
import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.models.CourseTag;
import fr.cgi.edt.services.CourseService;
import fr.cgi.edt.services.CourseTagService;
import fr.cgi.edt.utils.DateHelper;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.sql.Sql;
import org.entcore.common.user.UserInfos;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class DefaultCourseService implements CourseService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DefaultCourseService.class);
    private final EventBus eb;

    private final CourseTagService courseTagService;

    public DefaultCourseService(EventBus eb, Sql sql, MongoDb mongoDb) {
        this.eb = eb;
        this.courseTagService = new DefaultCourseTagService(sql, mongoDb);
    }


    @Override
    public Future<JsonArray> getCourses(String structureId, String startAt, String endAt, JsonArray teacherIds, JsonArray groupIds,
                                        JsonArray groupExternalIds, JsonArray groupNames, String startTime, String endTime,
                                        Boolean union, Boolean crossDateFilter, UserInfos user) {

        Promise<JsonArray> promise = Promise.promise();

        boolean isTeacherOrPersonnel = user != null
                && ("Personnel".equals(user.getType()) || "Teacher".equals(user.getType()));

        Future<List<JsonObject>> getCoursesOccurrencesFuture = getCoursesOccurrences(structureId, startAt, endAt, teacherIds, groupIds, groupExternalIds, groupNames,
                startTime, endTime, union, crossDateFilter);

        Future<List<CourseTag>> getCourseTagsFuture = courseTagService.getCourseTags(structureId);

        CompositeFuture.all(getCoursesOccurrencesFuture, getCourseTagsFuture)
                .onFailure(fail -> promise.fail(fail.getMessage()))
                .onSuccess(ar -> {
                    List<JsonObject> courses = getCoursesOccurrencesFuture.result();
                    addTagsToCourses(courses, getCourseTagsFuture.result());

                    promise.complete(new JsonArray(isTeacherOrPersonnel ? courses : filterFromTagPriority(courses)));
                });

        return promise.future();
    }

    @SuppressWarnings("unchecked")
    private Future<List<JsonObject>> getCoursesOccurrences(String structureId, String startAt, String endAt, JsonArray teacherIds, JsonArray groupIds,
                                                  JsonArray groupExternalIds, JsonArray groupNames, String startTime, String endTime,
                                                  Boolean union, Boolean crossDateFilter) {
        Promise<List<JsonObject>> promise = Promise.promise();


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

        eb.request(Edt.EB_VIESCO_ADDRESS, action, event -> {
            JsonObject body = (JsonObject) event.result().body();
            if (event.succeeded() && "ok".equals(body.getString("status"))) {

                promise.complete(body.getJsonArray("results", new JsonArray()).getList());
            } else {
                promise.fail(event.cause().getMessage());
            }
        });
        return promise.future();
    }

    @SuppressWarnings("unchecked")
    private void addTagsToCourses(List<JsonObject> courses, List<CourseTag> tags) {
        courses.forEach(course -> {
            JsonArray courseTags = new JsonArray();

            List<Integer> tagIds = course.getJsonArray(Field.TAGIDS, new JsonArray()).getList();
            if (tags != null && !tags.isEmpty() && !tagIds.contains(null)) {
                tags.forEach(tag -> {
                    if (tagIds.stream().anyMatch(id -> Objects.equals(id.longValue(), tag.getId()))) {
                        courseTags.add(tag.toJSON());
                    }
                });
            }

            course.put(Field.TAGS, courseTags);
        });
    }

    @SuppressWarnings("unchecked")
    /*
      Check if tagless course is conflicting with a course with a tag and a priority set to primary and remove
     */
    private List<JsonObject> filterFromTagPriority(List<JsonObject> courses) {

        return courses.stream().filter(course ->
                courseHasLabels(course) ||
                        (!courseHasLabels(course) && courses.stream().noneMatch(courseWithLabels -> courseHasLabels(courseWithLabels)
                                && ((List<JsonObject>) courseWithLabels.getJsonArray(Field.TAGS, new JsonArray()).getList())
                                .stream().anyMatch(tag -> tag.getBoolean(Field.ISPRIMARY, false))

                                && ((DateHelper.isAfterOrEquals(courseWithLabels.getString(Field.STARTDATE), course.getString(Field.STARTDATE))
                                    && DateHelper.isAfter(course.getString(Field.ENDDATE), courseWithLabels.getString(Field.STARTDATE)))
                                    || (DateHelper.isAfter(courseWithLabels.getString(Field.ENDDATE), course.getString(Field.STARTDATE))
                                    && DateHelper.isAfterOrEquals(course.getString(Field.ENDDATE), courseWithLabels.getString(Field.ENDDATE)))
                                    || (DateHelper.isAfterOrEquals(course.getString(Field.STARTDATE), courseWithLabels.getString(Field.STARTDATE))
                                        && DateHelper.isAfterOrEquals(courseWithLabels.getString(Field.ENDDATE), course.getString(Field.ENDDATE))))


                        ))).collect(Collectors.toList());
    }

    private boolean courseHasLabels(JsonObject course) {
        return course.getJsonArray(Field.TAGS, new JsonArray()).size() > 0;
    }


}


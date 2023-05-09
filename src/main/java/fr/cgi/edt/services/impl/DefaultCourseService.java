package fr.cgi.edt.services.impl;

import fr.cgi.edt.Edt;
import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.core.enums.DayOfWeek;
import fr.cgi.edt.helper.FutureHelper;
import fr.cgi.edt.helper.IModelHelper;
import fr.cgi.edt.models.*;
import fr.cgi.edt.services.CourseService;
import fr.cgi.edt.services.CourseTagService;
import fr.cgi.edt.services.ServiceFactory;
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
import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;
import org.entcore.common.sql.Sql;
import org.entcore.common.sql.SqlResult;
import org.entcore.common.user.UserInfos;

import java.util.*;
import java.util.stream.Collectors;

public class DefaultCourseService implements CourseService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DefaultCourseService.class);
    private final EventBus eb;
    private final Neo4j neo4j;
    private final MongoDb mongoDb;
    private final Sql sql;

    private final CourseTagService courseTagService;

    public DefaultCourseService(ServiceFactory serviceFactory) {
        this.eb = serviceFactory.eventBus();
        this.neo4j = serviceFactory.neo4j();
        this.sql = serviceFactory.sql();
        this.mongoDb = serviceFactory.mongoDb();
        this.courseTagService = new DefaultCourseTagService(serviceFactory.sql(), serviceFactory.mongoDb());
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


    @Override
    public Future<Void> createInitCourses(String structureId, String subjectId, Date startDate, Date endDate,
                                                InitFormTimetable timetable, List<Timeslot> timeslots, String userId) {
        Promise<Void> promise = Promise.promise();

        List<Future<JsonObject>> coursesFuture = new ArrayList<>();

        this.getServicesForCourses(structureId)
                        .onFailure(fail -> promise.fail(fail.getMessage()))
                                .onSuccess(services -> {
                                    services.forEach(service -> coursesFuture.add(createInitCourse(structureId, subjectId,
                                            service, startDate, endDate, timetable, timeslots, userId)));

                                    FutureHelper.all(coursesFuture)
                                            .onFailure(fail -> {
                                                String message = String.format("[EDT@%s::createInitCourses] Failed to " +
                                                        "create init courses %s", this.getClass().getSimpleName(), fail.getMessage());
                                                LOGGER.error(message);
                                                promise.fail(fail.getMessage());
                                            })
                                            .onSuccess(ar -> promise.complete());
                                });


        return promise.future();
    }


    private Future<JsonObject> createInitCourse(String structureId, String subjectId, FormattedService service, Date startDate, Date endDate,
                                                InitFormTimetable timetable, List<Timeslot> timeslots, String userId) {
        Promise<JsonObject> promise = Promise.promise();

        List<DayOfWeek> days = Arrays.asList(DayOfWeek.values());
        List<Course> courses = new ArrayList<>();
        Timeslot morningStart = timeslots.get(0);
        Timeslot morningEnd = timeslots.stream()
                .filter(timeslot -> timeslot.getEndHour().equals(timetable.getMorning().getString(Field.ENDHOUR)))
                .findFirst().orElse(null);

        Timeslot afternoonStart = timeslots.stream()
                .filter(timeslot -> timeslot.getStartHour().equals(timetable.getAfternoon().getString(Field.STARTHOUR)))
                .findFirst().orElse(null);
        Timeslot afternoonEnd = timeslots.get(timeslots.size() - 1);

        Future<Audience> classFuture = this.getAudienceFromId(service.getAudienceId(), false);
        Future<Audience> groupFuture = this.getAudienceFromId(service.getAudienceId(), true);

        CompositeFuture.all(classFuture, groupFuture)
                .onFailure(fail -> promise.fail(fail.getMessage()))
                .onSuccess(ar -> {
                    Audience clazz = ar.resultAt(0);
                    Audience group = ar.resultAt(1);

                    days.forEach(day -> {
                        boolean isFullDay = timetable.getFullDays().stream().anyMatch(fullDay -> fullDay == day);
                        courses.addAll(this.initCourseOccurences(day, morningStart, morningEnd, startDate, endDate));
                        if (isFullDay) {
                            courses.addAll(this.initCourseOccurences(day, afternoonStart, afternoonEnd, startDate, endDate));
                        }
                    });

                    courses.forEach(course -> {
                        course.setId(UUID.randomUUID().toString());
                        course.setStructureId(structureId);
                        course.setSubjectId(subjectId);
                        course.setTeacherIds(service.getTeacherIds());
                        course.setLastUser(userId);
                        course.setGroupsIds(Collections.singletonList(group.getId()));
                        course.setGroups(Collections.singletonList(group.getName()));
                        course.setGroupsExternalIds(Collections.singletonList(group.getExternalId()));
                        course.setClassesIds(Collections.singletonList(clazz.getId()));
                        course.setClasses(Collections.singletonList(clazz.getName()));
                        course.setClassesExternalIds(Collections.singletonList(clazz.getExternalId()));
                        course.setManual(true);
                        course.setUpdated(DateHelper.getDateString(new Date(), DateHelper.SQL_FORMAT));
                        course.setRoomLabels(Collections.singletonList(null));
                        course.setTagIds(Collections.singletonList(null));
                    });

                    mongoDb.insert("courses", IModelHelper.toJsonArray(courses),
                            MongoDbResult.validResultHandler(FutureHelper.handlerJsonObject(promise.future())));

                });


        return promise.future();
    }

    /**
     * Init course occurrences for a week day
     * @param day day of week
     * @param start start timeslot
     * @param end end timeslot
     * @param startDate school year start date
     * @param endDate school year end date
     * @return list of courses
     */
    private List<Course> initCourseOccurences(DayOfWeek day, Timeslot start, Timeslot end, Date startDate, Date endDate) {
        List<Course> courses = new ArrayList<>();
        String recurrenceId = UUID.randomUUID().toString();
        for (Date date = DateHelper.goToNextDayOfWeek(DateHelper.addDays(new Date().after(startDate) ? new Date() : startDate, -1), day);
             endDate.after(date); date = DateHelper.addDays(date, 7)) {
            Course course = new Course();
            course.setRecurrence(recurrenceId);
            course.setDayOfWeek(day.ordinal());
            course.setIdStartSlot(start.getId());
            course.setIdEndSlot(end.getId());
            course.setStartDate(DateHelper.getStringFromDateWithTime(date, start.getStartHour(), DateHelper.HOUR_MINUTES));
            course.setEndDate(DateHelper.getStringFromDateWithTime(date, end.getEndHour(), DateHelper.HOUR_MINUTES));
            courses.add(course);
        }

        return courses;
    }


    @Override
    public Future<Audience> getAudienceFromId(String audienceId, boolean isGroup) {
        Promise<Audience> promise = Promise.promise();

        String query = "MATCH (a:" + (isGroup ? "Group" : "Class") + ") WHERE a.id = {audienceId} " +
                "RETURN a.id AS id, a.name AS name, a.externalId AS externalId";

        JsonObject params = new JsonObject().put(Field.AUDIENCEID, audienceId);

        neo4j.execute(query, params, Neo4jResult.validResultHandler(res -> {
            if (res.isRight()) {
                JsonObject audience = (!res.right().getValue().isEmpty()) ? res.right().getValue().getJsonObject(0) : new JsonObject();
                promise.complete(new Audience(audience.getString(Field.ID))
                        .setName(audience.getString(Field.NAME))
                        .setExternalId(audience.getString(Field.EXTERNALID)));
            } else {
                String message = String.format("[EDT@%s::getAudienceFromId] Failed to retrieve audience %s : %s",
                        this.getClass().getSimpleName(), audienceId, res.left().getValue());
                LOGGER.error(message);
                promise.fail(res.left().getValue());
            }
        }));

        return promise.future();
    }

    @Override
    public Future<List<FormattedService>> getServicesForCourses(String structureId) {
        Promise<List<FormattedService>> promise = Promise.promise();

        String query = "SELECT id_etablissement AS structure_id, id_groupe AS audience_id, id_matiere AS subject_id, " +
                "ARRAY_AGG(id_enseignant) AS teacher_ids FROM viesco.services " +
                "WHERE id_etablissement = ? " +
                "GROUP BY id_etablissement, id_groupe, id_matiere";

        JsonArray params = new JsonArray().add(structureId);

        sql.prepared(query, params, SqlResult.validResultHandler(res -> {
            if (res.isRight()) {
                JsonArray servicesArray = res.right().getValue();
                List<FormattedService> services = new ArrayList<>();

                servicesArray.stream()
                        .filter(JsonObject.class::isInstance)
                        .map(JsonObject.class::cast)
                        .forEach(service -> {
                            FormattedService formattedService = new FormattedService();
                            formattedService.setStructureId(service.getString(Field.STRUCTURE_ID));
                            formattedService.setAudienceId(service.getString(Field.AUDIENCE_ID));
                            formattedService.setSubjectId(service.getString(Field.SUBJECT_ID));
                            formattedService.setTeacherIds(service.getJsonArray(Field.TEACHER_IDS)
                                    .stream()
                                            .map(JsonArray.class::cast)
                                            .map(tArray -> tArray.getString(1))
                                            .filter(Objects::nonNull)
                                            .collect(Collectors.toList())
                            );

                            services.add(formattedService);
                        });

                promise.complete(services);
            } else {
                String message = String.format("[EDT@%s::getServicesForCourses] Failed to retrieve services for structure %s : %s",
                        this.getClass().getSimpleName(), structureId, res.left().getValue());
                LOGGER.error(message);
                promise.fail(res.left().getValue());
            }
        }));

        return promise.future();
    }

    @Override
    public Future<JsonObject> deleteCoursesWithSubjectId(String structureId, String subjectId) {
        Promise<JsonObject> promise = Promise.promise();

        JsonObject matcher = new JsonObject()
                .put(Field.STRUCTUREID, structureId)
                .put(Field.SUBJECTID, subjectId)
                .put(Field.STARTDATE, new JsonObject().put("$gte", DateHelper.getDateString(new Date(), DateHelper.SQL_FORMAT)));

        mongoDb.delete("courses", matcher, MongoDbResult.validResultHandler(
                FutureHelper.handlerEitherPromise(promise, String.format("[EDT@%s::deleteCoursesWithSubjectId] " +
                        "Failed to delete courses with subjectId %s", this.getClass().getSimpleName(), subjectId))));

        return promise.future();
    }
}


package fr.cgi.edt.services.impl;

import fr.cgi.edt.helper.FutureHelper;
import fr.cgi.edt.services.EdtService;
import fr.cgi.edt.utils.DateHelper;
import fr.cgi.edt.utils.EdtMongoHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.Either;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbCrudService;

import java.sql.CallableStatement;
import java.util.*;

/**
 * MongoDB implementation of the REST service.
 * Methods are usually self-explanatory.
 */
public class EdtServiceMongoImpl extends MongoDbCrudService implements EdtService {

    private final String collection;
    private final EventBus eb;
    private final DateHelper dateHelper = new DateHelper();

    public EdtServiceMongoImpl(final String collection, EventBus eb) {
        super(collection);
        this.collection = collection;
        this.eb = eb;
    }

    @Override
    public void create(JsonArray courses, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).manageCourses(courses, handler);
    }

    @Override
    public void update(JsonArray courses, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).manageCourses(courses, handler);
    }

    @Override
    public void delete(final String id, final Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).delete(id, handler);
    }

    @Override
    public void updateOccurrence(JsonObject course, String dateOccurrence, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).updateOccurrence(course, dateOccurrence, handler);
    }

    @Override
    public void deleteOccurrence(String id, String dateOccurrence, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).deleteOccurrence(id, dateOccurrence, handler);
    }

    @Override
    public void retrieveRecurrences(String recurrence, Handler<Either<String, JsonArray>> handler) {
        JsonObject query = new JsonObject()
                .put("recurrence", recurrence);

        MongoDb.getInstance().find(this.collection, query, MongoDbResult.validResultsHandler(handler));
    }

    @Override
    public void updateCourse(String id, JsonObject course, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).manageCourses(new JsonArray().add(course), handler);
    }

    @Override
    public void updateRecurrence(String id, JsonObject course, Handler<Either<String, JsonArray>> handler) {
        getRecurrence(id, result -> {
            if (result.isLeft()) {
                handler.handle(new Either.Left<>("An error occurred when updating recurrence data"));
                return;
            }
            List<Future<JsonObject>> updateFutures = new ArrayList<>();
            Map<String, JsonObject> coursesMap = new HashMap<>();
            result.right().getValue().forEach(oCourse -> {
                JsonObject courseOccurrence = (JsonObject) oCourse;
                coursesMap.put(courseOccurrence.getString("_id"), courseOccurrence);
            });


            JsonObject originalCourse = coursesMap.get(course.getString("_id"));

            Date newOriginalCourseStart = setNewDayRecurrence(originalCourse.getString("startDate"), course.getString("startDate"), course.getInteger("dayOfWeek"));
            Date newOriginalCourseEnd = setNewDayRecurrence(originalCourse.getString("endDate"), course.getString("endDate"), course.getInteger("dayOfWeek"));

            int msStartDifference = dateHelper.msBetween(originalCourse.getString("startDate"), newOriginalCourseStart.toString());
            int msEndDifference = dateHelper.msBetween(originalCourse.getString("endDate"), newOriginalCourseEnd.toString());

            Calendar calendarStart = Calendar.getInstance(Locale.FRANCE);
            calendarStart.setFirstDayOfWeek(Calendar.MONDAY);
            Calendar calendarEnd = Calendar.getInstance(Locale.FRANCE);
            calendarEnd.setFirstDayOfWeek(Calendar.MONDAY);

            Date now = dateHelper.now(dateHelper.DATE_FORMATTER);
            Date editStart = dateHelper.getDate(course.getString("startDate"), dateHelper.DATE_FORMATTER);
            Date newStart = editStart.after(now) ? editStart : now;
            Date newEnd = dateHelper.getDate(course.getString("endDate"), dateHelper.DATE_FORMATTER);

            createAdditionalCourses(coursesMap, newStart, newEnd, course.copy(), updateFutures);

            coursesMap.values().forEach(courseOccurrence -> {
                Date startDate = dateHelper.getDate(courseOccurrence.getString("startDate"), dateHelper.DATE_FORMATTER);
                Date endDate = dateHelper.getDate(courseOccurrence.getString("endDate"), dateHelper.DATE_FORMATTER);

                if (!startDate.before(now)) {
                    Future<JsonObject> updateFuture = Future.future();
                    updateFutures.add(updateFuture);
                    if (!startDate.before(newStart) && !startDate.after(newEnd)) {
                        updateOccurrence(courseOccurrence, course, calendarStart, startDate, msStartDifference,
                                calendarEnd, endDate, msEndDifference, updateFuture);
                    } else {
                        deleteOccurrence(courseOccurrence.getString("_id"), courseOccurrence.getString("startDate"), deleteResult -> {
                            if (deleteResult.isLeft()) {
                                updateFuture.fail(deleteResult.left().getValue());
                                return;
                            }
                            updateFuture.complete();
                        });
                    }
                }

            });

            FutureHelper.all(updateFutures).setHandler(updates -> {
                if (updates.failed()) {
                    handler.handle(new Either.Left<>(updates.cause().getMessage()));
                    return;
                }
                handler.handle(new Either.Right<>(new JsonArray(updates.result().list())));
            });
        });
    }

    @Override
    public void deleteCourse(String id, Handler<Either<String, JsonObject>> handler) {
        super.delete(id, handler);
    }

    @Override
    public void deleteRecurrence(String id, Handler<Either<String, JsonObject>> handler) {
        MongoDb.getInstance().delete(this.collection, matcherFutureRecurrence(id), MongoDbResult.validResultHandler(handler));
    }

    private JsonObject matcherFutureRecurrence(String id) {
        return new JsonObject()
                .put("recurrence", id)
                .put("startDate", mongoGtNowCondition());
    }

    private JsonObject mongoGtNowCondition() {
        return new JsonObject()
                .put("$gt", dateHelper.now());
    }

    private void getCourse(String id, Handler<Either<String, JsonObject>> handler) {
        JsonObject query = new JsonObject()
                .put("_id", id);

        MongoDb.getInstance().findOne(this.collection, query, MongoDbResult.validResultHandler(handler));
    }

    private void getRecurrence(String id, Handler<Either<String, JsonArray>> handler) {
        JsonObject query = new JsonObject()
                .put("recurrence", id);

        MongoDb.getInstance().find(this.collection, query, MongoDbResult.validResultsHandler(handler));
    }

    private Date setNewDayRecurrence(String originalStart, String newStart, int dayOfWeek) {
        Calendar calendar = Calendar.getInstance(Locale.FRANCE);
        Calendar newCourseCalendar = Calendar.getInstance(Locale.FRANCE);
        calendar.setFirstDayOfWeek(Calendar.MONDAY);
        newCourseCalendar.setFirstDayOfWeek(Calendar.MONDAY);

        // We get difference (in ms) between start/end date of the original data, to add or subtract time for each
        // recurrence to update
        Date originalDateStart = dateHelper.getDate(originalStart, dateHelper.DATE_FORMATTER);
        Date newDateStart = dateHelper.getDate(newStart, dateHelper.DATE_FORMATTER);

        newCourseCalendar.setTime(newDateStart);
        calendar.setTime(originalDateStart);

        calendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);
        calendar.set(Calendar.HOUR_OF_DAY, newCourseCalendar.get(Calendar.HOUR_OF_DAY));
        calendar.set(Calendar.SECOND, newCourseCalendar.get(Calendar.SECOND));

        return calendar.getTime();
    }

    private void updateOccurrence(JsonObject courseOccurrence, JsonObject course, Calendar calendarStart, Date startDate,
                                  int msStartDifference, Calendar calendarEnd, Date endDate, int msEndDifference, Future<JsonObject> updateFuture) {
        courseOccurrence.put("recurrence", course.getString("newRecurrence"));

        calendarStart.setTimeInMillis(startDate.getTime() + msStartDifference);
        courseOccurrence.put("startDate", dateHelper.DATE_FORMATTER.format(calendarStart.getTime()));

        calendarEnd.setTimeInMillis(endDate.getTime() + msEndDifference);
        courseOccurrence.put("endDate", dateHelper.DATE_FORMATTER.format(calendarEnd.getTime()));


        MongoDb.getInstance().update(
                this.collection,
                new JsonObject()
                        .put("_id", courseOccurrence.getString("_id"))
                        .put("startDate", mongoGtNowCondition()),
                courseOccurrence,
                MongoDbResult.validResultHandler(updateResult -> {
                    if (updateResult.isLeft()) {
                        updateFuture.fail(updateResult.left().getValue());
                        return;
                    }
                    updateFuture.complete(updateResult.right().getValue());
                })
        );
    }

    private void createAdditionalCourses(Map<String, JsonObject> coursesMap, Date newStart, Date newEnd, JsonObject course, List<Future<JsonObject>> futures) {
        Calendar extremitiesCalendar = Calendar.getInstance(Locale.FRANCE);
        Calendar newStartCalendar = Calendar.getInstance(Locale.FRANCE);
        Calendar newEndCalendar = Calendar.getInstance(Locale.FRANCE);
        Calendar createStartCalendar = Calendar.getInstance(Locale.FRANCE);
        Calendar createEndCalendar = Calendar.getInstance(Locale.FRANCE);
        extremitiesCalendar.setFirstDayOfWeek(Calendar.MONDAY);
        newStartCalendar.setFirstDayOfWeek(Calendar.MONDAY);
        newEndCalendar.setFirstDayOfWeek(Calendar.MONDAY);
        createStartCalendar.setFirstDayOfWeek(Calendar.MONDAY);
        createEndCalendar.setFirstDayOfWeek(Calendar.MONDAY);

        JsonObject earliestCourse = coursesMap.values().stream().min((courseA, courseB) ->
                dateHelper.isBefore(courseA.getString("startDate"), courseB.getString("startDate"))
        ).get();

        JsonObject latestCourse = coursesMap.values().stream().max((courseA, courseB) ->
                dateHelper.isBefore(courseA.getString("startDate"), courseB.getString("startDate"))
        ).get();

        extremitiesCalendar.setTime(dateHelper.getDate(earliestCourse.getString("startDate"), dateHelper.DATE_FORMATTER));
        newStartCalendar.setTime(newStart);

        int startDifferenceNumber = extremitiesCalendar.get(Calendar.WEEK_OF_YEAR) - newStartCalendar.get(Calendar.WEEK_OF_YEAR);

        extremitiesCalendar.setTime(dateHelper.getDate(latestCourse.getString("startDate"), dateHelper.DATE_FORMATTER));
        newEndCalendar.setTime(newEnd);

        int endDifferenceNumber =  newEndCalendar.get(Calendar.WEEK_OF_YEAR) - extremitiesCalendar.get(Calendar.WEEK_OF_YEAR);

        course.put("recurrence", course.getString("newRecurrence"));
        course.remove("_id");
        course.remove("newRecurrence");
        createStartCalendar.setTime(dateHelper.getDate(course.getString("startDate"), dateHelper.DATE_FORMATTER));
        createEndCalendar.setTime(dateHelper.getDate(course.getString("endDate"), dateHelper.DATE_FORMATTER));

        createCoursesFromNumber(startDifferenceNumber, course, newStartCalendar.get(Calendar.WEEK_OF_YEAR), true,
                createStartCalendar, createEndCalendar, futures);

        createCoursesFromNumber(endDifferenceNumber, course, newEndCalendar.get(Calendar.WEEK_OF_YEAR), false,
                createStartCalendar, createEndCalendar, futures);
    }

    private void createCoursesFromNumber(int number, JsonObject course, int extremityNumber, boolean isAddI,
                                         Calendar createStartCalendar, Calendar createEndCalendar,
                                         List<Future<JsonObject>> createFutures) {
        if (number > 0) {
            for (int i = 0; i < number; i++) {
                Future<JsonObject> createFuture = Future.future();
                createFutures.add(createFuture);
                createCourseByWeekNumber(course, createStartCalendar, createEndCalendar,
                        extremityNumber + (isAddI ? +i : -i), createFuture);
            }
        }
    }

    private void createCourseByWeekNumber(JsonObject course, Calendar createStartCalendar, Calendar createEndCalendar,
                                          int weekNumber, Future<JsonObject> createFuture) {
        createStartCalendar.set(Calendar.WEEK_OF_YEAR, weekNumber);
        createEndCalendar.set(Calendar.WEEK_OF_YEAR, weekNumber);
        course.put("startDate", dateHelper.DATE_FORMATTER.format(createStartCalendar));
        course.put("endDate", dateHelper.DATE_FORMATTER.format(createEndCalendar));

        MongoDb.getInstance().save(collection, course, MongoDbResult.validResultHandler(createResult -> {
            if (createResult.isLeft()) {
                createFuture.fail(createResult.left().getValue());
                return;
            }
            createFuture.complete(createResult.right().getValue());
        }));
    }
}

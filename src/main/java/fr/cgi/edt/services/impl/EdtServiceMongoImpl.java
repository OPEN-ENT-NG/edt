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
            JsonArray occurrences = result.right().getValue();

            int dayOfWeek = dateHelper.getDayOfWeek(course.getInteger("dayOfWeek")),
                    startHour = dateHelper.getHour(formatDate(course.getString("startDate"))),
                    startMinutes = dateHelper.getMinutes(formatDate(course.getString("startDate"))),
                    startSecond = dateHelper.getSecond(formatDate(course.getString("startDate"))),
                    endHour = dateHelper.getHour(formatDate(course.getString("endDate"))),
                    endMinutes = dateHelper.getMinutes(formatDate(course.getString("endDate"))),
                    endSecond = dateHelper.getSecond(formatDate(course.getString("endDate")));

            Date now = dateHelper.now(dateHelper.DATE_FORMATTER),
                    editStart = formatDate(course.getString("startDate")),
                    newStart = editStart.after(now) ? editStart : now,
                    newEnd = formatDate(course.getString("endDate"));

            createAdditionalCourses(occurrences, newStart, newEnd, course.copy(), dayOfWeek, updateFutures);

            Calendar calendar = Calendar.getInstance(Locale.FRANCE);
            occurrences.forEach(o -> {
                JsonObject courseOccurrence = (JsonObject) o;
                Date startDate = formatDate(courseOccurrence.getString("startDate"));
                Date endDate = formatDate(courseOccurrence.getString("endDate"));

                if (!startDate.before(now)) {
                    Future<JsonObject> updateFuture = Future.future();
                    updateFutures.add(updateFuture);
                    if ((!startDate.before(newStart) && !startDate.after(newEnd)) || isSameDay(startDate, newStart)) {
                        setCourseTimeSlots(courseOccurrence, course.getString("idStartSlot"), course.getString("idEndSlot"));
                        updateOccurrence(courseOccurrence, course, dayOfWeek, startHour, startMinutes, startSecond, endHour, endMinutes, endSecond,
                                startDate, endDate, calendar, updateFuture);
                    } else {
                        deleteCourse(courseOccurrence.getString("_id"), deleteResult -> {
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

    private void setCourseTimeSlots(JsonObject courseOccurrence, String idStartSlot, String idEndSlot) {
        courseOccurrence.put("idStartSlot", idStartSlot);
        courseOccurrence.put("idEndSlot", idEndSlot);
    }

    private boolean isSameDay(Date startDate, Date newStart) {
        Calendar startDateCal = Calendar.getInstance();
        Calendar newStartCal = Calendar.getInstance();
        startDateCal.setTime(startDate);
        newStartCal.setTime(newStart);

        return (startDateCal.get(Calendar.DAY_OF_YEAR) == newStartCal.get(Calendar.DAY_OF_YEAR)) &&
                startDateCal.get(Calendar.YEAR) == newStartCal.get(Calendar.YEAR);
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

    private void updateOccurrence(JsonObject courseOccurrence, JsonObject creatingCourse, int dayOfWeek, int startHour, int startMinutes, int startSecond,
                                  int endHour, int endMinutes, int endSecond, Date startDate, Date endDate, Calendar calendar, Future<JsonObject> updateFuture) {
        JsonObject newCourse = creatingCourse.copy();
        newCourse.put("_id", courseOccurrence.getString("_id"));
        newCourse.put("recurrence", creatingCourse.getString("newRecurrence"));
        newCourse.remove("newRecurrence");

        calendar.setTime(startDate);
        calendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);
        calendar.set(Calendar.HOUR_OF_DAY, startHour);
        calendar.set(Calendar.MINUTE, startMinutes);
        calendar.set(Calendar.SECOND, startSecond);
        newCourse.put("startDate", dateHelper.DATE_FORMATTER.format(calendar.getTime()));

        calendar.setTime(endDate);
        calendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);
        calendar.set(Calendar.HOUR_OF_DAY, endHour);
        calendar.set(Calendar.MINUTE, endMinutes);
        calendar.set(Calendar.SECOND, endSecond);
        newCourse.put("endDate", dateHelper.DATE_FORMATTER.format(calendar.getTime()));


        MongoDb.getInstance().update(
                this.collection,
                new JsonObject()
                        .put("_id", courseOccurrence.getString("_id"))
                        .put("startDate", mongoGtNowCondition()),
                newCourse,
                MongoDbResult.validResultHandler(updateResult -> {
                    if (updateResult.isLeft()) {
                        updateFuture.fail(updateResult.left().getValue());
                        return;
                    }
                    updateFuture.complete(updateResult.right().getValue());
                })
        );
    }

    private void createAdditionalCourses(JsonArray occurrences, Date newStart, Date newEnd, JsonObject course, int dayOfWeek, List<Future<JsonObject>> futures) {
        Calendar extremitiesCalendar = Calendar.getInstance(Locale.FRANCE),
                newStartCalendar = Calendar.getInstance(Locale.FRANCE),
                newEndCalendar = Calendar.getInstance(Locale.FRANCE),
                createStartCalendar = Calendar.getInstance(Locale.FRANCE),
                createEndCalendar = Calendar.getInstance(Locale.FRANCE);

        JsonObject earliestCourse = (JsonObject) occurrences.stream().min((courseA, courseB) ->
                dateHelper.isBefore(((JsonObject) courseB).getString("startDate"), ((JsonObject) courseA).getString("startDate"))
        ).get();

        JsonObject latestCourse = (JsonObject) occurrences.stream().max((courseA, courseB) ->
                dateHelper.isBefore(((JsonObject) courseB).getString("startDate"), ((JsonObject) courseA).getString("startDate"))
        ).get();

        extremitiesCalendar.setTime(formatDate(earliestCourse.getString("startDate")));
        newStartCalendar.setTime(newStart);
        newStartCalendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);

        int startDifferenceNumber = extremitiesCalendar.get(Calendar.WEEK_OF_YEAR) - newStartCalendar.get(Calendar.WEEK_OF_YEAR);

        extremitiesCalendar.setTime(formatDate(latestCourse.getString("startDate")));
        newEndCalendar.setTime(newEnd);
        newEndCalendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);

        int endDifferenceNumber = newEndCalendar.get(Calendar.WEEK_OF_YEAR) - extremitiesCalendar.get(Calendar.WEEK_OF_YEAR);

        course.put("recurrence", course.getString("newRecurrence"));
        course.remove("_id");
        course.remove("newRecurrence");
        createStartCalendar.setTime(formatDate(course.getString("startDate")));
        createEndCalendar.setTime(formatDate(course.getString("endDate")));

        // add course before earliestCourse start date => ex: earliestCourseWeek = 33, newWeek = 30
        // we have to have to had course of week 30 + i = 0, 30 + i = 1, 30 + i = 2 (i corresponding to the index of loop)
        //isAddI = true corresponding to "+ i"
        createCoursesFromNumber(startDifferenceNumber, course, newStartCalendar.get(Calendar.WEEK_OF_YEAR), true,
                createStartCalendar, createEndCalendar, dayOfWeek, newStart, newEnd, futures);

        // add course after latestCourse start date => ex: earliestCourseWeek = 40, newWeek = 43
        // we have to have to had course of week 43 - i = 0, 43 + i = 1, 43 + i = 2 (i corresponding to the index of loop)
        //isAddI = false corresponding to "- i"
        createCoursesFromNumber(endDifferenceNumber, course, newEndCalendar.get(Calendar.WEEK_OF_YEAR), false,
                createStartCalendar, createEndCalendar, dayOfWeek, newStart, newEnd, futures);
    }

    private void createCoursesFromNumber(int number, JsonObject course, int extremityNumber, boolean isAddI,
                                         Calendar createStartCalendar, Calendar createEndCalendar, int dayOfWeek, Date newStart, Date newEnd,
                                         List<Future<JsonObject>> createFutures) {
        if (number > 0) {
            for (int i = 0; i < number; i++) {
                Future<JsonObject> createFuture = Future.future();
                createFutures.add(createFuture);
                createCourseByWeekNumber(course, createStartCalendar, createEndCalendar,
                        extremityNumber + (isAddI ? +i : -i), dayOfWeek, newStart, newEnd, createFuture);
            }
        }
    }

    private void createCourseByWeekNumber(JsonObject course, Calendar createStartCalendar, Calendar createEndCalendar,
                                          int weekNumber, int dayOfWeek, Date newStart, Date newEnd, Future<JsonObject> createFuture) {
        createStartCalendar.set(Calendar.WEEK_OF_YEAR, weekNumber);
        createStartCalendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);
        createEndCalendar.set(Calendar.WEEK_OF_YEAR, weekNumber);
        createEndCalendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);
        if (createStartCalendar.getTime().before(newStart) || createEndCalendar.getTime().after(newEnd)) {
            createFuture.complete();
            return;
        }

        course.put("startDate", dateHelper.DATE_FORMATTER.format(createStartCalendar.getTime()));
        course.put("endDate", dateHelper.DATE_FORMATTER.format(createEndCalendar.getTime()));

        MongoDb.getInstance().save(collection, course, MongoDbResult.validResultHandler(createResult -> {
            if (createResult.isLeft()) {
                createFuture.fail(createResult.left().getValue());
                return;
            }
            createFuture.complete(createResult.right().getValue());
        }));
    }

    private Date formatDate(String date) {
        return dateHelper.getDate(date, dateHelper.DATE_FORMATTER);
    }
}

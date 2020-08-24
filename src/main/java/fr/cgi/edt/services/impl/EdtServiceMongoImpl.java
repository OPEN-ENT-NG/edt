package fr.cgi.edt.services.impl;

import fr.cgi.edt.helper.FutureHelper;
import fr.cgi.edt.services.EdtService;
import fr.cgi.edt.sts.StsError;
import fr.cgi.edt.utils.DateHelper;
import fr.cgi.edt.utils.EdtMongoHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.DefaultAsyncResult;
import fr.wseduc.webutils.Either;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbCrudService;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

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

            // We get difference (in ms) between start/end date of the original data, to add or subtract time for each
            // recurrence to update
            int msStartDifference = dateHelper.msBetween(originalCourse.getString("startDate"), course.getString("startDate"));
            int msEndDifference = dateHelper.msBetween(originalCourse.getString("endDate"), course.getString("endDate"));

            Calendar time = Calendar.getInstance();
            coursesMap.values().forEach(courseOccurrence -> {
                courseOccurrence.put("recurrence", course.getString("newRecurrence"));

                Date startDate = dateHelper.getDate(courseOccurrence.getString("startDate"), dateHelper.DATE_FORMATTER);
                time.setTimeInMillis(startDate.getTime() + msStartDifference);
                courseOccurrence.put("startDate", dateHelper.DATE_FORMATTER.format(time.getTime()));

                Date endDate = dateHelper.getDate(courseOccurrence.getString("endDate"), dateHelper.DATE_FORMATTER);
                time.setTimeInMillis(endDate.getTime() + msEndDifference);
                courseOccurrence.put("endDate", dateHelper.DATE_FORMATTER.format(time.getTime()));

                Future<JsonObject> updateFuture = Future.future();
                updateFutures.add(updateFuture);

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
        String now = new DateHelper().DATE_FORMATTER.format(new Date());
        return new JsonObject()
                .put("$gt", now);
    }

    private void getCourse(String id, Handler<Either<String, JsonObject>> handler) {
        JsonObject query = new JsonObject()
                .put("_id", id);

        MongoDb.getInstance().findOne(this.collection, query, MongoDbResult.validResultHandler(handler));
    }

    ;

    private void getRecurrence(String id, Handler<Either<String, JsonArray>> handler) {
        JsonObject query = new JsonObject()
                .put("recurrence", id);

        MongoDb.getInstance().find(this.collection, query, MongoDbResult.validResultsHandler(handler));
    }

    ;
}

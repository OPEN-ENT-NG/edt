package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.EdtService;
import fr.cgi.edt.utils.DateHelper;
import fr.cgi.edt.utils.EdtMongoHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.service.impl.MongoDbCrudService;

import java.util.Date;

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
    public void updateRecurrence(String id, JsonObject course, Handler<Either<String, JsonObject>> handler) {
        getCourse(course.getString("_id"), result -> {
            if (result.isLeft()) {
                handler.handle(new Either.Left<>("An error occurred when updating recurrence data"));
                return;
            }

            JsonObject courseResult = result.right().getValue();

            // We get difference (in ms) between start/end date of the original data, to add or subtract time for each
            // recurrence to update
            int msStartDifference = dateHelper.msBetween(course.getString("startDate"), courseResult.getString("startDate"));
            int msEndDifference = dateHelper.msBetween(course.getString("endDate"), courseResult.getString("endDate"));

            course.put("recurrence", course.getString("newRecurrence"));
            // If difference between start/end date is negative, we subtract ("$subtract") time
            // (in ms), else, we add ("$add") time
            course.put("startDate", new JsonObject().put(msStartDifference < 0 ? "$subtract" : "$add",
                    new JsonArray().add("$date").add(Math.abs(msStartDifference))));
            course.put("endDate", new JsonObject().put(msEndDifference < 0 ? "$subtract" : "$add",
                    new JsonArray().add("$date").add(Math.abs(msEndDifference))));
            course.remove("newRecurrence");

            MongoDb.getInstance().update(this.collection, matcherFutureRecurrence(id), course, MongoDbResult.validResultHandler(handler));
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
    };
}

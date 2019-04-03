package fr.cgi.edt.services.impl;

import fr.cgi.edt.utils.EdtMongoHelper;
import fr.cgi.edt.services.EdtService;
import fr.wseduc.webutils.Either;
import io.vertx.core.eventbus.EventBus;
import org.entcore.common.service.impl.MongoDbCrudService;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

/**
 * MongoDB implementation of the REST service.
 * Methods are usually self-explanatory.
 */
public class EdtServiceMongoImpl extends MongoDbCrudService implements EdtService {

    private final String collection;
    private final EventBus eb;

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
}

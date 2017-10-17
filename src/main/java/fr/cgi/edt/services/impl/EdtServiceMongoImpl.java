package fr.cgi.edt.services.impl;

import fr.cgi.edt.utils.EdtMongoHelper;
import fr.cgi.edt.services.EdtService;
import fr.wseduc.webutils.Either;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

/**
 * MongoDB implementation of the REST service.
 * Methods are usually self-explanatory.
 */
public class EdtServiceMongoImpl extends MongoDbCrudService implements EdtService {

    private final String collection;

    public EdtServiceMongoImpl(final String collection) {
        super(collection);
        this.collection = collection;
    }

    @Override
    public void create(JsonArray courses, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection).transaction(courses, handler);
    }

    @Override
    public void update(JsonArray courses, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection).transaction(courses, handler);
    }
}

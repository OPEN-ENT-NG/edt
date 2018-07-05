package fr.cgi.edt.services.impl;

import fr.cgi.edt.Edt;
import fr.cgi.edt.utils.EdtMongoHelper;
import fr.cgi.edt.services.EdtService;
import fr.wseduc.webutils.Either;
import org.entcore.common.service.impl.MongoDbCrudService;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;

import static org.entcore.common.http.response.DefaultResponseHandler.notEmptyResponseHandler;


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

    @Override
    public void delete(final String id, final Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection).delete( id, handler);
    }

}

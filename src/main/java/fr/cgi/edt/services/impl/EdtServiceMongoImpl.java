package fr.cgi.edt.services.impl;

import fr.cgi.edt.utils.EdtMongoHelper;
import fr.cgi.edt.services.EdtService;
import fr.wseduc.webutils.Either;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

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

    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);
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

        final JsonObject matches = new JsonObject().putString("_id", id);
        mongo.findOne(this.collection, matches , new Handler<Message<JsonObject>>() {
            @Override
            public void handle(Message<JsonObject> result) {
                if ("ok".equals(result.body().getString("status"))) {
                    JsonObject course = result.body().getObject("result");
                    JsonObject coursePropreties = getCourseProperties(course);
                    if(coursePropreties.getBoolean("toDelete")) {
                        new EdtMongoHelper(collection).deleteElement(matches, handler);
                    }else if (coursePropreties.getBoolean("toUpdate")){
                        SimpleDateFormat formatterDate = new SimpleDateFormat("yyyy-MM-dd");
                        String now = formatterDate.format(new Date());
                        String endTime =  coursePropreties.getString("endTime");
                        new EdtMongoHelper(collection)
                                .updateElement(course.putString("endDate", now+'T'+endTime ), handler);
                    }else {
                        LOGGER.error("can't delete this course");
                        handler.handle(new Either.Left<String, JsonObject>("can't delete this course"));
                    }
                } else {
                    LOGGER.error("this course does not exist");
                    handler.handle(new Either.Left<String, JsonObject>("this course does not exist"));
                }
            }
        });

    }
    private JsonObject getCourseProperties(JsonObject course) {
        Date startDate ;
        Date endDate ;
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        SimpleDateFormat formatterTime = new SimpleDateFormat("HH:mm");
        Date now = new Date() ;
        JsonObject courseProperties  = new JsonObject()
                .putBoolean("toDelete", false)
                .putBoolean("toUpdate", false);
        try{
            startDate = formatter.parse( course.getString("startDate") );
            endDate = formatter.parse( course.getString("endDate") );
            boolean isRecurence = 0 != TimeUnit.DAYS.convert(
                    endDate.getTime() -startDate.getTime(), TimeUnit.MILLISECONDS);
            if (now.before(startDate)) {
                courseProperties.putBoolean("toDelete", true);
            }else if(isRecurence && startDate.before(now) && endDate.after(now) ){
                courseProperties.putBoolean("toUpdate", true)
                .putString("endTime",formatterTime.format(endDate));

            }

        } catch (ParseException e) {
            LOGGER.error("error when casting course's dates");
        }
        return courseProperties;
    }
}

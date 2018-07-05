package fr.cgi.edt.utils;

import com.mongodb.QueryBuilder;
import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;
import fr.wseduc.webutils.Either;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.service.impl.MongoDbCrudService;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.entcore.common.http.response.DefaultResponseHandler.*;


public class EdtMongoHelper extends MongoDbCrudService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);
    public EdtMongoHelper(String collection) {
        super(collection);
    }

    public void checkTransactionStatus (Boolean onError, Integer valuesSize, List<String> ids, Handler<Either<String, JsonObject>> handler) {
        if (valuesSize == ids.size()) {
            if (onError) {
                rollBack(ids, handler);
            } else {
                JsonObject res = new JsonObject().put("status", 200);
                handler.handle(new Either.Right<String, JsonObject>(res));
            }
        }
    }

    private void rollBack(final List<String> ids, final Handler<Either<String, JsonObject>> handler){
        final Integer[] counter = {0};
        for (int i = 0; i < ids.size(); i++) {
            QueryBuilder query = QueryBuilder.start("_id").is(ids.get(i));
            mongo.delete(this.collection, MongoQueryBuilder.build(query), new Handler<Message<JsonObject>>() {
                @Override
                public void handle(Message<JsonObject> res) {
                    counter[0]++;
                    if (counter[0] == ids.size()) {
                        handler.handle(new Either.Left<String, JsonObject>("An error occurred when inserting data"));
                    }
                }
            });
        }
    }

    public void transaction(final JsonArray values, final Handler<Either<String, JsonObject>> handler) {
        final ArrayList<String> ids = new ArrayList<>();
        final Boolean[] onError = {false};
        JsonObject obj;

        Handler<Message<JsonObject>> transactionHandler = new Handler<Message<JsonObject>>() {
            @Override
            public void handle(Message<JsonObject> result) {
                if ("ok".equals(result.body().getString("status"))) {
                    ids.add(result.body().getString("_id"));
                } else {
                    onError[0] = true;
                    ids.add("err");
                }
                checkTransactionStatus(onError[0], values.size(), ids, handler);
            }
        };

        for (int i = 0; i < values.size(); i++) {
            obj = values.getJsonObject(i);
            if (!obj.containsKey("_id")) {
                mongo.save(collection, obj, transactionHandler);
            } else {
                QueryBuilder query = QueryBuilder.start("_id").is(obj.getString("_id"));
                MongoUpdateBuilder modifier = new MongoUpdateBuilder();
                for (String attr: obj.fieldNames()) {
                    modifier.set(attr, obj.getValue(attr));
                }

                mongo.update(collection, MongoQueryBuilder.build(query), modifier.build(), transactionHandler);
            }
        }
    }
    public void updateCourse (final JsonObject newCourse, final  Handler<Either<String, JsonObject>> handler){
        final JsonObject matches = new JsonObject().put("_id", newCourse.getString("_id"));
        mongo.findOne(this.collection, matches ,  result -> {
                if ("ok".equals(result.body().getString("status"))) {
                    JsonObject oldCourse = result.body().getJsonObject("result");
                    JsonObject coursePropreties = getCourseProperties(oldCourse);
                    if(coursePropreties.getBoolean("inFuture")) {
                        updateElement(newCourse, handler);
                    }else if (coursePropreties.getBoolean("inPresent")) {
                        SimpleDateFormat formatterDate = new SimpleDateFormat("yyyy-MM-dd");
                        String now = formatterDate.format(new Date());
                        String endTime =  coursePropreties.getString("endTime");
                        updateElement(oldCourse.put("endDate", now+'T'+endTime ), handler);
                        if(now.compareTo(newCourse.getString("startDate")) > 0  ){
                            newCourse.put("startDate", now+'T'+endTime );
                        }
                        mongo.insert(collection, newCourse);
                    }else {
                        LOGGER.error("can't edit this course");
                        handler.handle(new Either.Left<String, JsonObject>("can't edit this course"));
                    }
                } else {
                    LOGGER.error("this course does not exist");
                    handler.handle(new Either.Left<String, JsonObject>("this course does not exist"));
                }
            });
    }
     public void deleteElement(final JsonObject matches,  final Handler<Either<String, JsonObject>> handler )   {
         mongo.delete(collection, matches, new Handler<Message<JsonObject>>() {
             @Override
             public void handle(Message<JsonObject> result) {
                 if ("ok".equals(result.body().getString("status"))){
                     handler.handle(new Either.Right<String, JsonObject>(matches));
                 }else{
                     handler.handle(new Either.Left<String, JsonObject>("An error occurred when deleting data"));
                 }
             }
         });
     }

     public void updateElement(final JsonObject element, final Handler<Either<String, JsonObject>> handler  ) {
         final JsonObject matches = new JsonObject().put("_id", element.getString("_id"));
         mongo.update(collection, matches, element, new Handler<Message<JsonObject>>() {
             @Override
             public void handle(Message<JsonObject> result) {
                 if ("ok".equals(result.body().getString("status"))){
                     handler.handle(new Either.Right<String, JsonObject>(matches));
                 }else{
                     handler.handle(new Either.Left<String, JsonObject>("An error occurred when updating data"));
                 }
             }
         });
     }
    public void delete(final String id, final Handler<Either<String, JsonObject>> handler) {

        final JsonObject matches = new JsonObject().put("_id", id);
        mongo.findOne(this.collection, matches , new Handler<Message<JsonObject>>() {
            @Override
            public void handle(Message<JsonObject> result) {
                if ("ok".equals(result.body().getString("status"))) {
                    JsonObject course = result.body().getJsonObject("result");
                    JsonObject coursePropreties = getCourseProperties(course);
                    if(coursePropreties.getBoolean("inFuture")) {
                        deleteElement(matches, handler);
                    }else if (coursePropreties.getBoolean("inPresent")){
                        SimpleDateFormat formatterDate = new SimpleDateFormat("yyyy-MM-dd");
                        String now = formatterDate.format(new Date());
                        String endTime =  coursePropreties.getString("endTime");
                        updateElement(course.put("endDate", now+'T'+endTime ), handler);

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
                .put("inFuture", false)
                .put("inPresent", false);
        try{
            startDate = formatter.parse( course.getString("startDate") );
            endDate = formatter.parse( course.getString("endDate") );
            boolean isRecurence = 0 != TimeUnit.DAYS.convert(
                    endDate.getTime() -startDate.getTime(), TimeUnit.MILLISECONDS);
            if (now.before(startDate)) {
                courseProperties.put("inFuture", true);
            }else if(isRecurence && startDate.before(now) && endDate.after(now) ){
                courseProperties.put("inPresent", true)
                        .put("endTime",formatterTime.format(endDate));

            }

        } catch (ParseException e) {
            LOGGER.error("error when casting course's dates");
        }
        return courseProperties;
    }

}

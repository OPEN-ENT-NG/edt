package fr.cgi.edt.utils;

import com.mongodb.QueryBuilder;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;
import fr.wseduc.webutils.Either;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;

import static org.entcore.common.http.response.DefaultResponseHandler.*;


public class EdtMongoHelper extends MongoDbCrudService {

    public EdtMongoHelper(String collection) {
        super(collection);
    }

    public void checkTransactionStatus (Boolean onError, Integer valuesSize, List<String> ids, Handler<Either<String, JsonObject>> handler) {
        if (valuesSize == ids.size()) {
            if (onError) {
                rollBack(ids, handler);
            } else {
                JsonObject res = new JsonObject().putNumber("status", 200);
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
            obj = values.get(i);
            if (!obj.containsField("_id")) {
                mongo.save(collection, obj, transactionHandler);
            } else {
                QueryBuilder query = QueryBuilder.start("_id").is(obj.getString("_id"));
                MongoUpdateBuilder modifier = new MongoUpdateBuilder();
                for (String attr: obj.getFieldNames()) {
                    modifier.set(attr, obj.getValue(attr));
                }
                mongo.update(collection, MongoQueryBuilder.build(query), modifier.build(), transactionHandler);
            }
        }
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
         final JsonObject matches = new JsonObject().putString("_id", element.getString("_id"));
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

}

package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.StsService;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

public class StsServiceMongoImpl implements StsService {
    @Override
    public void reports(String uai, Handler<Either<String, JsonArray>> handler) {
        JsonArray pipeline = new JsonArray();
        JsonObject aggregation = new JsonObject()
                .put("aggregate", "timetableImports")
                .put("allowDiskUse", true)
                .put("cursor", new JsonObject())
                .put("pipeline", pipeline);

        JsonObject match = new JsonObject()
                .put("UAI", uai)
                .put("source", "STS");

        JsonObject sort = new JsonObject()
                .put("$sort", new JsonObject().put("created", -1));

        JsonObject dateToStrig = new JsonObject()
                .put("$dateToString", new JsonObject().put("date", "$created").put("format", "%Y-%m-%dT%H:%M:%S.%LZ"));

        JsonObject projection = new JsonObject()
                .put("_id", "$_id")
                .put("report", "$report")
                .put("created", dateToStrig);

        pipeline.add(new JsonObject().put("$match", match))
                .add(sort)
                .add(new JsonObject().put("$project", projection));

        MongoDb.getInstance().command(aggregation.toString(), message -> {
            JsonObject body = message.body();
            if ("ok".equals(body.getString("status"))) {
                handler.handle(new Either.Right<>(body.getJsonObject("result").getJsonObject("cursor").getJsonArray("firstBatch")));
            } else {
                handler.handle(new Either.Left<>("Failed to fetch sts reports"));
            }

        });
    }
}

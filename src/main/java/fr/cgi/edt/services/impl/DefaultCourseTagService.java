package fr.cgi.edt.services.impl;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.helper.CourseTagHelper;
import fr.cgi.edt.helper.FutureHelper;
import fr.cgi.edt.models.CourseTag;
import fr.cgi.edt.services.CourseTagService;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.Either;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.sql.Sql;
import org.entcore.common.sql.SqlResult;

import java.util.List;
import java.util.stream.Collectors;

import static fr.cgi.edt.Edt.EDT_COLLECTION;
import static fr.cgi.edt.Edt.EDT_SCHEMA;

public class DefaultCourseTagService implements CourseTagService {

    private static final Logger log = LoggerFactory.getLogger(DefaultCourseTagService.class);
    private final MongoDb mongoDb;
    private final Sql sql;

    public DefaultCourseTagService(Sql sql, MongoDb mongoDb) {
        this.sql = sql;
        this.mongoDb = mongoDb;
    }

    @Override
    public Future<List<CourseTag>> getCourseTags(String structureId) {

        Promise<List<CourseTag>> promise = Promise.promise();

        getCourseTagsArray(structureId)
                .compose(courseTags -> countTagUsed(structureId,
                        CourseTagHelper.getCourseTagListFromJsonArray(courseTags)))
                .onFailure(fail -> promise.fail(fail.getMessage()))
                .onSuccess(promise::complete);

        return promise.future();
    }

    @Override
    public void getCourseTags(String structureId, Handler<Either<String, JsonArray>> handler) {
        getCourseTagsArray(structureId)
                .onFailure(fail -> handler.handle(new Either.Left<>(fail.getMessage())))
                .onSuccess(tags -> handler.handle(new Either.Right<>(tags)));
    }


    private Future<JsonArray> getCourseTagsArray(String structureId) {
        Promise<JsonArray> promise = Promise.promise();

        String query = "SELECT * FROM " + EDT_SCHEMA + ".course_tag WHERE structure_id = ? ORDER BY label ASC";

        JsonArray params = new JsonArray().add(structureId);

        sql.prepared(query, params, SqlResult.validResultHandler(res -> {
            if (res.isLeft()) {
                String message = String.format("[Edt@%s::getCourseTags] Error fetching course tags : %s",
                        this.getClass().getName(), res.left().getValue());
                log.error(message);
                promise.fail(message);
            } else {
                promise.complete(res.right().getValue());
            }
        }));
        return promise.future();
    }

    @Override
    public Future<JsonObject> createCourseTag(String structureId, JsonObject courseTagBody) {
       Promise<JsonObject> promise = Promise.promise();

        String query = "INSERT INTO " + EDT_SCHEMA + ".course_tag (structure_id, label, abbreviation," +
                "is_primary, allow_register) VALUES (?,?,?,?,?) RETURNING id";

        JsonArray params = new JsonArray()
                .add(structureId)
                .add(courseTagBody.getString(Field.LABEL))
                .add(courseTagBody.getString(Field.ABBREVIATION))
                .add(courseTagBody.getBoolean(Field.ISPRIMARY, false))
                .add(courseTagBody.getBoolean(Field.ALLOWREGISTER, true));

        sql.prepared(query, params, SqlResult.validUniqueResultHandler(
                FutureHelper.handlerJsonObject(promise.future())));

       return promise.future();
    }

    @Override
    public Future<JsonObject> deleteCourseTag(String structureId, Number id) {
        Promise<JsonObject> promise = Promise.promise();

        String query = "DELETE FROM " + EDT_SCHEMA + ".course_tag WHERE id = " + id + "RETURNING id AS id_deleted";

        sql.raw(query, SqlResult.validUniqueResultHandler(
                FutureHelper.handlerJsonObject(promise.future())));

        return promise.future();
    }

    @Override
    public Future<JsonObject> updateCourseTag(JsonObject courseTagBody) {
        Promise<JsonObject> promise = Promise.promise();

        String query = "UPDATE " + EDT_SCHEMA + ".course_tag SET label = ?, abbreviation = ?," +
                "is_primary = ?, allow_register = ? WHERE id = ?";

        JsonArray params = new JsonArray()
                .add(courseTagBody.getString(Field.LABEL))
                .add(courseTagBody.getString(Field.ABBREVIATION))
                .add(courseTagBody.getBoolean(Field.ISPRIMARY, false))
                .add(courseTagBody.getBoolean(Field.ALLOWREGISTER, true))
                .add(courseTagBody.getLong(Field.ID));

        sql.prepared(query, params, SqlResult.validUniqueResultHandler(
                FutureHelper.handlerJsonObject(promise.future())));

        return promise.future();
    }


    @Override
    public Future<JsonObject> updateCourseTagHidden(String structureId, Number id, boolean isHidden) {
        Promise<JsonObject> promise = Promise.promise();

        String query = "UPDATE " + EDT_SCHEMA + ".course_tag SET is_hidden = ? WHERE structure_id = ? AND id = ?" +
                "RETURNING id";

        JsonArray params = new JsonArray()
                .add(isHidden)
                .add(structureId)
                .add(id);

        sql.prepared(query, params, SqlResult.validUniqueResultHandler(
                FutureHelper.handlerJsonObject(promise.future())));

        return promise.future();
    }

    private Future<List<CourseTag>> countTagUsed(String structureId, List<CourseTag> tags) {
        Promise<List<CourseTag>> promise = Promise.promise();
        
        List<Long> tagIds = tags.stream().map(CourseTag::getId).collect(Collectors.toList());

        JsonObject request = commandObject(countTagsPipeline(structureId, tagIds));

        mongoDb.command(request.toString(), MongoDbResult.validResultHandler(courseAsync -> {
            if (courseAsync.isLeft()) {
                String message = String.format("[EDT@%s::countTagUsed] Failed to count course tags : %s",
                        this.getClass().getSimpleName(), courseAsync.left().getValue());
                log.error(message, courseAsync.left().getValue());
                promise.fail(message);
            } else {

                JsonArray result = courseAsync.right().getValue().getJsonObject("cursor",
                        new JsonObject()).getJsonArray("firstBatch", new JsonArray());

                tags.forEach(tag -> tag.setIsUsed(result.stream()
                        .anyMatch(count -> ((JsonObject) count).getJsonArray(Field._ID).contains(tag.getId().intValue()))));


                promise.complete(tags);
            }
        }));

        return promise.future();
    }

    private JsonObject commandObject(JsonArray pipeline) {
        return new JsonObject()
                .put("aggregate", EDT_COLLECTION)
                .put("allowDiskUse", true)
                .put("cursor", new JsonObject().put("batchSize", 2147483647))
                .put("pipeline", pipeline);
    }

    private JsonArray countTagsPipeline(String structureId, List<Long> tagIds) {
        return new JsonArray()
                .add(matchTags(structureId, tagIds))
                .add(groupTags());
    }

    private JsonObject matchTags(String structureId, List<Long> tagIds) {
        return new JsonObject().put("$match",new JsonObject()
                .put("structureId", structureId)
                .put("tagIds", new JsonObject().put("$in", tagIds)));
    }

    private JsonObject groupTags() {
        return new JsonObject().put("$group", new JsonObject()
                .put("_id", "$tagIds")
                .put("count", new JsonObject().put("$sum", 1)));
    }



}

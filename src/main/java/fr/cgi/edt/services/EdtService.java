package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

/**
 * Generic REST service for Edt.
 */
public interface EdtService {

    /**
     * Create courses
     * @param courses JsonArray containing courses
     * @param handler handler
     */
    void create(JsonArray courses, Handler<Either<String, JsonObject>> handler);

    /**
     * Updates courses
     * @param courses JsonArray containing courses
     * @param handler handler
     */
    void update(JsonArray courses, Handler<Either<String, JsonObject>> handler);

    /**
     * delete course
     * @param id
     * @param handler
     */
    void delete(String id,  Handler<Either<String, JsonObject>> handler  );
}

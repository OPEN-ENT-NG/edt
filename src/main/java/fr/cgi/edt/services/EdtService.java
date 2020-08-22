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

    /**
     * Update an occurrence
     * @param course the occurrence object with the origin id Course
     * @param dateOccurrence the date of the occurrence to replace
     * @param handler
     */
    void updateOccurrence(JsonObject course, String dateOccurrence, Handler<Either<String, JsonObject>> handler);

    /**
     * delete occurrence
     *
     * @param id
     * @param handler
     */
    void deleteOccurrence(String id, String dateOccurrence, Handler<Either<String, JsonObject>> handler);

    void retrieveRecurrences(String recurrence, Handler<Either<String, JsonArray>> handler);

    void update(String id, JsonObject course, Handler<Either<String, JsonObject>> handler);

    void deleteCourse(String id, Handler<Either<String, JsonObject>> handler);

    void deleteRecurrence(String id, Handler<Either<String, JsonObject>> handler);
}

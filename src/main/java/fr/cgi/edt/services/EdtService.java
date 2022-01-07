package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;

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
     * Update multiple courses tag
     * @param ids      list of course ids
     * @param tagId    tag id
     * @return         {@link Future} of {@link JsonObject}
     */
    Future<JsonObject> updateCoursesTag(List<String> ids, Integer tagId);

    /**
     * delete course
     * @param id
     * @param handler
     */
    void delete(String id,  Handler<Either<String, JsonObject>> handler);

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

    Future<JsonObject> retrieveRecurrencesDates(String recurrence);

    /**
     * Updates course
     * @param id
     * @param course JsonArray containing courses
     * @param handler handler
     */
    void updateCourse(String id, JsonObject course, Handler<Either<String, JsonObject>> handler);

    /**
     * Updates recurrence of courses
     * @param id
     * @param course course
     * @param handler handler
     */
    void updateRecurrence(String id, JsonObject course, Handler<Either<String, JsonArray>> handler);

    void deleteCourse(String id, Handler<Either<String, JsonObject>> handler);

    void deleteRecurrence(String id, Handler<Either<String, JsonObject>> handler);
}

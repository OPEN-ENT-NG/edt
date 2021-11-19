package fr.cgi.edt.services;


import fr.cgi.edt.models.CourseTag;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;

import java.util.List;

public interface CourseTagService {

    /**
     * Get all course tags from structure
     *
     * @param structureId Structure identifier
     */
    Future<List<CourseTag>> getCourseTags(String structureId);

    /**
     * Create a course tag for the structure
     * @param structureId       structure identifier
     * @param courseTagBody     course tag object
     */
    Future<JsonObject> createCourseTag(String structureId, JsonObject courseTagBody);


    /**
     * Delete a course tag from id
     * @param structureId       structure identifier
     * @param id                course tag identifier
     */
    Future<JsonObject> deleteCourseTag(String structureId, Number id);

    /**
     * Update a course tag
     * @param courseTagBody course tag object
     */
    Future<JsonObject> updateCourseTag(JsonObject courseTagBody);

    /**
     * Update a course tag priority
     * @param structureId      structure identifier
     * @param id               course tag identifier
     * @param isHidden         hidden state
     */
    Future<JsonObject> updateCourseTagHidden(String structureId, Number id, boolean isHidden);

}

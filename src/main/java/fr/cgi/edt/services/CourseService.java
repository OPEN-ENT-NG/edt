package fr.cgi.edt.services;


import io.vertx.core.Future;
import io.vertx.core.json.JsonArray;

public interface CourseService {

    /**
     * Search for a user or a group
     *
     * @param structureId Structure identifier
     */
    Future<JsonArray> getCourses(String structureId, String startAt, String endAt, JsonArray teacherIds, JsonArray groupIds,
                    JsonArray groupExternalIds, JsonArray groupNames, String startTime, String endTime,
                    Boolean union, Boolean crossDateFilter);
}

package fr.cgi.edt.services;


import fr.cgi.edt.models.Audience;
import fr.cgi.edt.models.FormattedService;
import fr.cgi.edt.models.InitFormTimetable;
import fr.cgi.edt.models.Timeslot;
import io.vertx.core.Future;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.user.UserInfos;

import java.util.Date;
import java.util.List;

public interface CourseService {

    /**
     * Search for a user or a group
     *
     * @param structureId Structure identifier
     */
    Future<JsonArray> getCourses(String structureId, String startAt, String endAt, JsonArray teacherIds, JsonArray groupIds,
                    JsonArray groupExternalIds, JsonArray groupNames, String startTime, String endTime,
                    Boolean union, Boolean crossDateFilter, UserInfos user);

    /**
     * Create init courses
     * @param structureId structure id
     * @param subjectId subject id
     * @param startDate start date
     * @param endDate end date
     * @param timetable timetable object with half day/full day info
     * @param timeslots timeslots list
     * @param userId creator id
     * @return future
     */
    Future<Void> createInitCourses(String structureId, String subjectId, Date startDate, Date endDate,
                                         InitFormTimetable timetable, List<Timeslot> timeslots, String userId);

    /**
     * Delete courses with subject id
     * @param structureId structure id
     * @param subjectId subject id
     * @return future
     */
    Future<JsonObject> deleteCoursesWithSubjectId(String structureId, String subjectId);

    /**
     * Get audience object from id
     * @param audienceId audience id
     * @param isGroup true is audience is a Group, false if audience is a Class
     * @return audience object
     */
    Future<Audience> getAudienceFromId(String audienceId, boolean isGroup);

    /**
     * Get services formatted for courses (multiple teachers allowed per course)
     * @param structureId structure id
     * @return list of formatted services
     */
    Future<List<FormattedService>> getServicesForCourses(String structureId);
}

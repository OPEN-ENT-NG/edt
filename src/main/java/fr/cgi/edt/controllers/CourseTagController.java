package fr.cgi.edt.controllers;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.helper.CourseTagHelper;
import fr.cgi.edt.security.workflow.ManageCourseWorkflowAction;
import fr.cgi.edt.services.CourseTagService;
import fr.cgi.edt.services.impl.DefaultCourseTagService;
import fr.wseduc.rs.*;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import org.entcore.common.controller.ControllerHelper;
import org.entcore.common.http.filter.ResourceFilter;

public class CourseTagController extends ControllerHelper {

    private final CourseTagService courseTagService;

    public CourseTagController(CourseTagService courseTagService) {
        this.courseTagService = courseTagService;
    }

    @Get("/structures/:structureId/course/tags")
    @ApiDoc("Get course tags")
    @ResourceFilter(ManageCourseWorkflowAction.class)
    public void getCourseTags(final HttpServerRequest request) {
        String structureId = request.getParam(Field.STRUCTUREID);

        courseTagService.getCourseTags(structureId)
                .onSuccess(result -> renderJson(request, new JsonArray(result)))
                .onFailure(err -> badRequest(request));

    }

    @Post("/structures/:structureId/course/tag")
    @ResourceFilter(ManageCourseWorkflowAction.class)
    public void createCourseTag(final HttpServerRequest request) {
        RequestUtils.bodyToJson(request, pathPrefix + "courseTag", courseTag -> {
            String structureId = request.getParam(Field.STRUCTUREID);

            courseTagService.createCourseTag(structureId, courseTag)
                    .onSuccess(result -> renderJson(request, result))
                    .onFailure(err -> badRequest(request));
        });
    }

    @Delete("/structures/:structureId/course/tag/:id")
    @ResourceFilter(ManageCourseWorkflowAction.class)
    public void deleteCourseTag(final HttpServerRequest request) {

        String structureId = request.getParam(Field.STRUCTUREID);
        Integer courseTagId = Integer.parseInt(request.getParam(Field.ID));

        courseTagService.deleteCourseTag(structureId, courseTagId)
                .onSuccess(result -> renderJson(request, result))
                .onFailure(err -> badRequest(request));
    }

    @Put("/course/tag")
    @ResourceFilter(ManageCourseWorkflowAction.class)
    public void updateCourseTag(final HttpServerRequest request) {

        RequestUtils.bodyToJson(request, pathPrefix + "courseTag", courseTag -> {
            courseTagService.updateCourseTag(courseTag)
                    .onSuccess(result -> renderJson(request, result))
                    .onFailure(err -> badRequest(request));
        });
    }

    @Put("/structures/:structureId/course/tag/:id/hidden")
    @ResourceFilter(ManageCourseWorkflowAction.class)
    public void updateCourseTagHidden(final HttpServerRequest request) {

        String structureId = request.getParam(Field.STRUCTUREID);
        Integer courseTagId = Integer.parseInt(request.getParam(Field.ID));

        RequestUtils.bodyToJson(request, body -> courseTagService.updateCourseTagHidden(structureId,
                        courseTagId, body.getBoolean(Field.ISHIDDEN, false))
                .onSuccess(result -> renderJson(request, result))
                .onFailure(err -> badRequest(request)));
    }
}

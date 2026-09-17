import {ng, Service} from "entcore";
import {CourseTag} from "../model/courseTag";
import {http, HttpResponse} from 'entcore-toolkit';

export interface ICourseTagService {
    getCourseTags(structureId: string): Promise<Array<CourseTag>>;

    createCourseTag(structureId: string, courseTag: CourseTag): Promise<HttpResponse>;

    updateCourseTagHidden(structureId: string, tagId: number, isHidden: boolean): Promise<HttpResponse>;

    deleteCourseTag(structureId: string, tagId: number): Promise<HttpResponse>;

    updateCourseTag(courseTag: CourseTag): Promise<HttpResponse>;
}

export const courseTagService: ICourseTagService = {
    getCourseTags: async (structureId: string): Promise<Array<CourseTag>> => {
        return http.get(`/edt/structures/${structureId}/course/tags`)
            .then((res: HttpResponse): Array<CourseTag> => {return res.data; });
    },

    createCourseTag: async (structureId: string, courseTag: CourseTag): Promise<HttpResponse> => {
        return http.post(`/edt/structures/${structureId}/course/tag`, courseTag);
    },

    updateCourseTagHidden: async (structureId: string, tagId: number, isHidden: boolean): Promise<HttpResponse> => {
        return http.put(`/edt/structures/${structureId}/course/tag/${tagId}/hidden`, {isHidden: isHidden});
    },

    deleteCourseTag: async (structureId: string, tagId: number): Promise<HttpResponse> => {
        return http.delete(`/edt/structures/${structureId}/course/tag/${tagId}`);
    },

    updateCourseTag: async (courseTag: CourseTag): Promise<HttpResponse> => {
        return http.put(`/edt/course/tag`, courseTag);
    }

};

export const CourseTagService: Service = ng.service('CourseTagService',
    (): ICourseTagService => courseTagService);
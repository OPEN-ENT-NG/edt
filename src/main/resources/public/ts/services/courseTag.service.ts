import {ng, Service} from "entcore";
import {CourseTag} from "../model/courseTag";
import http, {AxiosResponse} from 'axios';

export interface ICourseTagService {
    getCourseTags(structureId: string): Promise<Array<CourseTag>>;

    createCourseTag(structureId: string, courseTag: CourseTag): Promise<AxiosResponse>;

    updateCourseTagHidden(structureId: string, tagId: number, isHidden: boolean): Promise<AxiosResponse>;

    deleteCourseTag(structureId: string, tagId: number): Promise<AxiosResponse>;

    updateCourseTag(courseTag: CourseTag): Promise<AxiosResponse>;
}

export const courseTagService: ICourseTagService = {
    getCourseTags: async (structureId: string): Promise<Array<CourseTag>> => {
        return http.get(`/edt/structures/${structureId}/course/tags`)
            .then((res: AxiosResponse): Array<CourseTag> => {return res.data; });
    },

    createCourseTag: async (structureId: string, courseTag: CourseTag): Promise<AxiosResponse> => {
        return http.post(`/edt/structures/${structureId}/course/tag`, courseTag);
    },

    updateCourseTagHidden: async (structureId: string, tagId: number, isHidden: boolean): Promise<AxiosResponse> => {
        return http.put(`/edt/structures/${structureId}/course/tag/${tagId}/hidden`, {isHidden: isHidden});
    },

    deleteCourseTag: async (structureId: string, tagId: number): Promise<AxiosResponse> => {
        return http.delete(`/edt/structures/${structureId}/course/tag/${tagId}`);
    },

    updateCourseTag: async (courseTag: CourseTag): Promise<AxiosResponse> => {
        return http.put(`/edt/course/tag`, courseTag);
    }

};

export const CourseTagService: Service = ng.service('CourseTagService',
    (): ICourseTagService => courseTagService);
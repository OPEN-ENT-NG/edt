import {ng, Service} from "entcore";
import {http, HttpResponse} from 'entcore-toolkit';

export interface ICourseService {
    getCourseRecurrenceDates(recurrenceId: string): Promise<{startDate: string; endDate: string}>;

    updateCoursesTag(courseIds: Array<string>, tagId: string): Promise<HttpResponse>;
}

export const courseService: ICourseService = {
    getCourseRecurrenceDates: async (recurrenceId: string): Promise<{startDate: string; endDate: string}> => {
        return http.get(`/edt/courses/recurrences/dates/${recurrenceId}`)
            .then((res: HttpResponse): { startDate: string; endDate: string} => {
                return res.data;
            });
    },

    updateCoursesTag: async (courseIds: Array<string>, tagId: string): Promise<HttpResponse> => {
        return http.put(`/edt/courses/tag`, {courseIds: courseIds, tagId: tagId});
    }
};

export const CourseService: Service = ng.service('CourseService',
    (): ICourseService => courseService);
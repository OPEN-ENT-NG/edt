import {ng, Service} from "entcore";
import http, {AxiosResponse} from 'axios';

export interface ICourseService {
    getCourseRecurrenceDates(recurrenceId: string): Promise<{startDate: string; endDate: string}>;
}

export const courseService: ICourseService = {
    getCourseRecurrenceDates: async (recurrenceId: string): Promise<{startDate: string; endDate: string}> => {
        return http.get(`/edt/courses/recurrences/dates/${recurrenceId}`)
            .then((res: AxiosResponse): { startDate: string; endDate: string} => {
                return res.data;
            });
    }
};

export const CourseService: Service = ng.service('CourseService',
    (): ICourseService => courseService);
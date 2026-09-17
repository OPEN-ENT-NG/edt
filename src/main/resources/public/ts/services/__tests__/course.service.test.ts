jest.mock('entcore-toolkit', () => Object.assign({}, (jest as any).requireActual('entcore-toolkit'), {
  http: {get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), postFile: jest.fn(), putFile: jest.fn()}
}));

import { http } from 'entcore-toolkit';
import { courseService } from "../course.service";

describe("courseService", (): void => {
  it("GET getCourseRecurrenceDates", (done) => {
    const data: { startDate: string; endDate: string } = {
      startDate: "startDate",
      endDate: "endDate",
    };
    const recurrenceId: string = "recurrenceId";
    const url = `/edt/courses/recurrences/dates/${recurrenceId}`;

    (http.get as jest.Mock).mockResolvedValueOnce({data, status: 200, statusText: 'OK', headers: {}, config: {}});
    courseService
      .getCourseRecurrenceDates(recurrenceId)
      .then((response: { startDate: string; endDate: string }): void => {
        expect(response).toEqual(data);
      });
    expect(http.get).toHaveBeenCalledWith(url);
    done();
  });
});

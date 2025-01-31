import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { courseService } from "../course.service";

describe("courseService", (): void => {
  it("GET getCourseRecurrenceDates", (done) => {
    const mock = new MockAdapter(axios);
    const data: { startDate: string; endDate: string } = {
      startDate: "startDate",
      endDate: "endDate",
    };
    const recurrenceId: string = "recurrenceId";

    mock
      .onGet(`/edt/courses/recurrences/dates/${recurrenceId}`)
      .reply(200, data);
    courseService
      .getCourseRecurrenceDates(recurrenceId)
      .then((response: { startDate: string; endDate: string }): void => {
        expect(response).toEqual(data);
      });
    done();
  });
});

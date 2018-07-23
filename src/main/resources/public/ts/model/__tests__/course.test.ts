// import { model } from 'entcore';
// import * as moment from 'moment';
// import http from 'axios';
// import MockAdapter from 'axios-mock-adapter';
// import { Courses, Structure, Teacher } from '../index';
// import { data } from '../__mocks__/courses';
//
// const mock = new MockAdapter(http);
//
// declare let global: any;
//
// describe('[Course] Courses', () => {
//
//     test('Courses implementation should return an object containing a `all` array and a `origin` array', () => {
//         const courses: Courses = new Courses();
//         expect(courses.hasOwnProperty('all')).toBeTruthy();
//         expect(courses.all).toEqual([]);
//         expect(courses.hasOwnProperty('origin')).toBeTruthy();
//         expect(courses.origin).toEqual([]);
//     });
//
//     test('Courses synchronization should return 2 objects inside origin array', async () => {
//         const courses: Courses = new Courses();
//         let firstDate = moment(global.dayOfWeek).hour(0).minute(0).format('YYYY-MM-DD');
//         let endDate = moment(global.dayOfWeek).add(7, 'day').hour(0).minute(0).format('YYYY-MM-DD');
//         mock.onGet(`/directory/timetable/courses/${global.structureId}/${firstDate}/${endDate}?teacherId=${global.teacherId}`)
//             .reply(200, data);
//
//         await courses.sync(new Structure(global.structureId), [], []);
//         expect(courses.origin.length).toBe(2);
//     });
// });

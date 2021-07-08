jest.mock('entcore', () => ({
    ng: {service: jest.fn()}
}));

import {Courses} from '../index';

describe('[Course] Courses', () => {

    test('Courses implementation should return an object containing a `all` array', () => {
        const courses: Courses = new Courses();
        expect(courses.hasOwnProperty('all')).toBeTruthy();
        expect(courses.all).toEqual([]);
    });
});

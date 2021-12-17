import {Students} from '../index';

describe('[Student] Students', (): void => {

    it('Students implementation should return an object containing a `all` array', done => {
        const students: Students = new Students();
        expect(students.hasOwnProperty('all')).toBeTruthy();
        expect(students.all).toEqual([]);
        done();
    });
});

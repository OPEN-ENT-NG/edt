import { model } from 'entcore/entcore';
import { moment } from 'entcore/libs/moment/moment';
import http from 'axios';
import { USER_TYPES, Structure, Teacher, Group} from './index';

const colors = ['cyan', 'green', 'orange', 'pink', 'yellow', 'purple', 'grey'];

export class Course {
    _id: string;
    structureId: string;
    startDate: string;
    endDate: string;
    dayOfWeek: number;
    teacherIds: string[];
    subjectId: string;
    roomLabels: string[];
    classes: string[];
    groups: string[];
    color: string;
    is_periodic: boolean;
    startMoment: any;
    startMomentDate: string;
    startMomentTime: string;
    endMoment: any;
    endMomentDate: string;
    endMomentTime: string;
    subjectLabel: string;

    constructor (obj: any, startDate?: string, endDate?: string) {
        if (obj instanceof Object) {
            for (let key in obj) {
                this[key] = obj[key];
            }
        }
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.is_periodic = false;

        this.startMoment = moment(typeof startDate === 'string' ? startDate : this.startDate);
        this.startMomentDate = this.startMoment.format('DD/MM/YYYY');
        this.startMomentTime = this.startMoment.format('hh:mm');

        this.endMoment = moment(typeof endDate === 'string' ? endDate : this.endDate);
        this.endMomentDate = this.endMoment.format('DD/MM/YYYY');
        this.endMomentTime = this.endMoment.format('hh:mm');
    }
}

export class Courses {
    all: Course[];

    constructor () {
        this.all = [];
    }

    /**
     * Synchronize courses.
     * @param structure structure
     * @param teacher teacher. Can be null. If null, group need to be provide.
     * @param group group. Can be null. If null, teacher needs to be provide.
     * @returns {Promise<void>} Returns a promise.
     */
    async sync(structure: Structure, teacher: Teacher | null, group: Group | null): Promise<void> {
        try {
            let firstDate = moment(model.calendar.dayForWeek).format('YYYY-MM-DD');
            let endDate = moment(model.calendar.dayForWeek).add(7, 'day').format('YYYY-MM-DD');
            let filter = '';
            if (group === null) filter += `teacherId=${model.me.type === USER_TYPES.personnel ? teacher.id : model.me.userId}`;
            if (teacher === null && group !== null) filter += `group=${group.name}`;
            let uri = `/directory/timetable/courses/${structure.id}/${firstDate}/${endDate}?${filter}`;
            let courses = await http.get(uri);
            this.all = this.formatCourses(courses.data, structure);
            return;
        } catch (e) {
            throw new Error();
        }
    }

    /**
     * Format courses to display them in the calendar directive
     * @param courses courses
     * @param structure structure
     * @returns {Array} Returns an array containing Course object.
     */
    formatCourses (courses: any[], structure: Structure): Course[] {
        let arr = [];
        courses.forEach((course) => {
            let numberWeek = Math.floor(moment(course.endDate).diff(course.startDate, 'days') / 7);
            let startMoment = moment(course.startDate);
            let endMoment = moment(course.endDate).add(moment(course.startDate).diff(course.endDate, 'days'), 'days');
            for (let i = 0; i < numberWeek; i++) {
                let c = new Course(course, startMoment.format(), endMoment.format());
                c.subjectLabel = structure.subjects.mapping[course.subjectId];
                arr.push(c);
                startMoment = startMoment.add(7, 'days');
                endMoment = endMoment.add(7, 'days');
            }
        });
        return arr;
    }
}
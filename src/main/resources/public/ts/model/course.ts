import { model } from 'entcore/entcore';
import { moment } from 'entcore/libs/moment/moment';
import http from 'axios';
import { Structure } from './structure';

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
    subjectName: string;

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

    async sync(structure: Structure): Promise<void> {
        try {
            let firstDate = moment(model.calendar.dayForWeek).format('YYYY-MM-DD');
            let endDate = moment(model.calendar.dayForWeek).add(7, 'day').format('YYYY-MM-DD');
            let uri = '/directory/timetable/courses/' + structure.id +
                '/' + firstDate + '/' + endDate + '?teacherId=' + model.me.userId;
            let courses = await http.get(uri);
            let arr = [];
            courses.data.forEach((course) => {
                let numberWeek = Math.floor(moment(course.endDate).diff(course.startDate, 'days') / 7);
                let startMoment = moment(course.startDate);
                let endMoment = moment(course.endDate).add(moment(course.startDate).diff(course.endDate, 'days'), 'days');
                for (let i = 0; i < numberWeek; i++) {
                    let c = new Course(course, startMoment.format(), endMoment.format());
                    c.subjectName = structure.subjects.mapping[course.subjectId];
                    arr.push(c);
                    startMoment = startMoment.add(7, 'days');
                    endMoment = endMoment.add(7, 'days');
                }
            });
            this.all = arr;
            return;
        } catch (e) {
            throw new Error();
        }
    }
}
import { model, moment, _, notify } from 'entcore';
import http from 'axios';
import { USER_TYPES, Structure, Teacher, Group, CourseOccurrence, Utils} from './index';

const colors = ['cyan', 'green', 'orange', 'pink', 'yellow', 'purple', 'grey'];

export class Course {
    _id: string;
    structureId: string;
    startDate: string | object;
    endDate: string | object;
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
    startCalendarHour: Date;
    endCalendarHour: Date;
    endMoment: any;
    endMomentDate: string;
    endMomentTime: string;
    subjectLabel: string;
    courseOccurrences: CourseOccurrence[];
    teachers: Teacher[];

    constructor (obj: object, startDate?: string | object, endDate?: string | object) {
        if (obj instanceof Object) {
            for (let key in obj) {
                this[key] = obj[key];
            }
        }
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.is_periodic = false;
        if (startDate) {
            this.startMoment = moment(startDate);
            this.startCalendarHour = this.startMoment.seconds(0).millisecond(0).toDate();
            this.startMomentDate = this.startMoment.format('DD/MM/YYYY');
            this.startMomentTime = this.startMoment.format('hh:mm');
        }
        if (endDate) {
            this.endMoment = moment(endDate);
            this.endCalendarHour = this.endMoment.seconds(0).millisecond(0).toDate();
            this.endMomentDate = this.endMoment.format('DD/MM/YYYY');
            this.endMomentTime = this.endMoment.format('hh:mm');
        }
    }

    async save () {
        await this.create();
        return;
    }

    async create () {
        try {
            let arr = [];
            this.teacherIds = Utils.getValues(this.teachers, 'id');
            this.startDate = Utils.getOccurrenceStartDate(this.startMoment, this.startCalendarHour, this.startMoment.day());
            this.endDate = Utils.getOccurrenceEndDate(this.endMoment, this.endCalendarHour, this.endMoment.day());
            this.classes = Utils.getValues(_.where(this.groups, { type_groupe: Utils.getClassGroupTypeMap()['CLASS']}), 'name');
            this.groups = Utils.getValues(_.where(this.groups, { type_groupe: Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP']}), 'name');
            arr.push(this.toJSON());
            await http.post('/edt/course', arr);
            return;
        } catch (e) {
            notify.error('edt.notify.create.err');
            throw e;
        }
    }

    toJSON () {
        return {
            structureId: this.structureId,
            subjectId: this.subjectId,
            teacherIds: this.teacherIds,
            classes: this.classes,
            groups: this.groups,
            endDate: this.endDate,
            startDate: this.startDate,
            roomLabels: this.roomLabels,
            dayOfWeek: this.dayOfWeek,
            manual: true
        }
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
        if (teacher === null && group === null) return;
        let firstDate = moment(model.calendar.dayForWeek).format('YYYY-MM-DD');
        let endDate = moment(model.calendar.dayForWeek).add(6, 'day').format('YYYY-MM-DD');
        let filter = '';
        if (group === null) filter += `teacherId=${model.me.type === USER_TYPES.personnel ? teacher.id : model.me.userId}`;
        if (teacher === null && group !== null) filter += `group=${group.name}`;
        let uri = `/directory/timetable/courses/${structure.id}/${firstDate}/${endDate}?${filter}`;
        let courses = await http.get(uri);
        if (courses.data.length > 0) {
            this.all = Utils.formatCourses(courses.data, structure);
        }
        return;
    }

    /**
     * Create course with occurrences
     * @param {Course} course course to Create
     * @returns {Promise<void>}
     */
    async create (course: Course): Promise<void> {
        try {
            let courses = [], occurrence: any;
            for (let i = 0; i < course.courseOccurrences.length; i++) {
                occurrence = course.courseOccurrences[i].toJSON();
                occurrence.structureId = course.structureId;
                occurrence.subjectId = course.subjectId;
                occurrence.teacherIds = Utils.getValues(course.teachers, 'id');
                occurrence.classes = Utils.getValues(_.where(course.groups, { type_groupe: Utils.getClassGroupTypeMap()['CLASS']}), 'name');
                occurrence.groups = Utils.getValues(_.where(course.groups, { type_groupe: Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP']}), 'name');
                occurrence.startDate = Utils.getOccurrenceStartDate(course.startDate, course.courseOccurrences[i].startTime, occurrence.dayOfWeek);
                occurrence.endDate = Utils.getOccurrenceEndDate(course.endDate, course.courseOccurrences[i].endTime, occurrence.dayOfWeek);
                occurrence.manual = true;
                courses.push(occurrence);
            }
            await http.post('/edt/course', courses);
            return;
        } catch (e) {
            notify.error('edt.notify.create.err')
        }


    }
}
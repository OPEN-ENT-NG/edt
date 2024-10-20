import {_, model, moment, notify} from 'entcore';
import http from 'axios';
import {Mix} from 'entcore-toolkit';
import {CourseOccurrence, Group, ISubject, Teacher, USER_TYPES, Utils} from './index';
import {Structure} from './structure';
import {Moment} from 'moment';
import {DATE_FORMAT} from "../core/constants/dateFormat";

declare const window: any;

export interface ICourse {
    teacherIds: Array<string>;
    groupIds: Array<string>;
    groupExternalIds: Array<string>;
    groupNames: Array<string>;
    union: boolean;
    tagIds?: Array<number>;
}

export class Course {
    _id: string;
    classes: Array<string> = [];
    groups: Array<Group> = [];
    teachers: Array<Teacher> = [];
    subjectLabel: string = '';
    exceptionnal ?: string;
    dayOfWeek: number = null;
    endDate: string | object;
    startDate: string | object;
    idStartSlot: string;
    idEndSlot: string;
    timeSlot: any;
    everyTwoWeek: boolean = undefined;
    structure: Structure = null;
    structureId: string = undefined;
    teacherIds: Array<string> = [];
    tagIds?: Array<number> = [];
    subjectId: string = '';
    subject?: ISubject;
    roomLabels: Array<string> = [];
    courseOccurrences: Array<CourseOccurrence> = [];
    created: string = '';
    modified: string = '';
    is_recurrent: boolean = undefined;
    recurrence: string;
    newRecurrence: string;
    canManage: boolean;
    display: any;
    recurrenceObject: any;
    timeToDelete?: Array<string>;

    constructor(obj?: object) {
        if (obj && obj instanceof Object) {
            for (let key in obj) {
                this[key] = obj[key];
            }
            this.is_recurrent = this.recurrence !== undefined ? true : this.isRecurrent();
        }
    }

    async save() {
        if (this._id) await this.update();
        else await this.create();

    }

    async update() {
        try {
            let url = `/edt/courses/${this.recurrence ? `recurrences/${this.recurrence}` : this._id}`;
            await http.put(url, this.toJSON());
            return;
        } catch (e) {
            notify.error('edt.notify.update.err');
        }
    }

    async create() {
        try {
            await http.post('/edt/course', [this.toJSON()]);
            return;
        } catch (e) {
            notify.error('edt.notify.create.err');
            console.error(e);
            throw e;
        }
    }

    async sync(id, structure?: Structure) {
        try {
            let {data} = await http.get(`/viescolaire/common/course/${id}`);
            Mix.extend(this, Mix.castAs(Course, new Course(data)));
            this.canManage = this.canIManageCourse();
            if (structure) this.mapWithStructure(structure);

        } catch (e) {
            notify.error('edt.notify.sync.err');
        }
    }

    async mapWithStructure(structure: Structure) {
        this.teachers = _.map(this.teacherIds, (id) => {
            let teacher = _.findWhere(structure.teachers.all, {id: id});
            if (teacher) return teacher;
        });
        this.groups = _.map(_.union(this.groups, this.classes), (groupName) => {
            if (typeof (groupName) === 'string') {
                let group = _.findWhere(structure.groups.all, {name: groupName});
                if (group) return group;
            }
        });
    };

    /**
     * Delete course.
     * @param occurrenceDate Dates of course occurrences.
     * @param deleteOnlyOneCourses Optional. If true delete only one course.
     * @param deleteAllOccurrences Optional. If true delete all occurrences.
     */
    delete = async (id?: string, recurrence?: string): Promise<void> => {
        if (!id && !recurrence) {
            throw "Unable to find course identifier or recurrence identifier";
        }

        try {
            await http.delete(id ? `/edt/courses/${id}` : `/edt/courses/recurrences/${recurrence}`);
        } catch (e) {
            throw e;
        }
    };

    /**
     * Returns the Course JSON object.
     */
    toJSON(): any {
        let o: any = {
            structureId: this.structureId,
            subjectId: this.subjectId,
            teacherIds: _.pluck(this.teachers, 'id'),
            tagIds: this.tagIds,
            classes: _.pluck(_.where(this.groups, {type_groupe: Utils.getClassGroupTypeMap()['CLASS']}), 'name'),
            classesExternalIds: _.pluck(_.where(this.groups, {type_groupe: Utils.getClassGroupTypeMap()['CLASS']}), 'externalId'),
            classesIds: this.groups
                .filter((group: Group) => group.type_groupe === Utils.getClassGroupTypeMap()['CLASS'])
                .map((group: Group) => group.id),
            groups: _.pluck(_.filter(this.groups, (group) => {
                return _.contains([Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP'], Utils.getClassGroupTypeMap()['MANUAL_GROUP']], group.type_groupe)
            }), 'name'),
            groupsExternalIds: _.pluck(_.filter(this.groups, (group) => {
                return _.contains([Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP'], Utils.getClassGroupTypeMap()['MANUAL_GROUP']], group.type_groupe)
            }), 'externalId'),
            groupsIds: this.groups
                .filter((group: Group) => group.type_groupe === Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP'] ||
                    group.type_groupe === Utils.getClassGroupTypeMap()['MANUAL_GROUP'])
                .map((group: Group) => group.id),
            roomLabels: this.roomLabels,
            dayOfWeek: this.is_recurrent ? parseInt(this.dayOfWeek.toString()) : parseInt(moment(this.startDate).day()),
            manual: true,
            theoretical: false,
            everyTwoWeek: this.everyTwoWeek,
            exceptionnal: (this.exceptionnal) ? this.exceptionnal : undefined,
            updated: moment(),
            lastUser: model.me.login
        };

        if (!this.structureId && this.structure && this.structure.id) {
            o.structureId = this.structure.id;
        }

        if (this._id) {
            o._id = this._id;
        }

        if (this.recurrence) {
            o.recurrence = this.recurrence;
        }

        if (this.newRecurrence) {
            o.newRecurrence = this.newRecurrence;
        }

        o.startDate = moment(this.startDate).format('YYYY-MM-DDTHH:mm:ss');
        o.endDate = moment(this.endDate).format('YYYY-MM-DDTHH:mm:ss');
        o.idStartSlot = this.idStartSlot;
        o.idEndSlot = this.idEndSlot;
        return o;
    }

    getCourseForEachOccurrence(): Courses {
        let courses = new Courses();
        for (let i = 0; i < this.courseOccurrences.length; i++) {
            let newCourses = this.splitOccurrenceInMultipleCourse(this.courseOccurrences[i]);
            courses.all.push(...newCourses);
        }
        return courses
    }

    splitOccurrenceInMultipleCourse(occurrence): Course[] {
        let courses = [];
        let weekCount = moment(occurrence.endTime).diff(moment(occurrence.startTime), 'week') + 1;
        let recurrence = Utils.uuid();
        let courseDelta = this.everyTwoWeek ? 14 : 7;
        for (let i = 0; i < weekCount; i++) {
            let course = _.clone(this);
            let startTimeDayOfWeek = parseInt(occurrence.dayOfWeek);
            let startDate = moment(this.startDate).day(startTimeDayOfWeek).add(i * courseDelta, 'days');
            if (this.isOccurrenceLowerThanStartDate(startDate) || this.isOccurrenceGreaterThanEndDate(startDate)) continue;
            let endDate = startDate.clone();
            course.startDate = moment(moment(startDate).format("YYYY-MM-DD") + "T" + moment(occurrence.startTime).format("HH:mm"));
            course.endDate = moment(moment(endDate).format("YYYY-MM-DD") + "T" + moment(occurrence.endTime).format("HH:mm"));
            course.roomLabels = occurrence.roomLabels;
            course.dayOfWeek = this.is_recurrent ? occurrence.dayOfWeek : moment(startDate).day();
            course.recurrence = recurrence;
            courses.push(course);
        }

        return courses;
    }

    private isOccurrenceGreaterThanEndDate(occurrenceStartDate) {
        return occurrenceStartDate.diff(moment(this.endDate), 'days') > 0
    }

    private isOccurrenceLowerThanStartDate(occurrenceStartDate) {
        return moment(this.startDate).diff(occurrenceStartDate, 'days') > 0
    }

    syncCourseWithOccurrence(occurrence): Course {
        this.dayOfWeek = this.is_recurrent ? occurrence.dayOfWeek : moment(this.startDate).day();
        this.roomLabels = occurrence.roomLabels;
        this.startDate = moment(moment(this.startDate).format("YYYY-MM-DD") + "T" + moment(occurrence.startTime).format("HH:mm"));
        this.endDate = moment(moment(this.endDate).format("YYYY-MM-DD") + "T" + moment(occurrence.endTime).format("HH:mm"));
        return this;
    }

    isRecurrent(): boolean {
        return moment(this.endDate).diff(moment(this.startDate), 'days') != 0;
    }

    /**
     * Check if the course can be created/modified from the form data.
     * @param startTime start time of the course form.
     */
    canIManageCourse = (startTime?: string): boolean => {
        let now: Moment = moment();
        let startDate: Moment;

        if (startTime) {
            startDate = moment(startTime);
        } else {
            startDate = moment(this.startDate);
        }
        return (moment(startDate).isAfter(now));
    };

    isInFuture(): boolean {
        let now = moment();
        return !this.isRecurrent() && moment(this.startDate).isAfter(now)
            || (this.isRecurrent() && now.isBefore(moment(this.startDate).day(this.dayOfWeek)))

    };

    /**
     * get next occurrence date from à Moment
     * @param {moment.Moment} date
     * @returns {string}
     */
// TODO Depreciate function delete asap
    getNextOccurrenceDate(date: Moment | Object | string): string {
        let momentDate = moment(date);
        let occurrence = moment(_.clone(momentDate));
        occurrence.day(this.dayOfWeek);
        if (momentDate.isAfter(occurrence)) {
            occurrence.add('days', this.everyTwoWeek ? 14 : 7);
        }
        if (occurrence.isAfter(this.endDate)) {
            return moment(this.endDate).format(DATE_FORMAT['YEAR-MONTH-DAY']);
        }
        return occurrence.format(DATE_FORMAT['YEAR-MONTH-DAY']);
    }


    getPreviousOccurrenceDate(date: Moment | Object | string): string {
        let momentDate = moment(date);
        let occurrence = moment(_.clone(momentDate));
        occurrence.day(this.dayOfWeek);
        if (momentDate.isBefore(occurrence)) {
            occurrence.add('days', this.everyTwoWeek ? -14 : -7);
        }
        return occurrence.format('YYYY-MM-DD');
    }

    async retrieveRecurrence(): Promise<Course[]> {
        try {
            if (!this.recurrence) return [];
            const {data} = await http.get(`/edt/courses/recurrences/${this.recurrence}`);
            return Mix.castArrayAs(Course, data);
        } catch (e) {
            return [];
        }
    }
}

export class Courses {
    all: Course[];

    constructor() {
        this.all = [];
    }

    /**
     * Create course with occurrences
     * @returns {Promise<void>}
     */
    async create(courses: Course[]): Promise<void> {
        try {
            await http.post('/edt/course', courses);
            return;
        } catch (e) {
            notify.error('edt.notify.create.err');
            console.error(e);
            throw e;
        }
    }

    async save(): Promise<void> {
        let courseGroupById: {[key: string]: Course[]} = _.groupBy(this.all, function (course: Course) {
            return !!course._id;
        });
        if (courseGroupById['true'])
            await this.update(courseGroupById.true);
        if (courseGroupById['false'])
            await this.create(courseGroupById.false);
        return;
    }

    async update(courses: Course[]): Promise<void> {
        try {
            await http.put('/edt/course', courses);
            return;
        } catch (e) {
            notify.error('edt.notify.update.err');
        }
    }
}
import { model, moment, _, notify, Behaviours } from 'entcore';
import http from 'axios';
import { Mix } from 'entcore-toolkit';
import { USER_TYPES, Structure, Teacher, Group, CourseOccurrence, Utils} from './index';



export class Course {
    _id: string;
    _occurenceId?: string;
    structureId: string;
    startDate: string | object;
    endDate: string | object;
    dayOfWeek: number;
    teacherIds: string[];
    subjectId: string;
    roomLabels: string[] = [];
    classes: string[];
    groups: string[];
    color: string;
    is_periodic: boolean;
    is_recurrent: boolean;
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
    everyTwoWeek: boolean;
    originalStartMoment?: any;
    originalEndMoment?: any;
    startCourse:string|Date;
    endCourse: string|Date;
    locked:boolean;
    constructor (obj: object, startDate?: string | object, endDate?: string | object) {
        if (obj instanceof Object) {
            for (let key in obj) {
                this[key] = obj[key];
            }
        }

        if (!model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.create)) this.locked = true;
        if (startDate) {
            this.startMoment = moment(startDate);
            this.startCalendarHour = this.startMoment.seconds(0).millisecond(0).toDate();
            this.startMomentDate = this.startMoment.format('DD/MM/YYYY');
            this.startMomentTime = this.startMoment.format('HH:mm');
        }
        if (endDate) {
            this.endMoment = moment(endDate);
            this.endCalendarHour = this.endMoment.seconds(0).millisecond(0).toDate();
            this.endMomentDate = this.endMoment.format('DD/MM/YYYY');
            this.endMomentTime = this.endMoment.format('HH:mm');
        }
    }

    async save () {
        await this.create();
        return;
    }

    async create () {
        try {
            let arr = [];
            this.teacherIds = _.pluck(this.teachers, 'id');
            this.startDate = moment(this.startMoment).format('YYYY-MM-DDTHH:mm:ss');
            this.endDate = moment(this.endMoment).format('YYYY-MM-DDTHH:mm:ss');
            this.classes = _.pluck(_.where(this.groups, { type_groupe: Utils.getClassGroupTypeMap()['CLASS']}), 'name');
            this.groups = _.pluck(_.where(this.groups, { type_groupe: Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP']}), 'name');
            this.startDate = Utils.mapStartMomentWithDayOfWeek(this.startDate, this.dayOfWeek);
            arr.push(this.toJSON());
            await http.post('/edt/course', arr);
            return;
        } catch (e) {
            notify.error('edt.notify.create.err');
            console.error(e);
            throw e;
        }
    }
    async sync (id) {
        try {
           let  { data } =  await http.get(`/viescolaire/common/course/${id}`);
            data.endCourse = data.endDate;
            data.startCourse = data.startDate;
            Mix.extend(this, Mix.castAs(Course, new Course(data, data.startDate, data.endDate)));
        } catch (e) {
            notify.error('edt.notify.sync.err');
        }
    }
    async delete () {
        try {
            await http.delete(`/edt/course/${this._id}`);
        } catch (e) {
            notify.error('edt.notify.delete.err');
        }
    }

    toJSON () {
        let o: any = {
            structureId: this.structureId,
            subjectId: this.subjectId,
            teacherIds: this.teacherIds,
            classes: this.classes,
            groups: this.groups,
            endDate: this.endCourse,
            startDate: this.startCourse,
            roomLabels: this.roomLabels,
            dayOfWeek: this.dayOfWeek,
            manual: true,
            everyTwoWeek: this.everyTwoWeek
        };
        if (this._id) {
            o._id = this._id;
        }
        return o;
    }
}

export class Courses {
    all: Course[];
    origin: Course[];

    constructor () {
        this.all = [];
        this.origin = [];
    }

    /**
     * Synchronize courses.
     * @param structure structure
     * @param teacher teacher. Can be null. If null, group need to be provide.
     * @param group group. Can be null. If null, teacher needs to be provide.
     * @returns {Promise<void>} Returns a promise.
     */
    async sync(structure: Structure, teacher: Array<Teacher> = [] , group: Array<Group> = []  ): Promise<void> {
        let firstDate = Utils.getFirstCalendarDay();
        firstDate = moment(firstDate).format('YYYY-MM-DD');
        let endDate = Utils.getLastCalendarDay();
        endDate = moment(endDate).format('YYYY-MM-DD');
        if (!structure ||  teacher.length <=0  &&  group.length<=0 || !firstDate || !endDate ) return;
        let filter = '';
        if (group.length <= 0 )
            filter += model.me.type === USER_TYPES.personnel ? this.getFilterTeacher(teacher): 'teacherId='+model.me.userId;
        if (teacher.length <= 0  && group.length > 0 )
            filter += this.getFilterGroup(group);
        let uri = `/viescolaire/common/courses/${structure.id}/${firstDate}/${endDate}?${filter}`;
        let courses = await http.get(uri);
        if (courses.data.length > 0) {
            this.all = courses.data.map((course) => {
                course = new Course(course, course.startDate, course.endDate);
                course.locked = true;
                course.subjectLabel = structure.subjects.mapping[course.subjectId];
                course.teachers = _.map(course.teacherIds,
                    (ids) => { return _.findWhere(structure.teachers.all, {id: ids});
                    });
                return course;
            });
            this.origin = Mix.castArrayAs(Course, courses.data);
        }
        return;
    }

    getFilterTeacher = (table) => {
        let filter  ='';
        let name = 'teacherId=';
        for(let i=0; i<table.length; i++){
            filter +=  `${name}${table[i].id}`;
            if(i !== table.length-1)
                filter+='&';
        }
        return filter
    };

    getFilterGroup = (table) => {
        let filter  ='';
        let name = 'group=';
        for(let i=0; i<table.length; i++){
            if(table[i]){
            filter +=  `${name}${table[i].name}`;
            if(i !== table.length-1)
                filter+='&';
            }
        }
        return filter
    };
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
                occurrence.teacherIds = _.pluck(course.teachers, 'id');
                occurrence.groups = course.groups;
                occurrence.startDate = Utils.getOccurrenceStartDate(course.startDate, course.courseOccurrences[i].startTime, occurrence.dayOfWeek);
                occurrence.endDate = Utils.getOccurrenceEndDate(course.endDate, course.courseOccurrences[i].endTime, occurrence.dayOfWeek);
                occurrence.manual = true;
                occurrence.everyTwoWeek = course.everyTwoWeek;
                courses.push(Utils.cleanCourseForSave(occurrence));
            }
            await http.post('/edt/course', courses);
            return;
        } catch (e) {
            notify.error('edt.notify.create.err');
            console.error(e);
            throw e;
        }
    }

    async update (courses: Course[]): Promise<void> {
        try {
            await http.put('/edt/course', courses);
            return;
        } catch (e) {
            notify.error('edt.notify.update.err');
        }
    }
}
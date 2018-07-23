import { model, moment, _, notify, Behaviours } from 'entcore';
import http from 'axios';
import { Mix } from 'entcore-toolkit';
import {CourseOccurrence, Group, Teacher, Utils} from './index';
import {Structure} from "./structure";



export class Course {
    _id: string;
    classes: string[] = [];
    groups: string[] | Group [] = [];
    teachers: Teacher [] = [];
    subjectLabel : string = '' ;

    dayOfWeek: number = null;
    endDate:string | object = undefined;
    startDate: string | object = undefined;

    everyTwoWeek:boolean = undefined;
    structureId: string = undefined;
    teacherIds: string[]= [];
    subjectId: string = '';
    roomLabels: string[] = [];
    courseOccurrences : CourseOccurrence[] = [];
    created: string = '';
    modified: string = '';

    is_recurrent:boolean = undefined;
    canDelete:boolean;

    constructor (obj?: object) {
        if (obj && obj instanceof Object) {
            for (let key in obj) {
                this[key] = obj[key];
            }
            this.is_recurrent = this.isRecurrent();
        }
    }

    async save () {
        if (this._id) await this.update();
        else await this.create();

    }
    async update () {
        try {
            await http.put('/edt/course', [this.toJSON()]);
            return;
        } catch (e) {
            notify.error('edt.notify.update.err');
        }
    }
    async create () {
        try {
            await http.post('/edt/course', [this.toJSON()]);
            return;
        } catch (e) {
            notify.error('edt.notify.create.err');
            console.error(e);
            throw e;
        }
    }
    async sync (id, structure?: Structure) {
        try {
           let  { data } =  await http.get(`/viescolaire/common/course/${id}`);
           Mix.extend(this, Mix.castAs(Course, new Course(data)));
           this.canDelete = this.canIDeleteCourse();
           if(structure) this.mapWithStructure(structure);

        } catch (e) {
            notify.error('edt.notify.sync.err');
        }
    }
    async mapWithStructure  (structure : Structure) {
        this.teachers = _.map(this.teacherIds,(id) => {
            let teacher = _.findWhere(structure.teachers.all, {id: id});
            if(teacher) return teacher;
        });
        this.groups = _.map( _.union(this.groups, this.classes), (groupName) => {
            if( typeof(groupName) === 'string'){
              let group = _.findWhere(structure.groups.all, {name: groupName});
              if(group) return group;
            }
        });
    };
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
            teacherIds: _.pluck(this.teachers, 'id' ),
            classes : _.pluck(_.where(this.groups, {type_groupe: Utils.getClassGroupTypeMap()['CLASS']}), 'name'),
            groups : _.pluck(_.where(this.groups, {type_groupe: Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP']}), 'name'),
            endDate: moment( this.endDate).format('YYYY-MM-DDTHH:mm:ss'),
            roomLabels: this.roomLabels,
            dayOfWeek: this.is_recurrent ?parseInt(this.dayOfWeek.toString()) : parseInt(moment(this.startDate).day()),
            manual: true,
            everyTwoWeek: this.everyTwoWeek
        };
       if( this.is_recurrent )
            o.startDate =   moment(this.startDate).add('days', this.dayOfWeek - moment(this.startDate).day());
        o.startDate = moment(this.startDate).format('YYYY-MM-DDTHH:mm:ss');
        if (this._id) {
            o._id = this._id;
        }
        return o;
    }
    getCourseForEachOccurrence ():Courses {
        let courses = new Courses();
        for(let i = 0; i < this.courseOccurrences.length ; i++){
           let newCourse= _.clone(this).syncCourseWithOccurrence(this.courseOccurrences[i]);
            if (i!==0)
                delete newCourse._id;
            courses.all.push(newCourse.toJSON());
        }
        return courses
    }
    syncCourseWithOccurrence (occurrence: CourseOccurrence) :Course {
        this.dayOfWeek = this.is_recurrent ? occurrence.dayOfWeek : moment(this.startDate).day();
        this.roomLabels = occurrence.roomLabels;
        this.startDate = moment(occurrence.startTime);
        this.endDate = moment(occurrence.endTime);
        return this;
    }
    isRecurrent (): boolean {
        return moment(this.endDate).diff(moment(this.startDate), 'days') != 0;
    }
    canIDeleteCourse () :boolean {
        let now = moment();
        return (!this.isRecurrent() && moment(this.startDate).isAfter( now ))
            ||  (this.isRecurrent() && moment( this.endDate).isAfter(now) )
    };
}

export class Courses {
    all: Course[];

    constructor () {
        this.all = [];
    }
    /**
     * Create course with occurrences
     * @returns {Promise<void>}
     */
    async create (courses: Course[]): Promise<void> {
        try {
            await http.post('/edt/course', courses);
            return;
        } catch (e) {
            notify.error('edt.notify.create.err');
            console.error(e);
            throw e;
        }
    }
    async save() {
        let courseGroupById = _.groupBy(this.all, function(course){ return !!course._id; });
        if(courseGroupById['true'])
           await this.update(courseGroupById.true);
        if(courseGroupById['false'])
           await this.create(courseGroupById.false);
        return;
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
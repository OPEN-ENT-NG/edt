import { model, moment, _, notify, Behaviours } from 'entcore';
import http from 'axios';
import { Mix } from 'entcore-toolkit';
import {CourseOccurrence, Group, Teacher, Utils} from './index';
import {Structure} from "./structure";
import {Moment} from "moment";



export class Course {
    _id: string;
    classes: string[] = [];
    groups: string[] | Group [] = [];
    teachers: Teacher [] = [];
    subjectLabel : string = '' ;

    dayOfWeek: number = null;
    endDate:string | object ;
    startDate: string | object;

    everyTwoWeek:boolean = undefined;
    structureId: string = undefined;
    teacherIds: string[]= [];
    subjectId: string = '';
    roomLabels: string[] = [];
    courseOccurrences : CourseOccurrence[] = [];
    created: string = '';
    modified: string = '';

    is_recurrent:boolean = undefined;
    canManage:boolean;

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
    async update (occurrenceDate?) {
        try {
            let url = occurrenceDate ? `/edt/occurrence/${moment(occurrenceDate).format('x')}` : '/edt/course';
            await http.put(url, [this.toJSON()]);
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
           this.canManage = this.canIManageCourse();
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
    async delete (occurrenceDate?) {
        try {
            let url = occurrenceDate ? `/edt/occurrence/${moment(occurrenceDate).format('x')}/${this._id}` : `/edt/course/${this._id}`;
            await http.delete(url);
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
            roomLabels: this.roomLabels,
            dayOfWeek: this.is_recurrent ?parseInt(this.dayOfWeek.toString()) : parseInt(moment(this.startDate).day()),
            manual: true,
            everyTwoWeek: this.everyTwoWeek
        };
       if( this.is_recurrent ){
            o.startDate = moment(this.startDate).add('days', this.dayOfWeek - moment(this.startDate).day());
           o.endDate = moment(this.endDate).day( this.dayOfWeek );
           o.startDate = moment(o.startDate).format('YYYY-MM-DDTHH:mm:ss');
           o.endDate= moment( o.endDate).format('YYYY-MM-DDTHH:mm:ss');
       }else{
           let date =moment(this.startDate).format('YYYY-MM-DD');
           o.startDate  = moment(date +'T'+ moment(this.startDate).format('HH:mm:ss')) ;
           o.endDate =moment(date +'T'+ moment(this.endDate).format('HH:mm:ss')) ;
       }
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
    canIManageCourse () :boolean {
        let now = moment();
        return (!this.isRecurrent() && moment(this.startDate).isAfter( now ))
            ||  (this.isRecurrent() &&
               moment(this.getLastOccurrence().startTime).isAfter(now) )
    };
    isInFuture () :boolean {
        let now = moment();
        return !this.isRecurrent() && moment(this.startDate).isAfter( now )
            ||  (this.isRecurrent() && now.isBefore(moment(this.startDate).day(this.dayOfWeek)) )

    };

    /**
     * get next occurrence date from à Moment
     * @param {moment.Moment} date
     * @returns {string}
     */

    getNextOccurrenceDate (date: Moment|string) :string {
       let momentDate = moment(date);
       let occurrence = moment( _.clone(momentDate));
       occurrence.day(this.dayOfWeek);
       if( momentDate.isAfter(occurrence)  ) {
           occurrence.add('days',this.everyTwoWeek? 14 : 7);
       }
       return occurrence.format('YYYY-MM-DD');
    }
    getLastOccurrence() :CourseOccurrence{
        let date = moment( this.endDate).day(this.dayOfWeek);
        if(date.isAfter(moment(this.endDate)))
            date = moment( this.endDate).subtract({days : 7}).day(this.dayOfWeek);
        return new CourseOccurrence(
            this.dayOfWeek,
            '',
          moment(date.format('YYYY-MM-DD') + 'T' + moment(this.startDate).format('HH:mm:ss')).toDate(),
          moment( this.endDate).toDate()
        )
    }
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
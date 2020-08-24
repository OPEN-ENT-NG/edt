import { model } from 'entcore';
import { Courses, Subjects, Groups, Teachers, Students, USER_TYPES , Exclusions} from './index';
import { Eventer } from 'entcore-toolkit';
import {CalendarItems} from "./calendarItems";
import {PeriodeAnnee} from "./periodeAnnee";


export class Structure {
    id: string;
    name: string;
    id_structure: string;
    courses: Courses;
    calendarItems: CalendarItems;
    subjects: Subjects;
    groups: Groups;
    teachers: Teachers;
    students: Students;
    eventer: Eventer = new Eventer();
    exclusions: Exclusions;
    periodeAnnee: PeriodeAnnee;

    /**
     * Structure constructor. Can take an id and a name in parameter
     * @param id structure id
     * @param name structure name
     */
    constructor (id?: string, name?: string, id_structure?: string) {
        if (typeof id === 'string') { this.id = id; }
        if (typeof name === 'string') { this.name = name; }
        if (id_structure) this.id_structure = id_structure;
        this.subjects = new Subjects();
        this.groups = new Groups();
        this.courses = new Courses();
        this.calendarItems = new CalendarItems();
        this.teachers = new Teachers();
        this.exclusions =  new Exclusions();
        if (model.me.type === USER_TYPES.relative) {
            this.students = new Students();
        }
        this.periodeAnnee = new PeriodeAnnee();
    }

    /**
     * Synchronize structure information. Groups and Subjects need to be synchronized to start courses
     * synchronization.
     * @returns {Promise<T>|Promise}
     */
    async sync(isTeacher?: boolean): Promise<void> {
        const promises: Promise<void>[] = [];
        promises.push(this.subjects.sync(this.id));
        promises.push(this.groups.sync(this.id,(isTeacher )? isTeacher : false));
        promises.push(this.teachers.sync(this));
        promises.push(this.exclusions.sync(this.id));
        if (model.me.type === USER_TYPES.relative) {
            promises.push(this.students.sync());
        }
        promises.push(this.periodeAnnee.sync(this.id));
        await Promise.all(promises);
    }
}

export class Structures {
    all: Structure[];

    constructor (arr?: Structure[]) {
        this.all = [];
        if (arr instanceof Structure) { this.all = arr; }
    }

    sync() {
        for (let i = 0; i < model.me.structures.length; i++) {
            this.all.push(new Structure(model.me.structures[i], model.me.structureNames[i]));
        }
        return;
    }

    /**
     * Returns first structure occurrence in the class
     * @returns {Structure} first structure contained in 'all' array
     */
    first (): Structure {
        if(model.me.idMainStructure){
           return this.all.find(s => s.id == model.me.idMainStructure)
        }
        return this.all[0];
    }
}
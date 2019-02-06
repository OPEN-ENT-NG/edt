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
    sync (): Promise<any> {
        return new Promise((resolve, reject) => {
            let syncedCollections = {
                subjects: false,
                groups: false,
                teachers: false,
                students: model.me.type !== USER_TYPES.relative,
                exclusions: false,
                periodeAnnee: false
            };

            let endSync = () => {
                let _b: boolean = syncedCollections.subjects
                && syncedCollections.groups
                && syncedCollections.teachers
                && syncedCollections.students
                && syncedCollections.exclusions
                && syncedCollections.periodeAnnee;
                if (_b) {
                    resolve();
                    this.eventer.trigger('refresh');
                }
            };

            this.subjects.sync(this.id).then(() => { syncedCollections.subjects = true; endSync(); });
            this.groups.sync(this.id).then(() => { syncedCollections.groups = true; endSync(); });
            this.teachers.sync(this).then(() => { syncedCollections.teachers = true; endSync(); });
            this.exclusions.sync(this.id).then(() => { syncedCollections.exclusions = true; endSync(); });
            if (model.me.type === USER_TYPES.relative) {
                this.students.sync().then(() => { syncedCollections.students = true; endSync(); });
            }
            this.periodeAnnee.sync(this.id).then(() => { syncedCollections.periodeAnnee = true; endSync(); });
        });
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
        return this.all[0];
    }
}
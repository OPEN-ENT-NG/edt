import { model } from 'entcore/entcore';
import { Courses } from './course';
import { Subjects } from './subject';
import { Groups } from './group';
import { Teachers } from './teacher';
import { USER_TYPES } from './user-types';
import { Eventer } from 'entcore-toolkit';

export class Structure {
    id: string;
    name: string;
    courses: Courses;
    subjects: Subjects;
    groups: Groups;
    teachers: Teachers;
    eventer: Eventer = new Eventer();

    /**
     * Structure contructor. Can take an id and a name in parameter
     * @param id structure id
     * @param name structure name
     */
    constructor (id?: string, name?: string) {
        if (typeof id === 'string') { this.id = id; }
        if (typeof name === 'string') { this.name = name; }
        this.subjects = new Subjects();
        this.groups = new Groups();
        this.courses = new Courses();
        if (model.me.type === USER_TYPES.personnel) {
            this.teachers = new Teachers();
        }
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
                teachers: model.me.type !== USER_TYPES.personnel
            };

            let endSync = () => {
                let _b: boolean = syncedCollections.subjects
                && syncedCollections.groups
                && (model.me.type === USER_TYPES.personnel) ? syncedCollections.teachers : true;
                if (_b) {
                    resolve();
                    this.eventer.trigger('refresh');
                }
            };

            this.subjects.sync(this.id).then(() => { syncedCollections.subjects = true; endSync(); });
            this.groups.sync(this.id).then(() => { syncedCollections.groups = true; endSync(); });
            if (model.me.type === USER_TYPES.personnel) {
                this.teachers.sync(this).then(() => { syncedCollections.teachers = true; endSync(); });
            }
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
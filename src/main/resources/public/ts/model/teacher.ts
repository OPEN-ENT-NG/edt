import { Structure } from './structure';
import { Mix } from 'entcore-toolkit';
import http from 'axios';

export class Teacher {
    id: string;
    displayName: string;
    externalId: string;
    firstName: string;
    lastName: string;

    constructor (o?: any) {
        if (o && typeof o === 'object') {
            for (let key in o) {
                this[key] = o[key];
            }
        }
    }

    toString () {
        return this.displayName;
    }
}

export class Teachers {
    all: Teacher[];

    constructor () {
        this.all = [];
    }

    /**
     * Synchronize structure teachers
     * @param structure structure
     * @returns {Promise<void>}
     */
    async sync (structure: Structure) {
        try {
            let teachers = await http.get('/viescolaire/evaluations/user/list?profile=Teacher&structureId=' + structure.id);
            this.all = Mix.castArrayAs(Teacher, teachers.data);
        } catch (e) {
            throw e;
        }
    }
}
import { model } from 'entcore/entcore';
import { Courses } from './course';
import { Subjects } from './subject';
import { Groups } from './group';

export class Structure {
    id: string;
    name: string;
    courses: Courses;
    subjects: Subjects;
    groups: Groups;

    constructor (id?: string, name?: string) {
        if (typeof id === 'string') { this.id = id; }
        if (typeof name === 'string') { this.name = name; }
        this.subjects = new Subjects();
        this.groups = new Groups();
        this.courses = new Courses();
    }

    async sync () {
        try {
            await this.subjects.sync(this.id);
            await this.groups.sync(this.id);
            await this.courses.sync(this);
            return;
        } catch (e) {
            throw e;
        }
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

    first (): Structure {
        return this.all[0];
    }
}
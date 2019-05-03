import { model } from 'entcore';
import http from 'axios';
import { Mix } from 'entcore-toolkit';

export class Student {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    classes: string[];
    idClasses : string[];
    structures: string[];

    constructor (obj: any) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }
}

export class Students {
    all: Student[];

    constructor () {
        this.all = [];
    }

    async sync (): Promise<void> {
        let children = await http.get('/edt/user/children');
        this.all = Mix.castArrayAs(Student, children.data);
        return;
    }
}
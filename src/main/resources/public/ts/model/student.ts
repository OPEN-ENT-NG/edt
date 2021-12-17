import http, {AxiosResponse} from 'axios';
import { Mix } from 'entcore-toolkit';
import {Structure} from "./structure";

export class Student {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    classes: Array<string>;
    idClasses: Array<string>;
    structures: Array<Structure>;

    constructor (obj: any) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }
}

export class Students {
    all: Array<Student>;

    constructor () {
        this.all = [];
    }

    async sync (): Promise<void> {
        let children: AxiosResponse = await http.get('/edt/user/children');
        this.all = Mix.castArrayAs(Student, children.data);
        return;
    }
}
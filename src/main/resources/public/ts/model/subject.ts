import http from 'axios';
import { notify } from 'entcore/entcore';

export class Subject {
    id: string;
    name: string;

    constructor (id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

export class Subjects {
    all: Subject[];
    mapping: any;

    constructor () {
        this.all = [];
        this.mapping = {};
    }

    async sync (structureId: string): Promise<void> {
        if (typeof structureId !== 'string') { return; }
        try {
            let subjects = await http.get('/viescolaire/matieres?idEtablissement=' + structureId);
            subjects.data.forEach((subject) => {
                this.all.push(new Subject(subject.id, subject.name));
                this.mapping[subject.id] = subject.name;
            });
            return;
        } catch (e) {
            notify.error('app.notify.e500');
        }
    }
}
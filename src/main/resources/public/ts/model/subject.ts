import { model } from 'entcore/entcore';
import http from 'axios';
import { notify } from 'entcore/entcore';

export class Subject {
    subjectId: string;
    subjectLabel: string;
    subjectCode: string;
    teacherId: string;

    constructor (subjectId: string, subjectLabel: string, subjectCode: string, teacherId: string) {
        this.subjectId = subjectId;
        this.subjectLabel = subjectLabel;
        this.subjectCode = subjectCode;
        this.teacherId = teacherId;
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
            let subjects = await http.get('/directory/timetable/subjects/' + structureId + '?teacherId=' + model.me.userId);
            subjects.data.forEach((subject) => {
                this.all.push(new Subject(subject.subjectId, subject.subjectLabel, subject.subjectCode, subject.teacherId));
                this.mapping[subject.subjectId] = subject.subjectLabel;
            });
            return;
        } catch (e) {
            notify.error('app.notify.e500');
        }
    }
}
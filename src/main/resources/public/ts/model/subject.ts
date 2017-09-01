import { model, notify } from 'entcore';
import http from 'axios';
import { USER_TYPES } from "./user-types";

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

    /**
     * Synchronize subjects provides by the structure
     * @param structureId structure id
     * @returns {Promise<void>}
     */
    async sync (structureId: string): Promise<void> {
        if (typeof structureId !== 'string') { return; }
        try {
            let url = `/directory/timetable/subjects/${structureId}`;
            if (model.me.type === USER_TYPES.teacher) { url += `?teacherId=${model.me.userId}`; }
            let subjects = await http.get(url);
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
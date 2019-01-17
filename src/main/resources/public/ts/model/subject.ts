import { model, notify, _ } from 'entcore';
import http from 'axios';
import { USER_TYPES } from "./user-types";

export class Subject {
    subjectId: string;
    subjectLabel: string;
    subjectCode: string;
    teacherId: string;
    isDefault? : boolean;
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
    async sync (structureId: string, teacherIds?: Array<string> ): Promise<void> {
        if (typeof structureId !== 'string') { return; }
        try {
            let url = `/directory/timetable/subjects/${structureId}`;
            if(teacherIds) url += `?${this.getFilterTeacher(teacherIds)}`;
            let subjects = await http.get(url);
            this.all = [];
            subjects.data.forEach((subject) => {
                this.all.push(new Subject(subject.subjectId, subject.subjectLabel, subject.subjectCode, subject.teacherId));
                this.mapping[subject.subjectId] = subject.subjectLabel;
            });
            return;
        } catch (e) {
            notify.error('app.notify.e500');
        }
    }
    getFilterTeacher = (ids) => {
        let filter  ='';
        let name = 'teacherId=';
        for(let i=0; i<ids.length; i++){
            filter +=  `${name}${ids[i]}`;
            if(i !== ids.length-1)
                filter+='&';
        }
        return filter
    };
}
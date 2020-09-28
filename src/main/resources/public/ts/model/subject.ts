import { notify } from 'entcore';
import http, {AxiosResponse} from 'axios';

export class ISubject {
    code?: string;
    externalId?: string;
    id?: string;
    name?: string;
    rank?: number;
}

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
     * @param teacherIds Optional. List of teachers identifiers.
     * @returns {Promise<void>}
     */
    sync = async (structureId: string, teacherIds?: Array<string> ): Promise<void> => {
        if (typeof structureId !== 'string' || structureId === 'all_Structures') { return; }
        try {
            let url : string = `/directory/timetable/subjects/${structureId}`;
            if(teacherIds) url += `?${this.getFilterTeacher(teacherIds)}`;
            let subjects : AxiosResponse = await http.get(url);
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

    getFilterTeacher = (ids : string[]) : string => {
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
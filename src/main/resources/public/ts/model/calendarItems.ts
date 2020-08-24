import {_, idiom as lang, model, moment} from 'entcore';
import http, {AxiosPromise, AxiosResponse} from 'axios';
import {Course, Group, Structure, Teacher, USER_TYPES, Utils} from './index';
import {Structures} from './structure';
import {DateUtils} from '../utils/date';
import {DATE_FORMAT} from '../core/constants/dateFormat';

export class CalendarItem {

    startDate: string | object;
    beginning: any
    startMoment: any;
    startMomentDate: string;
    startMomentTime: string;
    startCalendarHour: Date;
    originalStartMoment?: any;
    startCourse: string | Date;

    endDate: string | object;
    endCalendarHour: Date;
    endMoment: any;
    endMomentDate: string;
    endMomentTime: string;
    originalEndMoment?: any;
    endCourse: string | Date;
    end: any;

    course: Course;

    is_periodic: boolean;
    locked: boolean;
    color: string;


    constructor(obj: object, startDate?: string | object, endDate?: string | object) {
        let course = new Course();
        if (obj instanceof Object) {
            for (let key in obj) {
                this[key] = obj[key];
                // course.hasOwnProperty(key) || key == '_id' ? course[key] = obj[key] : this[key] = obj[key];
            }
        }
        this.course = new Course(this);
        this.course.endDate = this.endCourse;
        this.course.startDate = this.startCourse;
        this.locked = true;

        if (startDate) {
            this.startMoment = moment(startDate);
            this.startCalendarHour = this.startMoment.seconds(0).millisecond(0).toDate();
            this.startMomentDate = this.startMoment.format('DD/MM/YYYY');
            this.startMomentTime = this.startMoment.format('HH:mm');
        }

        if (endDate) {
            this.endMoment = moment(endDate);
            this.endCalendarHour = this.endMoment.seconds(0).millisecond(0).toDate();
            this.endMomentDate = this.endMoment.format('DD/MM/YYYY');
            this.endMomentTime = this.endMoment.format('HH:mm');
        }
    }

}

export class CalendarItems {
    all: CalendarItem[];

    constructor() {
        this.all = [];
    }

    /**
     * Get groups from class
     * @param {Array<Group>} group cannot be null
     * @param deletedGroup   groups which are deleted from the filter
     * @returns {Promise<void>}
     */
    getGroups = async ( group: Array<Group> = [] , deletedGroup : any) : Promise<void> => {
        if(group.length <=0) return ;
        let filter : string = this.getFilterClass(group);
        if (filter === "") return;
        let uri : string = `/viescolaire/group/from/class?${filter}`;
        let {data} : AxiosResponse = await http.get(uri);

        if (data.length > 0) {
            this.all = data.map((item) => {
                if(item.name_groups.length > 0){
                    item.name_groups.map((groupName, index) => {
                        let isAlreadyInGroups = false;

                        group.map( g => {
                            if(g && g.name === groupName){
                                isAlreadyInGroups = true;
                            }
                        });

                        if (!isAlreadyInGroups) {
                            let grip = new Group(item.id_groups[index],groupName,"");
                            group.push(grip);
                        }
                    })
                }
            });
        }
    }

    /**
     * Synchronize courses.
     * @param structure structure
     * @param teacher teacher. Can be null. If null, group needs to be provided.
     * @param group group. Can be null. If null, teacher needs to be provided.
     * @param structures
     * @param isAllStructure True if multiple structures.
     * @returns {Promise<void>} Returns a promise.
     */
    async sync(structure: Structure, teacher: Array<Teacher> = [], group: Array<Group> = [], structures: Structures, isAllStructure: boolean): Promise<void> {
        let firstDate: string = DateUtils.format(Utils.getFirstCalendarDay(), DATE_FORMAT["YEAR-MONTH-DAY"]);
        let endDate: string =  DateUtils.format(Utils.getLastCalendarDay(), DATE_FORMAT["YEAR-MONTH-DAY"]);
        if (!structure || teacher.length <= 0 && group.length <= 0 || !firstDate || !endDate) return;
        let filter: string = '';
        if (teacher.length > 0)
            filter += (model.me.type === USER_TYPES.teacher && teacher.length === 0) ? 'teacherId=' + model.me.userId : this.getFilterTeacher(teacher) + '&';
        if (group.length > 0)
            filter += this.getFilterGroup(group);
        filter += '&union=true';

        if (isAllStructure) {

            if (filter) {

                let datas : any[] = [];
                let coursePromises : Array<AxiosPromise> = [];
                let structurePromises : Array<Promise<any>> = [];

                structures.all.map(async (structure : Structure) => {
                    if (structure.id !== lang.translate("all.structures.id")) {
                        coursePromises.push(http.get(`/viescolaire/common/courses/${structure.id}/${firstDate}/${endDate}?${filter}`));
                        structurePromises.push(structure.sync());
                    }
                });

                const [courseResponse, ]: Array<AxiosResponse[]> | Array<Promise<any>> = await Promise.all([
                    Promise.all(coursePromises),
                    Promise.all(structurePromises)
                ]);

                courseResponse.forEach((response : AxiosResponse) => {
                    datas = datas.concat(response.data);
                });

                this.all = datas.map((item : any) => {
                    item = new CalendarItem(item, item.startDate, item.endDate);
                    if (item.exceptionnal && item.course.subjectId === lang.translate("exceptionnal.id")) {
                        item.course.subjectLabel = item.exceptionnal;

                    } else {
                        item.course.subjectLabel = structure.subjects.mapping[item.course.subjectId];
                    }
                    item.course.teachers = _.map(item.course.teacherIds, (ids) => _.findWhere(structure.teachers.all, {id: ids}));
                    structures.all.map((struc : Structure) => {
                        if (struc.id !== lang.translate("all.structures.id")) {
                            if (item.exceptionnal && item.course.subjectId === lang.translate("exceptionnal.id")) {
                                item.course.subjectLabel = item.exceptionnal;
                            } else {
                                if (struc.subjects.mapping[item.course.subjectId]) {
                                    item.course.subjectLabel = struc.subjects.mapping[item.course.subjectId];
                                }
                            }
                        }
                    });
                    return item;
                })
            }
        } else if (filter) {
            let uri : string = `/viescolaire/common/courses/${structure.id}/${firstDate}/${endDate}?${filter}`;
            let {data} : AxiosResponse = await http.get(uri);
            if (data.length > 0) {
                this.all = data.map((item : any) => {
                    item = new CalendarItem(item, item.startDate, item.endDate);
                    if (item.exceptionnal && item.course.subjectId === lang.translate("exceptionnal.id")) {
                        item.course.subjectLabel = item.exceptionnal;

                    } else {
                        item.course.subjectLabel = structure.subjects.mapping[item.course.subjectId];
                    }
                    item.course.teachers = _.map(item.course.teacherIds, (ids : string[]) => _.findWhere(structure.teachers.all, {id: ids}));
                    return item;
                });
            }
        }
        return;
    };

    async syncOccurrences(structureId, firstDate, endDate): Promise<void> {
        let start = moment(firstDate).format('YYYY-MM-DD');
        let end = moment(endDate).format('YYYY-MM-DD');
        let uri = `/viescolaire/common/courses/${structureId}/${start}/${end}`;
        let {data} = await http.get(uri);
        this.all = data;
        return;
    }

    /**
     * Returns the URI parameters for the provided teacher array
     * @param teachers teacher array
     */
    getFilterTeacher = (teachers : Teacher[]) : string => {
        let filter : string = '';
        let name : string = 'teacherId=';
        for (let i = 0; i < teachers.length; i++) {
            filter += `${name}${teachers[i].id}`;
            if (i !== teachers.length - 1)
                filter += '&';
        }
        return filter;
    };

    /**
     * Returns the URI parameters for the provided group array
     * @param groups group array
     */
    getFilterGroup = (groups : Group[]) : string => {
        let filter : string = '';
        let name : string = 'group=';
        for (let i = 0; i < groups.length; i++) {
            if (groups[i]) {

                if(!(model.me.type === USER_TYPES.student && (model.me.groupsIds.indexOf(groups[i].id) === -1 && groups[i].type_groupe !== 0))) {
                    filter += `${name}${groups[i].name}`;
                    if (i !== groups.length - 1) {
                        filter += '&';
                    }
                }
            }
        }
        return filter;
    };

    /**
     * Returns the URI parameters for the provided class array
     * @param classes class array
     */
    getFilterClass = (classes : Group[]) : string => {
        let filter : string = '';
        let name : string = 'classes=';
        for (let i = 0; i < classes.length; i++) {
            if (classes[i] && classes[i].type_groupe === 0) {
                filter += `${name}${classes[i].id}`;

                if (i !== classes.length - 1) {
                    filter += '&';
                }
            }
        }
        return filter;
    };
}

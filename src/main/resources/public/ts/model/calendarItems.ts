import {_, idiom as lang, model, moment} from 'entcore';
import http, {AxiosPromise, AxiosResponse} from 'axios';
import {Course, Group, ICourse, Structure, Teacher, USER_TYPES, Utils} from './index';
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
    exceptionnal: string;
    classes: Array<string>;
    groups: Array<string>;


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
    getGroups = async (group: Array<Group> = [], deletedGroup: any, studentId?: string): Promise<void> => {
        if (group.length <= 0) return;
        let filter: string = this.getFilterClass(group);
        if (filter === "") return;
        let uri: string = `/viescolaire/group/from/class?${filter}`;

        if (studentId) {
            uri += `&student=${studentId}`;
        }

        let {data}: AxiosResponse = await http.get(uri);

        if (data.length > 0) {
            this.all = data.map((item) => {
                if (item.name_groups.length > 0) {
                    item.name_groups.map((groupName, index) => {
                        let isAGroupOfANewClass = false;
                        let isAlreadyInGroups = false;

                        group.map(g => {
                            if (g && g.name === groupName) {
                                isAlreadyInGroups = true;
                            }
                        });

                        if (deletedGroup != null) {
                            deletedGroup.classes.map(c => {
                                if (c && item.id_classe === c.id) {
                                    isAGroupOfANewClass = true;
                                }
                            });
                        }

                        if (!isAGroupOfANewClass && deletedGroup != null) {
                            deletedGroup.groupsDeleted.map((gg, index) => {
                                if (gg.name === groupName) {
                                    deletedGroup.groupsDeleted.splice(index, 1);
                                }
                            });
                        }


                        if (!isAlreadyInGroups) {
                            let grip = new Group(item.id_groups[index], groupName, "");
                            group.push(grip);
                        }
                    })
                }
            }).filter(data => data !== undefined);
        }
    }

    /**
     * Synchronize courses.
     * @param structure structure
     * @param teachers teacher. Can be null. If null, group needs to be provided.
     * @param groups group. Can be null. If null, teacher needs to be provided.
     * @param structures
     * @param isAllStructure True if multiple structures.
     * @returns {Promise<void>} Returns a promise.
     */
    async sync(structure: Structure, teachers: Array<Teacher> = [], groups: Array<Group> = [], structures: Structures,
               isAllStructure: boolean): Promise<void> {

        let filterGroups: Array<Group> = groups.filter((group: Group): boolean => !(model.me.type === USER_TYPES.student &&
            model.me.type === USER_TYPES.relative &&
            (model.me.groupsIds.indexOf(group.id) === -1 && group.type_groupe !== 0)));

        let filter: ICourse = {
            teacherIds: teachers.map((teacher: Teacher): string => teacher.id),
            groupIds: filterGroups.map((group: Group): string => group.id),
            groupExternalIds: filterGroups.map((group: Group): string => group.externalId),
            groupNames: filterGroups.map((group: Group): string => group.name),
            union: true
        };

        let firstDate: string = DateUtils.format(Utils.getFirstCalendarDay(), DATE_FORMAT["YEAR-MONTH-DAY"]);
        let endDate: string = DateUtils.format(Utils.getLastCalendarDay(), DATE_FORMAT["YEAR-MONTH-DAY"]);
        if (!structure || teachers.length <= 0 && groups.length <= 0 || !firstDate || !endDate) return;

        if (isAllStructure) {
            let datas: Array<any> = [];
            let coursePromises: Array<AxiosPromise> = [];
            let structurePromises: Array<Promise<any>> = [];

            structures.all.map(async (structure: Structure): Promise<void> => {
                if (structure.id !== lang.translate("all.structures.id")) {
                    coursePromises.push(http.post(`/edt/structures/${structure.id}/common/courses/${firstDate}/${endDate}`, filter));
                    structurePromises.push(structure.sync());
                }
            });

            const [courseResponse, ]: Array<Array<AxiosResponse>> | Array<Promise<any>> = await Promise.all([
                Promise.all(coursePromises),
                Promise.all(structurePromises)
            ]);

            courseResponse.forEach((response: AxiosResponse): void => {
                datas = datas.concat(response.data);
            });

            this.all = datas.map((item: CalendarItem): CalendarItem => {
                item = new CalendarItem(item, item.startDate, item.endDate);
                if (item.exceptionnal && item.course.subjectId === lang.translate("exceptionnal.id")) {
                    item.course.subjectLabel = item.exceptionnal;

                } else {
                    item.course.subjectLabel = item.course.subject.name;
                }

                item.course.teachers = item.course.teacherIds.map((teacherId: string): Teacher  => {
                     return structure.teachers.all.find((teacher: Teacher): boolean => teacher.id === teacherId);
                });

                structures.all.map((struc: Structure): void => {
                    if (struc.id !== lang.translate("all.structures.id")) {
                        item.course.subjectLabel = item.exceptionnal ? item.exceptionnal : item.course.subject.name;
                    }
                });
                return item;
            });
        } else {
            let uri: string = `/edt/structures/${structure.id}/common/courses/${firstDate}/${endDate}`;
            let {data}: AxiosResponse = await http.post(uri, filter);
            if (data.length > 0) {
                this.all = data.map((item: CalendarItem): CalendarItem => {
                    item = new CalendarItem(item, item.startDate, item.endDate);
                    item.course.subjectLabel = item.exceptionnal ? item.exceptionnal : item.course.subject.name;
                    item.course.teachers = item.course.teacherIds.map((teacherId: string): Teacher  => {
                        return structure.teachers.all.find((teacher: Teacher): boolean => teacher.id === teacherId);
                    });
                    return item;
                });
            }
        }

        this.sortByClassesAndGroups();

        if (teachers.length > 1) {
            this.sortByTeachers();
        }

        return;
    }

    sortByClassesAndGroups = (): void => {
        this.all.sort((c1: CalendarItem, c2: CalendarItem): number => {
            let primaryAudience = (audience: CalendarItem): string => {
                return (audience.classes && audience.classes.length > 0) ? audience.classes[0] :
                    (audience.groups && audience.groups.length > 0) ? audience.groups[0] : ""; };

            if (c1.startMomentDate === c2.startMomentDate
                && c1.startMomentTime === c2.startMomentTime) {

                return (primaryAudience(c1) < primaryAudience(c2)) ? -1 :
                    (primaryAudience(c1) > primaryAudience(c2)) ? 1 : 0;
            }
            return 0;
        });
    }

    sortByTeachers = (): void => {
        this.all.sort((c1: CalendarItem, c2: CalendarItem): number => {
            if (c1.startMomentDate === c2.startMomentDate
                && c1.startMomentTime === c2.startMomentTime
                && c1.course && c2.course
                && c1.course.teachers && c1.course.teachers.length > 0
                && c2.course.teachers && c2.course.teachers.length > 0) {

                return (c1.course.teachers[0].displayName < c2.course.teachers[0].displayName) ? -1 :
                    (c1.course.teachers[0].displayName > c2.course.teachers[0].displayName) ? 1 : 0;
            }
            return 0;
        });
    }



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
    getFilterTeacher = (teachers: Teacher[]): string => {
        let filter: string = '';
        let name: string = 'teacherId=';
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
    getFilterGroup = (groups: Group[]): string => {
        groups.filter((group: Group) => !(model.me.type === USER_TYPES.student &&
            model.me.type === USER_TYPES.relative &&
            (model.me.groupsIds.indexOf(group.id) === -1 && group.type_groupe !== 0)))

        let filter: string = '';
        let name: string = 'group=';
        for (let i = 0; i < groups.length; i++) {
            if (groups[i]) {
                if (!(model.me.type === USER_TYPES.student && model.me.type === USER_TYPES.relative &&
                    (model.me.groupsIds.indexOf(groups[i].id) === -1 && groups[i].type_groupe !== 0))) {
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
    getFilterClass = (classes: Group[]): string => {
        let filter: string = '';
        let name: string = 'classes=';
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

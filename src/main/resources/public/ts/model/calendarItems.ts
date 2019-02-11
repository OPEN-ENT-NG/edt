import { _, model, moment} from 'entcore';
import http from 'axios';
import { USER_TYPES, Structure, Teacher, Group, Utils, Course} from './index';

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
                course.hasOwnProperty(key) || key == '_id' ? course[key] = obj[key] : this[key] = obj[key];
            }
        }
        this.course = new Course(course);
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
     * @returns {Promise<void>}
     */
    async getGroups( group: Array<Group> = []){
        if(group.length <=0) return ;
        let filter = "";
        filter += this.getFilterClass(group);
        let uri = `/viescolaire/group/from/class?${filter}`;
        let {data} = await http.get(uri);

        if (data.length > 0) {
            this.all = data.map((item) => {
                if(item.name_groupes.length > 0){
                   item.name_groupes.map((groupName)=>{
                      let grip =new Group("",groupName,"");
                      group.push(grip);
                   })
                }
            });
        }
    }

    /**
     * Synchronize courses.
     * @param structure structure
     * @param teacher teacher. Can be null. If null, group need to be provide.
     * @param group group. Can be null. If null, teacher needs to be provide.
     * @returns {Promise<void>} Returns a promise.
     */
    async sync(structure: Structure, teacher: Array<Teacher> = [], group: Array<Group> = []): Promise<void> {
        let firstDate = Utils.getFirstCalendarDay();
        firstDate = moment(firstDate).format('YYYY-MM-DD');
        let endDate = Utils.getLastCalendarDay();
        endDate = moment(endDate).format('YYYY-MM-DD');
        if (!structure || (teacher.length <= 0 && model.me.type !== USER_TYPES.teacher) && group.length <= 0 || !firstDate || !endDate) return;
        let filter = '';
        if (teacher.length > 0)
            filter += (model.me.type === USER_TYPES.teacher && teacher.length === 0) ? 'teacherId=' + model.me.userId : this.getFilterTeacher(teacher) + '&';
        if (group.length > 0)

            filter += this.getFilterGroup(group);

        let uri = `/viescolaire/common/courses/${structure.id}/${firstDate}/${endDate}?${filter}`;
        let {data} = await http.get(uri);
        if (data.length > 0) {
            this.all = data.map((item) => {
                item = new CalendarItem(item, item.startDate, item.endDate);
                item.course.subjectLabel = structure.subjects.mapping[item.course.subjectId];
                item.course.teachers = _.map(item.course.teacherIds, (ids) => _.findWhere(structure.teachers.all, {id: ids}));
                return item;
            });
        }
        return;
    }

    async syncOccurrences(structureId, firstDate, endDate): Promise<void> {
        let start = moment(firstDate).format('YYYY-MM-DD');
        let end = moment(endDate).format('YYYY-MM-DD');
        let uri = `/viescolaire/common/courses/${structureId}/${start}/${end}`;
        let {data} = await http.get(uri);
        this.all = data;
        return;
    }

    getFilterTeacher = (table) => {
        let filter = '';
        let name = 'teacherId=';
        for (let i = 0; i < table.length; i++) {
            filter += `${name}${table[i].id}`;
            if (i !== table.length - 1)
                filter += '&';
        }
        return filter
    };

    getFilterGroup = (table) => {
        let filter = '';
        let name = 'group=';
        for (let i = 0; i < table.length; i++) {
            if (table[i]) {
                filter += `${name}${table[i].name}`;
                if (i !== table.length - 1)
                    filter += '&';
            }
        }
        return filter
    };

    getFilterClass = (table) => {
        let filter = '';
        let name = 'classes=';
        for (let i = 0; i < table.length; i++) {
            if (table[i]) {
               filter += `${name}${table[i].id}`;

                if (i !== table.length - 1)
                    filter += '&';
            }
        }
        return filter
    };
}
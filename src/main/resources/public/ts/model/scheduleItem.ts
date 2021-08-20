import {ISubject} from "./subject";
import {Course} from "./course";
import {Moment} from "moment";
import {CalendarItem} from "./calendarItems";

export type ScheduleItem = {
    _id: string,
    beginning: Moment,
    calendarGutter: number,
    classes: Array<string>,
    classesExternalIds: Array<string>,
    color: string,
    course: Course,
    data: CalendarItem,
    dayOfWeek: number,
    end: Moment,
    endCalendarHour: Date,
    endCourse: string,
    endDate: string,
    endMoment: Moment,
    endMomentDate: string,
    endMomentTime: string,
    groups: Array<string>,
    groupsExternalIds: Array<string>,
    is_periodic: boolean,
    lastUser: string,
    locked: true,
    manual: boolean,
    roomLabels: Array<string>,
    startCalendarHour: Date,
    startCourse: string,
    startDate: string,
    startMoment: Moment,
    startMomentDate: string,
    startMomentTime: string,
    structureId: string,
    subject: ISubject,
    subjectId: string,
    teacherIds: Array<string>,
    theoretical: boolean,
    updated: string
};
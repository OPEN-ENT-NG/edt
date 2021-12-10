import { moment } from 'entcore';
import {Course} from "./course";

export class CourseOccurrence {
    dayOfWeek: any;
    startTime: Date;
    endTime: Date;
    roomLabels: Array<string>;
    tagId: number;

    constructor (dayOfWeek: number = 1, roomLabel: string = '', startTime?: Date, endTime?: Date, tagId?: number) {
        this.dayOfWeek = dayOfWeek;
        this.roomLabels = [roomLabel];
        let start = moment();
        start = start.add((15 - (start.minute() % 15)), "minutes");
        if (!startTime) {
            let d = start.seconds(0).milliseconds(0).format('x');
            this.startTime = new Date();
            this.startTime.setTime(d);
        } else this.startTime = startTime;
        if (!endTime) {
            let d = start.seconds(0).milliseconds(0).add(1, 'hours').format('x');
            this.endTime = new Date();
            this.endTime.setTime(d);
        } else {
            this.endTime = endTime;
        }
        if (tagId) {
            this.tagId = tagId;
        }
    }

    /**
     * Format start time
     * @returns {string} Returns start time string
     */
    getFormattedStartTime(): string {
        return moment(this.startTime).format('HH:mm');
    }

    /**
     * Format end time
     * @returns {string} Returns end time string
     */
    getFormattedEndTime(): string {
        return moment(this.endTime).format('HH:mm');
    }

    isValidTime(course: Course, display: {
        showQuarterHours: boolean, checkbox: boolean, freeSchedule: boolean }): boolean {
        if (!display.freeSchedule && !course.timeSlot.start) {
            return false;
        } else {
            let isTimeSlot: boolean = !display.freeSchedule && course.timeSlot.start && course.timeSlot.end;
            let startTime: string = isTimeSlot && course.timeSlot.start ? course.timeSlot.start.startHour : moment(this.startTime).format("HH:mm:ss");
            let endTime: string = isTimeSlot && course.timeSlot.end ? course.timeSlot.end.endHour : moment(this.endTime).format("HH:mm:ss");
            let date: string = moment().format("YYYY-MM-DD");
            return moment(date + 'T' + endTime).isAfter(moment(date + 'T' + startTime).add(14, "minutes"));
        }
    }

    isNotPastTime() : boolean{
       return  moment(this.startTime).isAfter(moment().add(1,'second'))

    }

    toJSON(): object {
        return {
            dayOfWeek: parseInt(this.dayOfWeek),
            roomLabels: this.roomLabels,
        };
    }
}
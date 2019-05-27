import { moment } from 'entcore';

export class CourseOccurrence {
    dayOfWeek: any;
    startTime: Date;
    endTime: Date;
    roomLabels: string[];

    constructor (dayOfWeek: number = 1, roomLabel: string = '', startTime?: Date, endTime?: Date) {
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
        } else this.endTime = endTime;
    }

    /**
     * Format start time
     * @returns {string} Returns start time string
     */
    getFormattedStartTime (): string {
        return moment(this.startTime).format('HH:mm');
    }

    /**
     * Format end time
     * @returns {string} Returns end time string
     */
    getFormattedEndTime (): string {
        return  moment(this.endTime).format('HH:mm');
    }
    isValidTime (course, display): boolean  {
        if (!display.freeSchedule && course.timeSlot.start === undefined) {
            return false;
        }
        else {
            let isTimeSlot = course.timeSlot.start !== undefined;
            let startTime = isTimeSlot ? course.timeSlot.start.startHour : moment(this.startTime).format("HH:mm:ss");
            let endTime = isTimeSlot ? course.timeSlot.end.endHour : moment(this.endTime).format("HH:mm:ss");
            let date =  moment().format("YYYY-MM-DD");
            return moment(date+'T'+endTime).isAfter(moment(date+'T'+startTime).add(14,"minutes"))
        }
    };

    toJSON (): object {
        return {
            dayOfWeek: parseInt(this.dayOfWeek),
            roomLabels: this.roomLabels,
        };
    }
}
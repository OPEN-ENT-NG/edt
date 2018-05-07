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
     * Format time for user reading
     * @param {Date} time time to format
     * @returns {string} returns string time as 'HH:mm'
     */
    private static getFormattedTime (time: Date): string {
        return moment(time).format('HH:mm');
    }

    /**
     * Format start time
     * @returns {string} Returns start time string
     */
    getFormattedStartTime (): string {
        return CourseOccurrence.getFormattedTime(this.startTime);
    }

    /**
     * Format end time
     * @returns {string} Returns end time string
     */
    getFormattedEndTime (): string {
        return CourseOccurrence.getFormattedTime(this.endTime);
    }

    toJSON (): object {
        return {
            dayOfWeek: parseInt(this.dayOfWeek),
            roomLabels: this.roomLabels,
        };
    }
}
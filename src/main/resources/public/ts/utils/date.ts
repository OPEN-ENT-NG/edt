import {moment} from 'entcore';
import {DATE_FORMAT} from "../core/constants/dateFormat";
import {DurationInputArg1, DurationInputArg2} from "moment";

export class DateUtils {

    static START_DAY_TIME = "00:00:00";
    static END_DAY_TIME = "23:59:59";
    static QUARTER_HOUR_MINUTES = "15";

    /**
     * Format date based on given format using moment
     * @param date date to format
     * @param format format
     */
    static format(date: any, format: string) {
        return moment(date).format(format);
    }

    /**
     * Method that will format date with 'YYYY-MM-DD HH:mm:ss' format
     * @param date to format
     * @return 'YYYY-MM-DD HH:mm:ss' format date
     */
    static getDateFormat(date: string): string {
        // if date is in timezone (will use UTC format)
        if (date.includes('Z')) {
            return moment(date).utc().format(DATE_FORMAT["YEAR-MONTH-DAY-HOUR-MIN-SEC"]);
        } else {
            return moment(date).format(DATE_FORMAT["YEAR-MONTH-DAY-HOUR-MIN-SEC"]);
        }
    }

    /**
     * Add step to given date.
     * @param date      Date format
     * @param dateTime  Time format
     */
    static getDateTimeFormat(date: Date, dateTime: Date): string {
        return moment(moment(date)
            .format('YYYY-MM-DD') + ' ' + moment(dateTime)
            .format('HH:mm'), 'YYYY-MM-DD HH:mm')
            .format('YYYY-MM-DD HH:mm:ss');
    }

    static isValid(date: any, format: string): boolean {
        return (moment(date, format, true).isValid());
    }

    static isPeriodValid(startAt: String, endAt: String): boolean {
        return this.isValid(startAt, DATE_FORMAT["YEAR-MONTH-DAY-HOUR-MIN-SEC"])
            && this.isValid(endAt, DATE_FORMAT["YEAR-MONTH-DAY-HOUR-MIN-SEC"])
            && moment(startAt).isBefore(moment(endAt));
    }

    /**
     * ⚠ This method format your TIME but your DATE will have your date.now() ⚠
     * @param time  time value as a string (e.g) "09:00"
     */
    static getTimeFormatDate(time: string): Date {
        return moment().set('HOUR', time.split(":")[0]).set('MINUTE', time.split(":")[1]).toDate();
    }

    /**
     * Add step to given date.
     * @param date Date to update
     * @param step Step size
     * @param stepType Optional. Step type.
     */
    static add(date: any, step: DurationInputArg1, stepType: DurationInputArg2 = 'd'): Date {
        return moment(date).add(step, stepType).toDate();
    }
}
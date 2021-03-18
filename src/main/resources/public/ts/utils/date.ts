import {moment} from 'entcore';
import {DATE_FORMAT} from "../core/constants/dateFormat";

export class DateUtils {

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
}
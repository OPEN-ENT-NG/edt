import {moment} from 'entcore';

export class DateUtils {

    /**
     * Format date based on given format using moment
     * @param date date to format
     * @param format format
     */
    static format(date: any, format: string) {
        return moment(date).format(format);
    }

    static FORMAT = {
        'HOUR-MINUTES': 'kk:mm', // e.g "09:00"
    };
}
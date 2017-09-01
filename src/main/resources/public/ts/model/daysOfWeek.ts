import { idiom as lang } from 'entcore';

export const DAYS_OF_WEEK = {
    days: {
        1: 'edt.utils.day.1',
        2: 'edt.utils.day.2',
        3: 'edt.utils.day.3',
        4: 'edt.utils.day.4',
        5: 'edt.utils.day.5',
        6: 'edt.utils.day.6',
        7: 'edt.utils.day.7',
    },
    get: function (dayNumber: any) {
        return lang.translate(this.days[parseInt(dayNumber)]);
    }
};
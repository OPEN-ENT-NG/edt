import { moment, model, me, Behaviours } from 'entcore';
import { Course, Structure } from './index';

export class Utils {

    /**
     * Returns values based on value in parameter.
     * @param {any[]} values values values containing objects
     * @param {string} valueName valueName
     * @returns {string[]} tring array containg names
     */
    static getValues (values: any[], valueName: string): string[] {
        let list: string[] = [];
        for (let i = 0; i < values.length; i++) {
            list.push(values[i][valueName]);
        }
        return list;
    }

    /**
     * Returns a map containing class and functional groups type ids
     * @returns {Object} map
     */
    static getClassGroupTypeMap (): object {
        return {
            CLASS: 0,
            FUNCTIONAL_GROUP: 1,
        }
    }

    /**
     * Get format occurrence date based on a date, a time and a day of week
     * @param {string | Date} date date
     * @param {Date} time time
     * @param {number} dayOfWeek day of week
     * @returns {any} a moment object
     */
    static getOccurrenceDate(date: string | object, time: Date, dayOfWeek: number): any {
        let occurrenceDate = moment(date),
        occurrenceDay: number = parseInt(occurrenceDate.day());
        if (occurrenceDay !== dayOfWeek) {
            let nextDay: number = occurrenceDay > dayOfWeek ?
                dayOfWeek + 7 - occurrenceDay :
                dayOfWeek - occurrenceDay;
            occurrenceDate.add('days', nextDay);
        }
        occurrenceDate.set('hours', time.getHours());
        occurrenceDate.set('minutes', time.getMinutes());
        return occurrenceDate;
    }

    static getOccurrenceStartDate(date: string | object, time: Date, dayOfWeek: number): string {
        return this.getOccurrenceDate(date, time, dayOfWeek).format('YYYY-MM-DDTHH:mm:ss');
    }

    static getOccurrenceEndDate(date: string | object, time: Date, dayOfWeek: number): string {
        let occurrenceEndDate = this.getOccurrenceDate(date, time, dayOfWeek);
        if (moment(date).diff(occurrenceEndDate) < 0) {
            occurrenceEndDate.add('days', -7);
        }
        return occurrenceEndDate.format('YYYY-MM-DDTHH:mm:ss');
    }

    static getOccurrenceDateForOverview(date: string | object, time: Date, dayOfWeek: number): string {
        let overviewDate = this.getOccurrenceDate(date, time, dayOfWeek);
        if (dayOfWeek < moment().day()) {
            overviewDate.add('days', -7);
        }
        return overviewDate.format('YYYY-MM-DDTHH:mm:ss');
    }

    /**
     * Format courses to display them in the calendar directive
     * @param courses courses
     * @param structure structure
     * @returns {Array} Returns an array containing Course object.
     */
    static formatCourses (courses: any[], structure: Structure): Course[] {
        const arr = [];
        const edtRights = Behaviours.applicationsBehaviours.edt.rights;
        courses.forEach((course) => {
            let numberWeek = Math.floor(moment(course.endDate).diff(course.startDate, 'days') / 7);
            if (!model.me.hasWorkflow(edtRights.workflow.create)) course.locked = true;
            if (numberWeek > 0) {
                let startMoment = moment(course.startDate);
                let endMoment = moment(course.endDate).add(moment(course.startDate).diff(course.endDate, 'days'), 'days');
                for (let i = 0; i < numberWeek; i++) {
                    let c = new Course(course, startMoment.format(), endMoment.format());
                    c.subjectLabel = structure.subjects.mapping[course.subjectId];
                    arr.push(c);
                    startMoment = startMoment.add('days', 7);
                    endMoment = endMoment.add('days', 7);
                }
            } else {
                let c = new Course(course, moment(course.startDate).format(), moment(course.endDate).format());
                c.subjectLabel = structure.subjects.mapping[course.subjectId];
                arr.push(c);
            }
        });
        return arr;
    }
}
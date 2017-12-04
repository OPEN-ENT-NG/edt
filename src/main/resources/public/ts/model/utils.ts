import { moment, model, me, Behaviours, _ } from 'entcore';
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
        };
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
                // let endMoment = moment(course.endDate).add(moment(course.startDate).diff(course.endDate, 'days'), 'days');
                let endMoment = moment(course.startDate);
                endMoment.hour(moment(course.endDate).hour()).minute(moment(course.endDate).minute());
                for (let i = 0; i < numberWeek + 1; i++) {
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

    /**
     * Return if start date is less greater than end date.
     * @param startDate start date
     * @param endDate end date
     * @returns {boolean}
     */
    static isLessGreaterThan (startDate: any, endDate: any): boolean {
        return moment(endDate).diff(moment(startDate)) > 0;
    }

    /**
     * Return if start date is much greater then end date
     * @param startDate start date
     * @param endDate end date
     * @returns {boolean}
     */
    static isMuchGreaterThan (startDate: any, endDate: any): boolean {
        return moment(endDate).diff(moment(startDate)) < 0;
    }

    /**
     * Returns if the specified day is in the period provide in parameter
     * @param {number} dayOfWeek day of week
     * @param startPeriod period start date
     * @param endPeriod period end date
     * @returns {boolean}
     */
    static hasOneOrMoreOccurrenceDayInPeriod (dayOfWeek: number, startPeriod: any, endPeriod: any): boolean {
        let bool = true;
        let periodDayNumber = Math.abs(moment(endPeriod).diff(moment(startPeriod), 'days'));
        let numberOfWeek = periodDayNumber % 7;
        if (numberOfWeek === 0) {
            bool = dayOfWeek >= moment(startPeriod).day()
                && dayOfWeek <= moment(endPeriod).day();
        }
        return bool;
    }

    static cleanCourseForSave (course: Course): any {
        let _c = Course.prototype.toJSON.call(course);
        _c.classes = Utils.getValues(_.where(course.groups, { type_groupe: Utils.getClassGroupTypeMap()['CLASS']}), 'name');
        _c.groups = Utils.getValues(_.where(course.groups, { type_groupe: Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP']}), 'name');
        _c.dayOfWeek = moment(course.startMoment).day();
        _c.startDate = course.startMoment ? course.startMoment.format('YYYY-MM-DDTHH:mm:ss') : course.startDate;
        _c.endDate = course.endMoment ? course.endMoment.format('YYYY-MM-DDTHH:mm:ss') : course.endDate;
        delete _c['$$haskey'];
        return _c;
    }

    /**
     * Return date based on previous date and previous date day of week and also greater than middleDate
     * @param previousDate previous date
     * @returns {any} next date
     */
    static getNextCourseDay (previousDate: any, multiplier: number = 1): any {
        previousDate.add(7 * multiplier, 'days');
        return previousDate;
    }

    static equalsDate (firstDate: any, secondDate: any): boolean {
        return moment(firstDate).diff(moment(secondDate), 'minutes') === 0;
    }

    /**
     * Split original course in multiple courses to update new occurrence.
     * @param {Course} originalCourse Original course
     * @param {Course} newOccurrence New occurrence
     * @returns {Course[]} New courses array to update
     */
    static splitCourseForUpdate (newOccurrence: Course, originalCourse: Course): Course[] {
        let courseToSave = [];
        if (this.equalsDate(newOccurrence.originalStartMoment, originalCourse.startMoment)) {
            courseToSave.push(this.cleanCourseForSave(newOccurrence));
            let _c = new Course(originalCourse, this.getNextCourseDay(originalCourse.startMoment), originalCourse.endMoment);
            courseToSave.push(this.cleanCourseForSave(_c));
        } else if (this.equalsDate(newOccurrence.originalEndMoment, originalCourse.endMoment)) {
            let _c = new Course(originalCourse, originalCourse.startMoment, this.getNextCourseDay(originalCourse.endMoment, -1));
            courseToSave.push(this.cleanCourseForSave(_c));
            courseToSave.push(this.cleanCourseForSave(newOccurrence));
        } else {
            let _start = new Course(originalCourse, originalCourse.startMoment, this.getNextCourseDay(newOccurrence.originalEndMoment, -1));
            courseToSave.push(this.cleanCourseForSave(_start));
            courseToSave.push(this.cleanCourseForSave(newOccurrence));
            let _end = new Course(originalCourse, this.getNextCourseDay(newOccurrence.originalStartMoment), originalCourse.endMoment);
            delete _end._id;
            courseToSave.push(this.cleanCourseForSave(_end));
        }
        return courseToSave;
    }
}
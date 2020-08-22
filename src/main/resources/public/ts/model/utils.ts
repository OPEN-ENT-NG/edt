import {model, moment} from 'entcore';

export class Utils {

    /**
     * Add the fields succeed and toastMessage to the response
     * @param response
     * @param message
     * @param errorMessage
     * @returns {any}
     */
    static setToastMessage(response, message, errorMessage){
        if(response.status === 200 || response.status === 201){
            response.succeed = true;
            response.toastMessage = message;

        } else {
            response.succeed = false;
            response.toastMessage = errorMessage;
        }
        return response;
    }

    /**
     * Returns a map containing class and functional groups type ids
     * @returns {Object} map
     */
    static getClassGroupTypeMap (): object {
        return {
            CLASS: 0,
            FUNCTIONAL_GROUP: 1,
            MANUAL_GROUP: 2
        };
    }

    /**
     * Verify if th the start date is before or equal to; the end date.
     * @param start
     * @param end
     * @returns {boolean}
     */
    static isValidDate (start , end ) : boolean {
        if (start[2] == "/") { //hack to demo
            start = start[6] + start[7] + start[8] + start[9] + "-" + start[3] + start[4] + "-" + start[0] + start[1];
        }
        if (end[2] == "/") {
            end = end[6] + end[7] + end[8] + end[9] + "-" + end[3] + end[4] + "-" + end[0] + end[1];
        }
        return moment(start).diff(moment(end)) < 0;
    };

    /**
     * Refresh the view
     * @param $scope
     * @returns {any}
     */
    static safeApply($scope: any, fn?): any {
        const phase = $scope.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof (fn) === 'function')) {
                fn();
            }
        } else {
            $scope.$apply(fn);
        }
    };

    static getFirstCalendarDay () :any {
        return model.calendar.firstDay;
    }

    static getLastCalendarDay () :any {
        return moment(model.calendar.firstDay).add(1, model.calendar.increment+'s');
    }

    static isCourseInExclusions(course, exclusions): boolean {
        if(!exclusions || !exclusions.length){
            return false;
        }
        for (let i = 0, imax = exclusions.length; i < imax; i++) {
            let exclusion = exclusions[i];
            if (!course.is_recurrent) {
                if(this.occurrenceInExclusionsDay(course, exclusion) == true){
                    return true;
                }
            }
            else {
                let courses = course.getCourseForEachOccurrence();
                for (let j = 0, jmax = courses.all.length; j < jmax; j++) {
                    let course = courses.all[j];
                    if (this.occurrenceInExclusionsDay(course, exclusion) == true) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    static isOccurrenceInExclusions(occurrence, exclusions): boolean {
        if (!exclusions || !exclusions.length) {
            return false;
        }
        for (let i = 0, imax = exclusions.length; i < imax; i++) {
            let exclusion = exclusions[i];
            if (this.occurrenceInExclusionsDay(occurrence, exclusion) == true) {
                return true;
            }
        }
        return false;
    }

    /**
     * Return true if course is on one exclusion day
     * @param course
     * @param exclusion
     * @returns {boolean}
     */
    static occurrenceInExclusionsDay(occurrence, exclusion): boolean {
        let exclusionStart = moment(exclusion.start_date),
            exclusionEnd = moment(exclusion.end_date),
            occurrenceStart = moment(occurrence.startDate),
            occurrenceEnd = moment(occurrence.endDate),
            exclusionOneDayOnly = exclusionStart.format("DD-MM-YYYY") == exclusionEnd.format("DD-MM-YYYY");
        if (exclusionOneDayOnly && exclusionStart.day() != occurrenceStart.day()) {
            return false;
        }
        if (occurrenceStart.isAfter(exclusionEnd)) {
            return false;
        }
        if (occurrenceEnd.isBefore(exclusionStart)) {
            return false;
        }
        return true;
    };

    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
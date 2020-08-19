import { moment, model, Behaviours, _ } from 'entcore';
import {Course} from "./index";
import {Mix} from "entcore-toolkit";

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
    static safeApply($scope: any): any {
        if ( $scope.$root ) {
            let phase = $scope.$root.$$phase ;
            if ( phase !== '$apply' && phase !== '$digest') {
                $scope.$apply();
            }
        } else {
            setTimeout(()=>{Utils.safeApply($scope); }, 2000);
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
                    if(this.occurrenceInExclusionsDay(course, exclusion) == true){
                        return true;
                    }
                }
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
    static occurrenceInExclusionsDay (occurrence, exclusion): boolean {
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
}
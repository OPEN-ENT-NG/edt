import { moment, model, me, Behaviours, _ } from 'entcore';

export class Utils {

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
     * Verify if th the start date is before or equal to; the end date.
     * @param start
     * @param end
     * @returns {boolean}
     */
    static isValidDate (start , end ) : boolean {
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

    static getFirstCalendarDay () :moment {
        return model.calendar.firstDay;
    }

    static getLastCalendarDay () :moment {
        return moment(model.calendar.firstDay).add(1, model.calendar.increment+'s');
    }
}
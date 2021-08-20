import {_, angular, Behaviours, model, moment, toasts} from 'entcore';
import {Course, Utils} from '../model';
import {TimeSlot} from '../model/timeSlots';
import {Moment} from 'moment';
import {CalendarAttributes} from '../model/calendarAttributes';
import {DATE_FORMAT} from "../core/constants/dateFormat";
import {DateUtils} from "./date";

export class DragAndDrop {
    static init = (init: boolean, $scope, $location): void => {
        if (init) {
            $scope.pageInitialized = true;
            $scope.params.oldGroup = angular.copy($scope.params.group);
            $scope.params.oldUser = angular.copy($scope.params.user);
            model.calendar.setDate(moment());
        }
        model.calendar.eventer.off('calendar.create-item');
        model.calendar.eventer.on('calendar.create-item', () => {
            if ($location.path() !== '/create') {
                $scope.createCourse();
                $scope.hideTimeSlot = true;
            }
        });


        Utils.safeApply($scope);

        // --Start -- Calendar Drag and Drop

        function getDayOfWeek() {
            let dayOfWeek = 0;
            switch (model.calendar.days.all[0].name) {
                case "monday":
                    dayOfWeek = 1;
                    break;
                case "tuesday":
                    dayOfWeek = 2;

                    break;
                case "wednesday":
                    dayOfWeek = 3;

                    break;
                case "thursday":
                    dayOfWeek = 4;

                    break;
                case "friday":
                    dayOfWeek = 5;

                    break;
                case "saturday":
                    dayOfWeek = 6;

                    break;
                default:
                    dayOfWeek = 7;
                    break;

            }
            return dayOfWeek;
        }

        if (model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.manage)) {
            let $dragging = null;
            let topPositionnement = 0;
            let startPosition = {top: null, left: null};
            let $timeslots = $('calendar .timeslot');
            $timeslots.removeClass('selecting-timeslot');
            let initVar = () => {
                $dragging = null;
                topPositionnement = 0;
                $timeslots.removeClass('selecting-timeslot');
                $('calendar .selected-timeslot').remove();
            };

            $timeslots
                .mousemove((e) => topPositionnement = DragAndDrop.drag(e, $dragging))
                .mouseenter((e) => topPositionnement = DragAndDrop.drag(e, $dragging));

            let $body: JQuery = $('body');
            var mousemoveCalendarHr = (e) => topPositionnement = DragAndDrop.drag(e, $dragging);
            $body.off('mousemove', 'calendar hr', mousemoveCalendarHr);
            $body.on('mousemove', 'calendar hr', mousemoveCalendarHr);

            const mouseupCalendar = (e: JQueryEventObject): void => {
                if (e.which === 3) {
                    return;
                }
                if ($dragging) {
                    let courseItem: any;
                    $('.timeslot').removeClass('selecting-timeslot');
                    if (model.calendar.increment === 'day') {
                        courseItem = DragAndDrop.drop(e, $dragging, startPosition, getDayOfWeek());
                    } else {
                        courseItem = DragAndDrop.drop(e, $dragging, startPosition);
                    }
                    if (courseItem) {
                        $scope.chooseTypeEdit(courseItem.itemId, courseItem.start, courseItem.end, true);
                    }
                    initVar();
                }
            };
            $body.off('mouseup', 'calendar', mouseupCalendar);
            $body.on('mouseup', 'calendar', mouseupCalendar);

            var mousedownCalendarScheduleItem = (e) => {
                if (e.which === 3) {
                    return;
                }
                if ($(e.target).hasClass("notpast") || $(e.target).hasClass("inside-schedule")) {
                    $dragging = DragAndDrop.takeSchedule(e, $timeslots);
                    startPosition = $dragging.offset();
                    let calendar = $('calendar');
                    calendar.off('mousemove', (e) => DragAndDrop.moveScheduleItem(e, $dragging));
                    calendar.on('mousemove', (e) => DragAndDrop.moveScheduleItem(e, $dragging));
                } else {
                    return;
                }
            };

            $body.off('mousedown', 'calendar .schedule-item', mousedownCalendarScheduleItem);
            $body.on('mousedown', 'calendar .schedule-item', mousedownCalendarScheduleItem);
            $('body calendar .schedule-item').css('cursor', 'move');


            var mouseDownEditIcon = (e) => {

                if (e.which === 1) {//check left click
                    e.stopPropagation();
                    $scope.chooseTypeEdit($(e.currentTarget).data('id'), moment(e.target.children[0].innerHTML), moment(e.target.children[1].innerHTML));
                    $(e.currentTarget).unbind('mousedown');
                }
            };

            const prepareToDelete = (event: JQueryEventObject): void => {
                let start: Moment = moment(event.currentTarget.children[0]
                                    .children[1].children[0].children[0].innerHTML);

                if (event.which === 3 && !$(event.currentTarget).hasClass("selected")
                    && start.clone().add(- DateUtils.QUARTER_HOUR_MINUTES, "minutes").isAfter(moment())) {
                    event.stopPropagation();
                    let itemId: string = $(event.currentTarget).data("id");
                    $(event.currentTarget).addClass("selected");
                    let courseToDelete: Course = _.findWhere(_.pluck($scope.structure.calendarItems.all, 'course'),
                        {_id: itemId});

                    $scope.editOccurrence = true;
                    (!courseToDelete.timeToDelete) ? courseToDelete.timeToDelete = [] : courseToDelete.timeToDelete;

                    courseToDelete.timeToDelete.push(moment(start).format(DATE_FORMAT["YEAR-MONTH-DAY"]));

                    $scope.params.coursesToDelete.push(courseToDelete);
                    $scope.params.coursesToDelete = $scope.params.coursesToDelete.sort()
                        .filter((el: Course, i: number, a: Array<Course>): boolean => {
                            return i === a.indexOf(el);
                    });

                } else if (event.which === 3 && !$(event.currentTarget).hasClass("selected")
                    && start.clone().add(-DateUtils.QUARTER_HOUR_MINUTES, "minutes").isBefore(moment()) && $scope.chronoEnd) {
                        event.stopPropagation();
                        $scope.chronoEnd = false;
                        setTimeout(((): void => {
                            $scope.chronoEnd = true;
                        }), 100);
                        toasts.info(start.isBefore(moment()) ? "edt.cantDelete.courses" : "edt.cantDelete.courses.before");
                }

                Utils.safeApply($scope);
            };


            var cancelDelete = (event) => {
                let start = moment(event.currentTarget.children[0].children[1].children[0].children[0].innerHTML);

                if (event.which == 3 && $(event.currentTarget).hasClass("selected")) {
                    event.stopPropagation();
                    $(event.currentTarget).removeClass("selected");
                    let idToDelete = $(event.currentTarget).data("id")
                    $scope.params.coursesToDelete.map((course, i) => {
                        if (course._id === idToDelete) {
                            let currentCourse = $scope.params.coursesToDelete[i];
                            if (currentCourse.timeToDelete.length > 1) {
                                currentCourse.timeToDelete.map((t, ii) => {
                                    if (moment(start).format("YYYY/MM/DD") === t) {
                                        $scope.params.coursesToDelete[i].timeToDelete.splice(ii, 1);
                                    }
                                })

                            } else {
                                $scope.params.coursesToDelete[i].timeToDelete = [];
                                $scope.params.coursesToDelete.splice(i, 1);
                            }
                        }
                    })

                }
                if (event.which == 3 && $(event.currentTarget).hasClass("cantDelete")) {
                    event.stopPropagation();
                    $(event.currentTarget).removeClass("cantDelete");
                }
                Utils.safeApply($scope);

            }

            //left click on icon
            $body.off('mousedown', '.one.cell.edit-icone', mouseDownEditIcon);
            $body.on('mousedown', '.one.cell.edit-icone', mouseDownEditIcon);
            $body.on('mousedown', '.schedule-item-content', prepareToDelete);
            $body.on('mousedown', '.schedule-item-content.selected', cancelDelete);
            $body.on('mousedown', '.schedule-item-content.cantDelete', cancelDelete);
        }
        // --End -- Calendar Drag and Drop
    };

    static moveScheduleItem = (e,dragging) => {
        if(dragging){
            let positionScheduleItem = {
                top: e.pageY - dragging.height()/2,
                left: e.pageX - dragging.width()/2
            };
            dragging.offset(positionScheduleItem);
        }
    };

    static drag = (e,dragging,  ) => {
        let topPositionnement=0;
        if(dragging){
            $('calendar .selected-timeslot').remove();
            let curr = $(e.currentTarget);
            let currDivHr = curr.children('hr');
            let notFound = true;
            let i:number = 0;
            let prev = curr;
            let next  ;
            while ( notFound && i < currDivHr.length  ){
                next = $(currDivHr)[i];
                if(!($(prev).offset().top <= e.pageY && e.pageY > $(next).offset().top  ))
                    notFound = false;
                prev = next;
                i++
            }
            let top = Math.floor(dragging.height()/2);
            for(let z= 0; z <= 5 ; z++){
                if ( ((top + z) % 10) === 0 )
                {
                    top = top + z;
                    break;
                }
                else if(((top - z) % 10) === 0){
                    top = top - z;
                    break;
                }
            }
            topPositionnement = DragAndDrop.getTopPositioning(dragging);
            if($(prev).prop("tagName") === 'HR' &&  notFound === false ) {
                $(prev).before(`<div class="selected-timeslot" style="height: ${dragging.height()}px; top:-20px;"></div>`);
            }else if( i >= currDivHr.length && notFound === true ){
                $(next).after(`<div class="selected-timeslot" style="height: ${dragging.height()}px; top:-20px;"></div>`);
            }else{
                $(prev).append(`<div class="selected-timeslot"  style="height: ${dragging.height()}px; top:-20px;"></div>`);
            }
        }
        return topPositionnement;
    };

    static getTopPositioning = (dragging) => {
        let top = Math.floor(dragging.height()/2);
        for(let z= 0; z <= 5 ; z++){
            if ( ((top + z) % 10) === 0 )
            {
                top = top + z;
                break;
            }
            else if(((top - z) % 10) === 0){
                top = top - z;
                break;
            }
        }
        return top;
    };

    static takeSchedule = (e, timeslots) => {
        timeslots.addClass( 'selecting-timeslot' );
        $(document).mousedown((e) => {return false;});
        return $(e.currentTarget);
    };

    static getCalendarAttributes = (selectedTimeslot: JQuery, selectedSchedule: JQuery,
                                    dayOfWeek?: number): CalendarAttributes => {
        if (selectedTimeslot && selectedTimeslot.length > 0 && selectedSchedule && selectedSchedule.length > 0) {
            let dayOfweek: number = dayOfWeek ? dayOfWeek : $(selectedTimeslot).parents('div.day').index();
            let timeslot: TimeSlot = model.calendar.timeSlots.all[$(selectedTimeslot).parents('.timeslot').index()];
            let startCourse: Moment = moment($(selectedTimeslot).parents('.timeslot').index());
            startCourse = startCourse.year(moment(model.calendar.firstDay).format('YYYY'))
                .date(moment(model.calendar.firstDay).date())
                .month(moment(model.calendar.firstDay).month())
                .hour(timeslot.start)
                .minute(timeslot.startMinutes)
                .second(0)
                .day(dayOfweek);

            let endCourse: Moment = moment(startCourse).add(selectedSchedule.height() * 3 / 2, 'minutes');

            return {
                itemId : $($(selectedSchedule).find('.schedule-item-content')).data('id'),
                start: startCourse,
                end: endCourse
            };
        }
    }

    static drop = (e: JQueryEventObject, dragging: JQuery, startPosition: JQueryCoordinates,
                   dayOfWeek?: number): CalendarAttributes => {
        let actualPosition: JQueryCoordinates = dragging.offset();
        if (actualPosition && startPosition.top === actualPosition.top && startPosition.left === actualPosition.left) {
            return undefined;
        }
        let selected_timeslot: JQuery = $('calendar .selected-timeslot');
        let positionShadowSchedule: JQueryCoordinates = selected_timeslot.offset();
        let courseEdit: CalendarAttributes = DragAndDrop.getCalendarAttributes(selected_timeslot, dragging , dayOfWeek);
        dragging.offset(positionShadowSchedule);
        selected_timeslot.remove();
        $(document).unbind('mousedown');
        return courseEdit;
    }
}
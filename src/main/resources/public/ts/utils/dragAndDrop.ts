import {_, angular, Behaviours, model, moment, toasts} from 'entcore';
import {Course, Utils} from '../model';
import {TimeSlot} from '../model/timeSlots';
import {Moment} from 'moment';
import {CalendarAttributes} from '../model/calendarAttributes';
import {DATE_FORMAT} from "../core/constants/dateFormat";
import {DateUtils} from "./date";
import {KEY_EVENTS, MOUSE_EVENTS} from "../core/constants/mouseKeyEvents";

export class DragAndDrop {
    static init = (init: boolean, $scope, $location): void => {
        if (init) {
            $scope.pageInitialized = true;
            $scope.params.oldGroup = angular.copy($scope.params.group);
            $scope.params.oldUser = angular.copy($scope.params.user);
            model.calendar.setDate(moment());
        }
        model.calendar.eventer.off('calendar.create-item');
        model.calendar.eventer.on('calendar.create-item', (): void => {
            if ($location.path() !== '/create') {
                $scope.createCourse();
                $scope.hideTimeSlot = true;
            }
        });

        Utils.safeApply($scope);

        const getDayOfWeek = (): number => {
            switch (model.calendar.days.all[0].name) {
                case "monday":
                    return 1;
                case "tuesday":
                    return 2;
                case "wednesday":
                    return 3;
                case "thursday":
                    return 4;
                case "friday":
                    return 5;
                case "saturday":
                    return 6;
                default:
                    return 7;
            }
        };

        if (model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.manage)) {
            let $dragging: JQuery = null;
            let topPositionnement: number = 0;
            let startPosition: JQueryCoordinates = {top: null, left: null};
            let $timeslots: JQuery = $('calendar .timeslot');
            $timeslots.removeClass('selecting-timeslot');
            let initVar = (): void => {
                $dragging = null;
                topPositionnement = 0;
                $timeslots.removeClass('selecting-timeslot');
                $('calendar .selected-timeslot').remove();
            };

            // Highlight timeslots when dragging a course
            $timeslots
                .mousemove((e: JQueryMouseEventObject): number => topPositionnement = DragAndDrop.drag(e, $dragging))
                .mouseenter((e: JQueryMouseEventObject): number => topPositionnement = DragAndDrop.drag(e, $dragging));

            const mousemoveCalendarHr = (e: JQueryMouseEventObject): number => topPositionnement = DragAndDrop.drag(e, $dragging);

            const mouseupCalendar = (e: JQueryEventObject): void => {
                if (e.which === MOUSE_EVENTS.RIGHT_CLICK) {
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

            const mousedownCalendarScheduleItem = (e: JQueryMouseEventObject): void => {
                if (e.which === MOUSE_EVENTS.RIGHT_CLICK) {
                    return;
                }
                if ($(e.target).hasClass("notpast") || $(e.target).hasClass("inside-schedule")) {
                    $dragging = DragAndDrop.takeSchedule(e, $timeslots);
                    startPosition = $dragging.offset();
                    let calendar: JQuery = $('calendar');
                    calendar.off('mousemove', (e: JQueryEventObject): void => DragAndDrop.moveScheduleItem(e, $dragging));
                    calendar.on('mousemove', (e: JQueryEventObject): void => DragAndDrop.moveScheduleItem(e, $dragging));
                }
            };

            const mouseDownEditIcon = (e: JQueryMouseEventObject): void => {
                if (e.which === MOUSE_EVENTS.LEFT_CLICK) {
                    e.stopPropagation();
                    $scope.chooseTypeEdit($(e.currentTarget).data('id'), moment(e.target.children[0].innerHTML),
                        moment(e.target.children[1].innerHTML));
                    $(e.currentTarget).unbind('mousedown');
                }
            };

            const prepareToDelete = (event: JQueryEventObject): void => {
                let start: Moment = moment(event.currentTarget.children[0]
                    .children[1].children[0].children[0].innerHTML);

                if (event.which === MOUSE_EVENTS.RIGHT_CLICK && !$(event.currentTarget).hasClass("selected")) {
                    if (start.clone().add(-DateUtils.QUARTER_HOUR_MINUTES, "minutes").isAfter(moment())) {
                        prepareDeleteCourse(event, event.currentTarget);
                    } else if (start.clone().add(-DateUtils.QUARTER_HOUR_MINUTES, "minutes").isBefore(moment())
                        && $scope.chronoEnd) {
                        event.stopPropagation();
                        $scope.chronoEnd = false;
                        setTimeout(((): void => {
                            $scope.chronoEnd = true;
                        }), 100);
                        toasts.info(start.isBefore(moment()) ? "edt.cantDelete.courses" : "edt.cantDelete.courses.before");
                    }
                }
                Utils.safeApply($scope);
            };


            const prepareDeleteCourse = (event: JQueryEventObject, target: Element): void => {
                let start: Moment = moment(target.children[0]
                    .children[1].children[0].children[0].innerHTML);
                let currentTarget: JQuery = $(target);

                if (start.clone().add(-DateUtils.QUARTER_HOUR_MINUTES, "minutes").isAfter(moment())) {
                    event.stopPropagation();
                    let itemId: string = currentTarget.data("id");
                    currentTarget.addClass("selected");
                    let courseToDelete: Course = _.findWhere(_.pluck($scope.structure.calendarItems.all, 'course'),
                        {_id: itemId});

                    $scope.editOccurrence = true;
                    (!courseToDelete.timeToDelete) ? courseToDelete.timeToDelete = [] : courseToDelete.timeToDelete;

                    let startString: string = moment(start).format(DATE_FORMAT["YEAR/MONTH/DAY"]);
                    if (courseToDelete.timeToDelete.find((time: string): boolean => time === startString) === undefined) {
                        courseToDelete.timeToDelete.push(startString);
                    }

                    $scope.params.coursesToDelete.push(courseToDelete);
                    $scope.params.coursesToDelete = $scope.params.coursesToDelete.sort()
                        .filter((el: Course, i: number, a: Array<Course>): boolean => {
                            return i === a.indexOf(el);
                        });
                }
            };


            const cancelDelete = (event: JQueryMouseEventObject): void => {
                let start: Moment = moment(event.currentTarget.children[0].children[1].children[0].children[0].innerHTML);

                if (event.which === MOUSE_EVENTS.RIGHT_CLICK && $(event.currentTarget).hasClass("selected")) {
                    event.stopPropagation();
                    $(event.currentTarget).removeClass("selected");
                    let idToDelete: string = $(event.currentTarget).data("id");
                    $scope.params.coursesToDelete.map((course: Course, i: number): void => {
                        if (course._id === idToDelete) {
                            let currentCourse: Course = $scope.params.coursesToDelete[i];
                            if (currentCourse.timeToDelete.length > 1) {
                                currentCourse.timeToDelete.map((t: string, ii: number): void => {
                                    if (moment(start).format(DATE_FORMAT['YEAR/MONTH/DAY']) === t) {
                                        $scope.params.coursesToDelete[i].timeToDelete.splice(ii, 1);
                                    }
                                });
                            } else {
                                $scope.params.coursesToDelete[i].timeToDelete = [];
                                $scope.params.coursesToDelete.splice(i, 1);
                            }
                        }
                    });
                }
                if (event.which === MOUSE_EVENTS.RIGHT_CLICK && $(event.currentTarget).hasClass("cantDelete")) {
                    event.stopPropagation();
                    $(event.currentTarget).removeClass("cantDelete");
                }
                Utils.safeApply($scope);

            };

            const keyDownCalendar = (e: JQueryEventObject): void => {
                // CTRL + A
                if ((e.ctrlKey || e.metaKey) && e.keyCode === KEY_EVENTS.A) {
                    event.stopPropagation();
                    let $scheduleItem: JQuery = $('body calendar .schedule-item-content');

                    for (let i: number = 0; i < $scheduleItem.length; i++) {
                        prepareDeleteCourse(e, $scheduleItem[i]);
                    }

                    Utils.safeApply($scope);
                }
            };

            let $body: JQuery = $('body');

            // Left click + drag on course
            $body.off('mousemove', 'calendar hr', mousemoveCalendarHr);
            $body.on('mousemove', 'calendar hr', mousemoveCalendarHr);

            // Left click on course edit icon
            $body.off('mousedown', '.one.cell.edit-icone', mouseDownEditIcon);
            $body.on('mousedown', '.one.cell.edit-icone', mouseDownEditIcon);

            // Left click on course
            $body.off('mousedown', 'calendar .schedule-item', mousedownCalendarScheduleItem);
            $body.on('mousedown', 'calendar .schedule-item', mousedownCalendarScheduleItem);
            $('body calendar .schedule-item').css('cursor', 'move');

            // Right click on course
            $body.on('mousedown', '.schedule-item-content', prepareToDelete);
            $body.on('mousedown', '.schedule-item-content.selected', cancelDelete);
            $body.on('mousedown', '.schedule-item-content.cantDelete', cancelDelete);

            // Release left click on calendar (ending drag of course)
            $body.off('mouseup', 'calendar', mouseupCalendar);
            $body.on('mouseup', 'calendar', mouseupCalendar);

            // Press key
            $body.off('keydown', keyDownCalendar);
            $body.on('keydown', keyDownCalendar);

            // Prevent selection of text when pressing CTRL + A
            $(document).attr('unselectable', 'on')
                .css({
                    '-moz-user-select': 'none',
                    '-o-user-select': 'none',
                    '-khtml-user-select': 'none',
                    '-webkit-user-select': 'none',
                    '-ms-user-select': 'none',
                    'user-select': 'none'
                })
                .bind('selectstart', false);
        }
    }


    static moveScheduleItem = (e: JQueryMouseEventObject, dragging: JQuery): void => {
        if (dragging) {
            let positionScheduleItem: JQueryCoordinates = {
                top: e.pageY - dragging.height() / 2,
                left: e.pageX - dragging.width() / 2
            };
            dragging.offset(positionScheduleItem);
        }
    }

    static drag = (e: JQueryMouseEventObject, dragging: JQuery): number => {
        let topPositionnement: number = 0;
        if (dragging) {
            $('calendar .selected-timeslot').remove();
            let curr: JQuery = $(e.currentTarget);
            let currDivHr: JQuery = curr.children('hr');
            let notFound: boolean = true;
            let i: number = 0;
            let prev: JQuery = curr;
            let next: any;
            while ( notFound && i < currDivHr.length) {
                next = $(currDivHr)[i];
                if (!($(prev).offset().top <= e.pageY && e.pageY > $(next).offset().top)) {
                    notFound = false;
                }
                prev = next;
                i++;
            }
            topPositionnement = DragAndDrop.getTopPositioning(dragging);
            if ($(prev).prop("tagName") === 'HR' &&  notFound === false ) {
                $(prev).before(`<div class="selected-timeslot" style="height: ${dragging.height()}px; top:-20px;"></div>`);
            } else if ( i >= currDivHr.length && notFound === true ) {
                $(next).after(`<div class="selected-timeslot" style="height: ${dragging.height()}px; top:-20px;"></div>`);
            } else {
                $(prev).append(`<div class="selected-timeslot"  style="height: ${dragging.height()}px; top:-20px;"></div>`);
            }
        }
        return topPositionnement;
    }

    static getTopPositioning = (dragging: JQuery): number => {
        let top: number = Math.floor(dragging.height() / 2);
        for (let z: number = 0; z <= 5 ; z++) {
            if ( ((top + z) % 10) === 0) {
                top = top + z;
                break;
            }
            else if (((top - z) % 10) === 0) {
                top = top - z;
                break;
            }
        }
        return top;
    }

    static takeSchedule = (e: JQueryMouseEventObject, timeslots): JQuery => {
        timeslots.addClass( 'selecting-timeslot' );
        $(document).mousedown((): boolean => {  return false; });
        return $(e.currentTarget);
    }

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

import {_, moment, ng, idiom as lang} from 'entcore';
import {COMBO_LABELS, Course, CourseOccurrence, DAYS_OF_WEEK, Group, Subject, Subjects, Teacher, Utils} from '../model';
import {TimeSlot, TimeSlots} from "../model/timeSlots";
import {DateUtils} from "../utils/date";
import {Moment} from "moment";
import {DATE_FORMAT} from "../core/constants/dateFormat";
import {TimeSlotHourPeriod} from "../model/viescolaire";

declare const window: any;

export let manageCourseCtrl = ng.controller('manageCourseCtrl',
    ['$scope', '$location', '$routeParams', "$timeout", ($scope, $location, $routeParams, $timeout) => {
        $scope.timeSlotHourPeriod = TimeSlotHourPeriod;
        $scope.daysOfWeek = DAYS_OF_WEEK;
        $scope.comboLabels = COMBO_LABELS;
        $scope.selectionOfTeacherSubject = new Subjects();
        $scope.Utils = Utils;

        $scope.info = {
            firstOccurrenceDate: "",
            firstWeekNumber: "",
            occurrenceInExclusion: false
        };

        $scope.course.timeSlots = !($scope.timeSlots) ? new TimeSlots($scope.structure.id) : $scope.timeSlots;
        $scope.course.timeSlot = !($scope.timeSlot) ? new TimeSlot() : $scope.timeSlot;
        $scope.deleteOnlyOneCourse = true;
        $scope.isExceptional = false;

        $scope.setTimeSlot = (): void => {
            $scope.display.checkbox = true;
            let start: string = DateUtils.format($scope.course.startDate, DATE_FORMAT["HOUR-MINUTES"]);
            let end: string = DateUtils.format($scope.course.endDate, DATE_FORMAT["HOUR-MINUTES"]);
            $scope.course.timeSlot = {
                start: null,
                end: null
            };
            if ($scope.timeSlots.haveSlot()) {
                $scope.timeSlots.all.forEach((slot) => {
                    if (slot.startHour === start) {
                        $scope.course.timeSlot.start = slot;
                    }
                    if (slot.endHour === end) {
                        $scope.course.timeSlot.end = slot;
                    }
                });
                $scope.display.freeSchedule = !(($scope.course.timeSlot.start && $scope.course.timeSlot.start.startHour !== "")
                    && ($scope.course.timeSlot.end && $scope.course.timeSlot.end.endHour !== ""));
            } else {
                $scope.display.checkbox = false;
            }
            Utils.safeApply($scope);
        };

        $scope.setTimeSlot();

        $scope.switchStructure = async (structure) => {
            $scope.course.structure = structure;
            window.structure = structure;
            $scope.structure.id = structure.id;
            await $scope.syncStructure(structure);
            $scope.setTimeSlot();
        };

        $scope.isUpdateRecurrence = () => {
            return $scope.course._id && $scope.course._id.trim() !== '' && $scope.course.is_recurrent;
        };

        /**
         * keep the consistency between time of occurrence and dates of course
         */
        $scope.UpToDateInfo = () => {
            let occurrence = moment($scope.course.startDate);
            if ($scope.course.courseOccurrences[0] && $scope.course.courseOccurrences[0].dayOfWeek)
                occurrence.day($scope.course.courseOccurrences[0].dayOfWeek);
            else
                occurrence.day($scope.courseOccurrenceForm.dayOfWeek);
            if (moment($scope.course.startDate).isAfter(occurrence))
                occurrence.add('days', 7);
            $scope.info.firstOccurrenceDate = occurrence.format(DATE_FORMAT["YEAR/MONTH/DAY"]);
            $scope.info.firstWeekNumber = occurrence.get('week');
            Utils.safeApply($scope);
        };

        $scope.changeDate = (): void => {
            let startDate: string = moment($scope.course.startDate).format(DATE_FORMAT['YEAR-MONTH-DAY']);
            let startTime: string = !$scope.display.freeSchedule && $scope.course.timeSlot.start ? $scope.course.timeSlot.start.startHour
                    : moment($scope.courseOccurrenceForm.startTime).format(DATE_FORMAT['HOUR-MIN-SEC']);
            let endDate: string = moment($scope.course.endDate).format(DATE_FORMAT['YEAR-MONTH-DAY']);
            let endTime: string = !$scope.display.freeSchedule && $scope.course.timeSlot.end ? $scope.course.timeSlot.end.endHour
                    : moment($scope.courseOccurrenceForm.endTime).format(DATE_FORMAT['HOUR-MIN-SEC']);

            if (!$scope.course.is_recurrent || moment(endDate).diff(moment(startDate), 'days') < 7) {
                endDate = startDate;
                $scope.course.endDate = $scope.course.startDate;
            }
            if (Utils.isValidDate(startDate, endDate)) {
                $scope.courseOccurrenceForm.startTime = moment(startDate + 'T' + startTime).toDate();
                $scope.course.startDate = moment(startDate + 'T' + startTime).toDate();
                $scope.courseOccurrenceForm.endTime = moment(endDate + 'T' + endTime).utc().toDate();
                $scope.course.endDate = moment(endDate + 'T' + endTime).utc().toDate();

                $scope.course.courseOccurrences = _.map($scope.course.courseOccurrences, (item) => {
                    let startTime: string = moment(item.startTime).format(DATE_FORMAT['HOUR-MIN-SEC']);
                    let endTime: string = moment(item.endTime).format(DATE_FORMAT['HOUR-MIN-SEC']);
                    item.startTime = moment(startDate + 'T' + startTime).toDate();
                    item.endTime = moment(endDate + 'T' + endTime).toDate();
                    return item;
                });
            }
            $scope.UpToDateInfo();
            Utils.safeApply($scope);
        };

        $scope.isExceptionalSubject = (): boolean => {
            return $scope.isExceptional;
        };

        $scope.toggleExceptional = (): void => {
            $scope.isExceptional = !$scope.isExceptional;
        };

        $scope.syncSubjects = async () => {
            $scope.selectionOfTeacherSubject = new Subjects();
            if ($scope.course.teachers.length > 0) {
                await $scope.selectionOfTeacherSubject.sync($scope.structure.id, _.pluck($scope.course.teachers, 'id'));
                if (!$scope.course.subjectId && $scope.selectionOfTeacherSubject.all.length && $scope.selectionOfTeacherSubject.all.length > 0)
                    $scope.course.subjectId = $scope.selectionOfTeacherSubject.all[0].subjectId;

            } else {
                $scope.selectionOfTeacherSubject = [];
                $scope.course.subjectId = null;
            }
            Utils.safeApply($scope);
        };

        $scope.freeHourInput = (hourPeriod: TimeSlotHourPeriod): void => {
            if ($scope.timeoutInput) $timeout.cancel($scope.timeoutInput);
            $scope.timeoutInput = $timeout(() => $scope.selectTime(hourPeriod), 600);
        };

        $scope.selectTime = (hourPeriod: TimeSlotHourPeriod) => {
            let startHour: Date = null;
            let endHour: Date = null;

            if ($scope.display.freeSchedule && $scope.courseOccurrenceForm.startTime) {
                startHour = $scope.courseOccurrenceForm.startTime;
                endHour = $scope.courseOccurrenceForm.endTime;
            } else if (!$scope.display.freeSchedule && $scope.course.timeSlot) {
                if ($scope.course.timeSlot.start && $scope.course.timeSlot.start.startHour)
                    startHour = DateUtils.getTimeFormatDate($scope.course.timeSlot.start.startHour);
                if ($scope.course.timeSlot.end && $scope.course.timeSlot.end.endHour)
                    endHour = DateUtils.getTimeFormatDate($scope.course.timeSlot.end.endHour);
            }

            let start: string = $scope.course.startDate && startHour ? DateUtils.getDateTimeFormat($scope.course.startDate, startHour) : null;
            let end: string = $scope.course.startDate && endHour ? DateUtils.getDateTimeFormat($scope.course.startDate, endHour) : null;

            switch (hourPeriod) {
                case TimeSlotHourPeriod.START_HOUR:
                    if ((start && end && !DateUtils.isPeriodValid(start, end)) ||
                        (!(start && end) && $scope.course.startDate)) {
                        if (startHour) {
                            if ($scope.display.freeSchedule) $scope.courseOccurrenceForm.endTime = moment($scope.courseOccurrenceForm.startTime).add(1, 'hours').toDate()
                            else {
                                $scope.course.timeSlot.end = {...$scope.course.timeSlot.start};
                                endHour = DateUtils.getTimeFormatDate($scope.course.timeSlot.end.endHour);
                            }
                        }
                    }
                    break;
                case TimeSlotHourPeriod.END_HOUR:
                    if ((start && end && !DateUtils.isPeriodValid(start, end)) ||
                        (!(start && end) && $scope.course.startDate)) {
                        if (endHour != null) {
                            if ($scope.display.freeSchedule) $scope.courseOccurrenceForm.startTime = moment($scope.courseOccurrenceForm.endTime).add(-1, 'hours').toDate()
                            else {
                                $scope.course.timeSlot.start = {...$scope.course.timeSlot.end};
                                endHour = DateUtils.getTimeFormatDate($scope.course.timeSlot.end.endHour);
                            }
                        }
                    }
                    break;
                default:
                    return;
            }
        };

        $scope.setTimeSlotFromCourseOccurrence = (): void => {
            $scope.course.timeSlots.all.forEach((t: TimeSlot) => {

                if (t.startHour === moment($scope.courseOccurrenceForm.startTime).format(DATE_FORMAT['LONG-TIME'])) {
                    $scope.course.timeSlot.start = t;
                    $scope.course.timeSlot.end = t;
                }
                let endTimeCourseMoment: Moment = moment($scope.courseOccurrenceForm.endTime);

                if ($scope.isAnUpdate) {
                    if (t.endHour === endTimeCourseMoment.format(DATE_FORMAT['LONG-TIME']) ||
                        moment(moment(endTimeCourseMoment.format(DATE_FORMAT['YEAR-MONTH-DAY']) + ' ' + t.endHour)
                            .utc().toDate()).isBetween(
                            moment($scope.courseOccurrenceForm.endTime).add(-15, 'minutes'),
                            moment($scope.courseOccurrenceForm.endTime).add(15, 'minutes'),
                            undefined, '[]')) {
                        $scope.course.timeSlot.end = t;
                        $scope.courseOccurrenceForm.endTime = moment(endTimeCourseMoment
                            .format(DATE_FORMAT['YEAR-MONTH-DAY']) + ' ' + t.endHour).utc().toDate();
                    }
                }
            });

            if ($scope.course.timeSlot.start) {
                if (moment($scope.courseOccurrenceForm.startTime)
                        .format(DATE_FORMAT['LONG-TIME']) !== ($scope.course.timeSlot.start.startHour) ||
                    (moment($scope.courseOccurrenceForm.endTime)
                        .format(DATE_FORMAT['LONG-TIME']) !== ($scope.course.timeSlot.end.endHour))) {
                    $scope.display.freeSchedule = true;
                }
            }
        };

        /**
         * Init Courses
         */

        if ($location.$$path.includes('/edit')) {
            $scope.course.courseOccurrences = [];
            $scope.isAnUpdate = true;

            let start: Moment = moment($scope.course.startDate).seconds(0).millisecond(0);
            let end: Moment = moment($scope.course.endDate).seconds(0).millisecond(0);

            if ($routeParams['beginning'] && $routeParams['end']) {
                start = moment($routeParams.beginning, 'x').seconds(0).millisecond(0);
                end = moment($routeParams.end, 'x').seconds(0).millisecond(0);
                $scope.courseOccurrenceForm.startTime = moment(start).utc().toDate();
                $scope.courseOccurrenceForm.endTime = moment(end).utc().toDate();
                let startMinutes: number = moment($scope.course.startDate).minutes() + (60 * moment($scope.course.startDate).hours());
                let endMinutes: number = moment($scope.course.endDate).minutes() + (60 * moment($scope.course.endDate).hours());

                $scope.courseOccurrenceForm.endTime = moment(start).utc().add(endMinutes - startMinutes, 'minutes').toDate();

                $scope.course.dayOfWeek = moment(start).day();

                if (!$scope.course.is_recurrent) {
                    $scope.course.startDate = $scope.course.end = moment(start).utc().toDate();
                }
            }

            if ($scope.course.exceptionnal && $scope.course.subjectId == null) {
                $scope.isExceptional = true;
            }

            $scope.setTimeSlotFromCourseOccurrence();

            if ($scope.course.is_recurrent) {
                if ($scope.course.dayOfWeek && $scope.course.startDate && $scope.course.endDate) {
                    $scope.course.courseOccurrences = [
                        new CourseOccurrence(
                            $scope.course.dayOfWeek,
                            $scope.course.roomLabels[0],
                            new Date(start.toString()),
                            new Date(end.toString())
                        )];
                }
            } else {
                $scope.course.startDate = new Date(start.toString());
                $scope.course.endDate = new Date(end.toString());

            }

        } else if ($location.$$path.includes('/create')) {
            $scope.editOccurrence = false;
            $scope.display.freeSchedule = (!$scope.course.timeSlots.all || $scope.course.timeSlots.all.length === 0);
            $scope.setTimeSlotFromCourseOccurrence();
        }
        $scope.course.structure = $scope.structure;
        $scope.syncSubjects();

        $scope.makeRecurrentCourse = () => {
            $scope.course.is_recurrent = true;
            let structure = $scope.structure;
            if (structure && structure.periodeAnnee && structure.periodeAnnee.end_date) {
                $scope.course.endDate = moment(structure.periodeAnnee.end_date)
                    .format(DATE_FORMAT["YEAR-MONTH-DAYTHOUR-MIN-SEC"]);
            }
            Utils.safeApply($scope);
        };

        $scope.makePonctual = () => {
            $scope.course.is_recurrent = false;
            $scope.course.end = $scope.course.startDate;
            Utils.safeApply($scope);
        };

        /**
         * Drop a teacher in teachers list
         * @param {Teacher} teacher Teacher to drop
         */
        $scope.dropTeacher = (teacher: Teacher): void => {
            $scope.course.teachers = _.without($scope.course.teachers, teacher);
            $scope.syncSubjects();
        };

        /**
         * Drop a group in groups list
         * @param {Group} group Group to drop
         */
        $scope.dropGroup = (group: Group): void => {
            $scope.course.groups = _.without($scope.course.groups, group);
        };

        /**
         * order a group in groups list
         * @param a: Group
         * @param b: Group
         */
        $scope.orderGroups = (a: Group, b: Group): number => {
            return (a.isInCurrentTeacher && !b.isInCurrentTeacher)
            && a.type_groupe < b.type_groupe
            && a.name < b.name
                ? 1 : -1
        };

        $scope.groupBySubjectBelonging = (subject: Subject): String => {
            if (subject.teacherId !== undefined) {
                return lang.translate('edt.subjects.teachers');
            } else {
                return lang.translate('edt.subjects.others');
            }
        };

        $scope.mergeSubjects = (): Array<Subject> => {
            return [...getOrderedTeacherSubjects(), ...getStructureSubjects()];
        };

        const getOrderedTeacherSubjects = (): Array<Subject> => {
            return ($scope.selectionOfTeacherSubject.all && $scope.selectionOfTeacherSubject.all.length !== 0) ?
                $scope.selectionOfTeacherSubject.all
                    .sort((a: Subject, b: Subject) => a.subjectLabel.localeCompare(b.subjectLabel)) : [];
        };

        const getStructureSubjects = (): Array<Subject> => {
            return ($scope.structure.subjects && $scope.structure.subjects.all.length !== 0) ?
                $scope.structure.subjects.all
                    .sort((a: Subject, b: Subject) => a.subjectLabel.localeCompare(b.subjectLabel)) : [];
        };

        /**
         * Drop a course occurrence from the table
         * @param {CourseOccurrence} occurrence Course occurrence to drop.
         */
        $scope.dropOccurrence = (occurrence: CourseOccurrence): void => {
            $scope.course.courseOccurrences = _.without($scope.course.courseOccurrences, occurrence);
            Utils.safeApply($scope);
        };

        /**
         * Create a course occurrence
         */
        $scope.submit_CourseOccurrence_Form = (): void => {
            if (!$scope.display.freeSchedule) {
                $scope.courseOccurrenceForm.startTime = moment(moment($scope.course.startDate).format(DATE_FORMAT["YEAR-MONTH-DAY"])
                    + ' ' + $scope.course.timeSlot.start.startHour);
                $scope.courseOccurrenceForm.endTime = moment(moment($scope.course.endDate).format(DATE_FORMAT["YEAR-MONTH-DAY"])
                    + ' ' + $scope.course.timeSlot.end.endHour);
                $scope.course.idStartSlot = $scope.course.timeSlot.start.id;
                $scope.course.idEndSlot = $scope.course.timeSlot.end.id;
            }
            // $scope.course.courseOccurrences.push(_.clone($scope.courseOccurrenceForm));
            $scope.course.courseOccurrences.push($scope.courseOccurrenceForm);
            $scope.courseOccurrenceForm = new CourseOccurrence();
            // $scope.changeDate();
        };

        /**
         * Function canceling course creation
         */
        $scope.cancelCreation = () => {
            delete $scope.course;
            $scope.goTo('/');

        };

        /**
         * Returns time formatted
         * @param date Date to format
         */

        $scope.getTime = (date: any) => {
            return moment(date).format("HH:mm");
        };

        /**
         *
         * Save course based on parameter
         * @param {Course} course course to save
         * @returns {Promise<void>} Returns a promise
         */
        $scope.saveCourse = async (course: Course): Promise<void> => {
            $scope.changeDate();
            course.display = $scope.display;

            if (!$scope.display.freeSchedule) {
                course.idStartSlot = $scope.course.timeSlot.start.id;
                course.idEndSlot = $scope.course.timeSlot.end.id;
            }

            if ($scope.isExceptional) {
                course.subjectId = null;
            }

            if (!$scope.isExceptional && $scope.course.exceptionnal) {
                $scope.course.exceptionnal = null;
            }

            if ($scope.editOccurrence === true) {
                course.syncCourseWithOccurrence($scope.courseOccurrenceForm);
                delete course.recurrence;
                await course.update();
            } else if ($scope.isUpdateRecurrence()) {
                course.syncCourseWithOccurrence($scope.courseOccurrenceForm);
                course.newRecurrence = Utils.uuid();
                await course.update();
            } else if (course.is_recurrent) {
                let courses = course.getCourseForEachOccurrence();
                await courses.save();
            } else {

                course.dayOfWeek = moment(course.startDate).day();
                course.roomLabels = $scope.courseOccurrenceForm.roomLabels;
                if (!$scope.display.freeSchedule) {
                    course.startDate = moment(moment(course.startDate).format(DATE_FORMAT["YEAR-MONTH-DAY"]) + ' '
                        + $scope.course.timeSlot.start.startHour);
                    course.endDate = moment(moment(course.endDate).format(DATE_FORMAT["YEAR-MONTH-DAY"]) + ' '
                        + $scope.course.timeSlot.end.endHour);
                } else {
                    course.startDate = moment(moment(course.startDate).format(DATE_FORMAT["YEAR-MONTH-DAY"]) + ' '
                        + moment($scope.courseOccurrenceForm.startTime).format(DATE_FORMAT["HOUR-MIN-SEC"]));
                    course.endDate = moment(moment(course.endDate).format(DATE_FORMAT["YEAR-MONTH-DAY"]) + ' '
                        + moment($scope.courseOccurrenceForm.endTime).format(DATE_FORMAT["HOUR-MIN-SEC"]));
                }
                await course.save();
            }
            delete $scope.course;
            $scope.goTo('/');
        };


        /**
         * Function triggered on step 3 activation
         */
        $scope.isValidForm = (): boolean => {
            return $scope.course
                && $scope.course.teachers
                && $scope.course.groups
                && $scope.course.teachers.length > 0
                && $scope.course.groups.length > 0
                && $scope.course.subjectId !== undefined
                && (($scope.display.freeSchedule
                        && moment($scope.courseOccurrenceForm.endTime).isAfter(moment($scope.courseOccurrenceForm.startTime).add(14, "minutes"))
                    )
                    || (!$scope.display.freeSchedule
                        && $scope.course.timeSlot.start !== undefined
                        && $scope.course.timeSlot.end !== undefined
                    ) && ($scope.course.timeSlot.end.endHour > $scope.course.timeSlot.start.startHour)
                )
                && (!$scope.isExceptional
                    || ($scope.course.exceptionnal
                        && $scope.course.exceptionnal.length > 0
                        && $scope.course.exceptionnal.trim() !== "")
                )
                && (
                    ($scope.course.is_recurrent
                        && $scope.course.courseOccurrences
                        && $scope.course.courseOccurrences.length > 0
                        && ((Utils.isValidDate($scope.course.startDate, $scope.course.endDate))
                            || (
                                $scope.isUpdateRecurrence()
                                && $scope.course.timeSlot.start !== undefined
                                && $scope.course.timeSlot.end !== undefined
                                && $scope.Utils.isValidDate($scope.courseOccurrenceForm.startTime, $scope.courseOccurrenceForm.endTime)
                            ))
                        &&
                        (($scope.display.freeSchedule
                                && isNaN($scope.courseOccurrenceForm.startTime._d)
                                && isNaN($scope.courseOccurrenceForm.endTime._d))
                            || (!$scope.display.freeSchedule
                                && $scope.course.timeSlot.start !== undefined
                                && $scope.course.timeSlot.end !== undefined
                            )
                        ))
                    || !$scope.course.is_recurrent
                )
                && $scope.isPastDate();
        };

        const areSetDates = (): boolean => {
            return $scope.course.startDate && (isFreeScheduleDateSet() || isTimeSlotDateSet());
        };

        const isFreeScheduleDateSet = (): boolean => {
            return $scope.display.freeSchedule && $scope.courseOccurrenceForm.startTime && $scope.courseOccurrenceForm.endTime
        };

        const isTimeSlotDateSet = (): boolean => {
            return !$scope.display.freeSchedule && $scope.course.timeSlot && $scope.course.timeSlot.start &&
                $scope.course.timeSlot.start.startHour && $scope.course.timeSlot.end && $scope.course.timeSlot.end.endHour
        };

        $scope.startTimeIsAfterEndTime = (): boolean => {
            if (!areSetDates()) return true;
            if ($scope.display.freeSchedule)
                return moment($scope.courseOccurrenceForm.endTime)
                    .isAfter(moment($scope.courseOccurrenceForm.startTime)
                        .add(14, "minutes"));
            else return $scope.course.timeSlot.end.endHour > $scope.course.timeSlot.start.startHour;
        };

        $scope.isPastDate = (): boolean => {
            if (!areSetDates()) return true;
            if ((moment($scope.course.startDate).format('L')) === moment(moment().format('L'))._i) {
                if ($scope.course.is_recurrent) {
                    return moment($scope.courseOccurrenceForm.startTime).isAfter(moment());
                } else {
                    let time: Moment = moment($scope.courseOccurrenceForm.startTime);
                    return moment(moment($scope.course.startDate).hours(time.hours()).minutes(time.minutes()))
                        .isAfter(moment());
                }
            } else return !moment($scope.course.startDate).isBefore(moment());
        };

        /**
         * toInt using for HTML to map our ng-option value in number
         */
        $scope.toInt = (val: any): number => {
            return parseInt(val);
        };

        $scope.tryDropCourse = () => {
            $scope.openedLightbox = true;
        };

        $scope.dropCourse = async (course: Course) => {
            if (course.canIManageCourse()) {
                $scope.editOccurrence || !course.is_recurrent ? await course.delete(course._id) : await course.delete(null, course.recurrence);
                delete $scope.course;
                $scope.goTo('/');
                await $scope.syncCourses();
            }
        };

        $scope.closeLightbox = () => {
            $scope.openedLightbox = false;
        };

    }]);
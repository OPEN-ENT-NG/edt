import {_, angular, Behaviours, idiom as lang, model, moment, ng, template} from 'entcore';
import {CalendarItem, Course, CourseOccurrence, Group, Structure, Structures,
    Student, Teacher, USER_TYPES, Utils} from '../model';
import {TimeSlots} from '../model/timeSlots';
import {AutocompleteUtils} from '../model/autocompleteUtils';
import {Moment} from 'moment/moment';
import {DragAndDrop} from "../utils/dragAndDrop";
import {PreferencesUtils} from "../utils/preference/preferences";
import {DateUtils} from "../utils/date";
import {ScheduleItem} from "../model/scheduleItem";
import { ICourseTagService } from "../services/courseTag.service";
import {ICourseService} from "../services";
import {IAngularEvent} from "angular";
import {Subject} from "rxjs";
import {DAY_OF_WEEK} from "../core/enum/dayOfWeek.enum";

declare const window: any;

export let main = ng.controller('EdtController',
    ['$scope', 'route', '$location', '$timeout', 'CourseTagService', 'CourseService',
        function($scope, route, $location, $timeout, courseTagService: ICourseTagService,
               courseService: ICourseService) {
        $scope.structures = new Structures();
        $scope.params = {
            user: [],
            group: [],
            oldGroup: [],
            oldUser: [],
            coursesToUpdate: [],
            updateItem: null,
            dateFromCalendar: null
        };

        $scope.courseTags = [];

        $scope.autocomplete = AutocompleteUtils;
        const WORKFLOW_RIGHTS = Behaviours.applicationsBehaviours.edt.rights.workflow;

        $scope.chronoEnd = true;

        let isUpdateData = false;
        $scope.isAllStructure = false;
        $scope.isAllCoursesSelected = false;
        $scope.structures.sync();

        //GroupsDeleted : groups which are deleted from the filter
        //classes : classes for which the groups are deleted
        $scope.params.deletedGroups = {
            groupsDeleted: [],
            classes: []
        };

        // setting preference structure in or the first()
        $scope.structure = getStructure();

        $scope.onEventUpdateChild = new Subject<Student>();
        $scope.onEventUpdateStructure = new Subject<Structure>();

        /**
         * Returns time slot by structure
         */
        $scope.timeSlots = new TimeSlots($scope.structure.id);
        $scope.timeSlot = undefined;

        $scope.display = {
            showQuarterHours : true
        };
        $scope.showLightBox = {
            home_lightbox : false,
            update_lightbox: false,
            isUpdateOccurrenceLightbox: false
        };

        $scope.updateMultipleLightboxForm = {
            isDeleteCourses : true,
            tagId: null
        }


        $scope.calendarLoader = {
            show: false,
            display: () => {
                $scope.calendarLoader.show = true;
            },
            hide: () => {
                $scope.calendarLoader.show = false;
            }
        };

        /**
         * Synchronize a structure.
         */
        $scope.syncStructure = async (structure: Structure): Promise<void> => {
            $scope.structure.synced = true;
            $scope.timeSlots.structure_id = structure.id;
            AutocompleteUtils.init(structure);
            const promises: Promise<void>[] = [];
            promises.push($scope.structure.sync(model.me.type === USER_TYPES.teacher));
            promises.push(initTimeSlots());
            await Promise.all(promises);
            $scope.courseTags = await courseTagService.getCourseTags($scope.structure.id);
            changeDatesOnSunday();
            switch (model.me.type) {
                // student case
                case USER_TYPES.student : {
                    $scope.params.group = structure.groups.all;
                    break;
                }
                // relative
                case USER_TYPES.relative : {
                    if ($scope.structure.students.all.length > 0) {
                        if (!$scope.children) {
                            $scope.children = structure.students.all;
                            $scope.children.sort((c, cc) => {
                                if (c.lastName < cc.lastName || ((c.lastName === cc.lastName) && (c.firstName < cc.firstName))) {
                                    return -1;
                                } else {
                                    return 1;
                                }
                            });
                            $scope.child = structure.students.all[0];
                        }
                        $scope.params.group = _.map(structure.students.all[0].classes, (groupid) => {
                            return _.findWhere(structure.groups.all, {id: groupid});
                        });
                    }
                    break;
                }
            }

            window.structure = $scope.structure;
            await $scope.syncCourses();
            $scope.safeApply();
        };

        $scope.switchChild = async (child: Student): Promise<void> => {
            $scope.child = child;
            $scope.structure = (child.structures.length > 0) ? new Structure(child.structures[0].id,
                child.structures[0].name) : null;
            await $scope.switchStructure($scope.structure);
            await $scope.syncCourses();
        };

        /**
         * Changes current structure
         * @param structure selected structure
         */
        $scope.switchStructure = async (structure: Structure) : Promise<void> => {
            $scope.calendarLoader.hide();
            $scope.structure = structure;
            if (!$scope.isTeacher()) $scope.params.user = [];
            $scope.params.oldUser = [];
            $scope.params.group = [];
            $scope.params.olGroup = [];
            // 1# if null then we figure we are in all_structure
            if ($scope.structure == null) {
                $scope.structure = new Structure(lang.translate("all.structures.id"), lang.translate("all.structures.label"));
            }
            $scope.timeSlots = new TimeSlots($scope.structure.id);
            // case we found our structure
            if ($scope.structure.id != lang.translate("all.structures.id")) {
                $scope.isAllStructure = false;
                await $scope.syncStructure($scope.structure);
                $scope.safeApply();
            } else if ($scope.structure.id == lang.translate("all.structures.id")) {
                // (cf 1#), we are in the case where it is all_structure
                $scope.isAllStructure = true;
                await $scope.syncCourses();
                $scope.safeApply();
            }

            await PreferencesUtils.updateStructure({id : $scope.structure.id, name : $scope.structure.name});
            $timeout(() => $scope.safeApply());
        };

        /**
         * Returns if current user is a personnel
         * @returns {boolean}
         */
        $scope.isPersonnel = (): boolean => model.me.type === USER_TYPES.personnel;

        /**
         * Returns if current user have manage right
         * @returns {boolean}
         */
        $scope.canManage = (): boolean => model.me.hasWorkflow(WORKFLOW_RIGHTS.manage);

        /**
         * Returns if current user is a teacher
         * @returns {boolean}
         */
        $scope.isTeacher = (): boolean => model.me.type === USER_TYPES.teacher;

        /**
         * Returns if current user is a student
         * @returns {boolean}
         */
        $scope.isStudent = (): boolean => model.me.type === USER_TYPES.student;

        /**
         * Returns if current user is a relative profile
         * @returns {boolean}
         */
        $scope.isRelative = (): boolean => model.me.type === USER_TYPES.relative;

        $scope.checkAccess = ()=> {return $scope.isPersonnel() || $scope.isTeacher()};

        /**
         * Returns student group
         * @param {Student} user user group
         * @returns {Group}
         */
        $scope.getStudentGroup = (user: Student): Group =>  _.findWhere($scope.structure.groups.all, { externalId: user.classes[0] });

        function filterCourses(): void {
            $scope.structure.calendarItems.all.map((item: CalendarItem, i: number) =>{
                if( item && moment(item.endCourse).isBefore(item.endDate)|| item &&  !item.startMoment){
                    $scope.structure.calendarItems.all.splice(i,1);
                }
            })
        }

        /**
         * Get timetable bases on $scope.params object
         * @returns {Promise<void>}
         */
        $scope.syncCourses = async (): Promise<void> => {
            let arrayIds: string[] = [];
            $scope.structure.calendarItems.all = [];

            $scope.params.coursesToUpdate = [];
            $scope.isAllCoursesSelected = false;

            if ($scope.isRelative() && $scope.child) {
                await $scope.structure.calendarItems.getGroups($scope.structure.groups.all, null, $scope.child.id);
            } else if ($scope.isStudent()) {
                await $scope.structure.calendarItems.getGroups($scope.params.group, $scope.params.deletedGroups, model.me.userId);
            } else {
                await $scope.structure.calendarItems.getGroups($scope.structure.groups.all, null);
            }

            if (!isUpdateData && $scope.isRelative()) {
                arrayIds = ($scope.child) ? $scope.child.idClasses : model.me.classes;

                $scope.params.group = $scope.structure.groups.all
                    .filter((item: Group) => arrayIds.indexOf(item.id) > -1);
            }

            if (!isUpdateData && $scope.isTeacher()) {
                const {userId, username} = model.me;
                $scope.params.user = [{id: userId, displayName: username}];
            }

            //add groups to classes::checkAccess()
            if (model.me.type === USER_TYPES.personnel || model.me.type === USER_TYPES.teacher)
                $scope.params.group.map(g => {
                    let isInClass: boolean = false;
                    $scope.params.deletedGroups.classes.map(c => {
                        if ((c && g) && c.id === g.id ){
                            isInClass = true;
                        }
                    });

                    if(!isInClass && g && g.type_groupe !== 0 && g.users) {
                        $scope.params.deletedGroups.classes.push(g);
                    }

                    $scope.params.deletedGroups.classes.map(c => {
                        $scope.params.deletedGroups.groupsDeleted.map((gg,index : number) => {
                            if((gg && c) && gg.id === c.id)
                                $scope.params.deletedGroups.groupsDeleted.splice(index,1);

                        });
                    });
                });

            if ($scope.params.group.length > 0) {

                if ($scope.isRelative() && $scope.child) {
                    await $scope.structure.calendarItems.getGroups($scope.params.group, $scope.params.deletedGroups, $scope.child.id);
                } else if ($scope.isStudent()) {
                    await $scope.structure.calendarItems.getGroups($scope.params.group, $scope.params.deletedGroups, model.me.userId);
                } else {
                    await $scope.structure.calendarItems.getGroups($scope.params.group, $scope.params.deletedGroups);
                }

                for (let i = 0; i < $scope.params.group.length; i++) {

                    let group: Group = $scope.params.group[i];

                    //swap groups with corresponding groups with color
                    if (group && (group.color === '' || group.color === undefined || $scope.structure.groups.all.indexOf(group) === -1)) {
                        $scope.params.group[i] = ($scope.structure.groups.all.filter(res => group.name == res.name)[0]);
                    }
                }

                $scope.params.deletedGroups.groupsDeleted.map((g: Group) => {
                    $scope.params.group.map(gg => {
                        if ((g && gg) && (g.id === gg.id && gg.type_groupe !== Utils.getClassGroupTypeMap()['MANUAL_GROUP'])) {
                            $scope.params.group = _.without($scope.params.group, gg);
                        }
                    });
                });
            }

            //add classes after filter groups
            $scope.params.group.map((g: Group) => {
                let isInClass = false;

                $scope.params.deletedGroups.classes.map(c => {
                    if (g && c && c.id === g.id) {
                        isInClass = true;
                    }
                });
                if (!isInClass) {
                    $scope.params.deletedGroups.classes.push(g);
                }
            });

            await $scope.structure.calendarItems.sync($scope.structure, $scope.params.user, $scope.params.group,
                $scope.structures, $scope.isAllStructure);

            filterCourses();

            /* trigger tooltip to show up */
            let $scheduleItems: JQuery = $('.schedule-items');
            $scheduleItems.mousemove(() => {
               $timeout(() => $scope.safeApply(), 500)
            });
            Utils.safeApply($scope);
        };

        /**
         * Drop a teacher in teachers list
         * @param {Teacher} teacher Teacher to drop
         */
        $scope.dropTeacher = (teacher: Teacher): void => {
            $scope.params.oldUser = angular.copy($scope.params.user);
            $scope.params.user = _.without($scope.params.user, teacher);
            $scope.updateDatas();
        };

        /**
         * Drop a group in groups list
         * @param {Group} group Group to drop
         */
        $scope.dropGroup = (group: Group): void => {

            if(group && (group.type_groupe != 0 || group.type_groupe === undefined) && group.color != "")
                $scope.params.deletedGroups.groupsDeleted.push(group);

            $scope.params.deletedGroups.classes.map((c, index: number) => {
                if((group && c) && (c.id == group.id)) {
                    $scope.params.deletedGroups.classes.splice(index,1);
                }
            });

            $scope.params.group = _.without($scope.params.group, group);
        };

        /**
         * Course creation
         */
        $scope.createCourse = () => {
            const edtRights = Behaviours.applicationsBehaviours.edt.rights;
            if (model.me.hasWorkflow(edtRights.workflow.manage)) {
                $scope.goTo('/create');
                $scope.hideTimeSlot = false;
            }
        };

        /**
         * Retrieve teachers list for the search bar
         * @param value the user input
         */
        $scope.filterTeacherOptions = async (value : string) : Promise<void> => {
            await AutocompleteUtils.filterTeacherOptions(value);
            Utils.safeApply($scope);
        };

        /**
         * Retrieve class/group list for the search bar
         * @param value the user input
         */
        $scope.filterClassOptions = async (value : string) : Promise<void> => {
            await AutocompleteUtils.filterClassOptions(value);
            Utils.safeApply($scope);
        };

        /**
         * Select teacher and refresh calendar
         * @param model the user input
         * @param teacher the selected teacher
         */
        $scope.selectTeacher = async (model : string, teacher : Teacher) : Promise<void> => {
            if(!$scope.params.user.some((user: Teacher) => user.id === teacher.id)){
                $scope.params.user.push($scope.getTeacherFromId(teacher.id));
                $scope.updateDatas();
            }
            AutocompleteUtils.resetSearchFields();
        };

        /**
         * Select class/group and refresh calendar
         * @param model the user input
         * @param group the selected class/group
         */
        $scope.selectClass = async (model: string, group: Group): Promise<void> => {
            $scope.toogleFilter($scope.getGroupFromId(group.id));
            AutocompleteUtils.resetSearchFields();
        };

        /**
         * Get teacher object from an id
         * @param id id of the teacher
         */
        $scope.getTeacherFromId = (id: string) : Teacher => {
            return $scope.structure.teachers.all
                .find((teacher: Teacher) => teacher.id === id);
        };

        /**
         * Get group object from an id
         * @param id id of the group
         */
        $scope.getGroupFromId = (id: string) : Group => {
            return $scope.structure.groups.all.find(group => group.id === id);
        };

        $scope.goTo = (state: string) => {
            $location.path(state);
            Utils.safeApply($scope);
        };

        $scope.translate = (key: string) => lang.translate(key);

        $scope.calendarUpdateItem = (itemId, start?, end?,occurrence? ) => {
            if(itemId) {
                $scope.showLightBox.home_lightbox = false;
                let type = occurrence ? 'occurrence' : 'course';
                let url = `/edit/${type}/${itemId}`;
                if (start && end) url += `/${start.format('x')}/${end.format('x')}`;
                $scope.goTo(url);
            }
        };

        template.open('homePagePopUp', 'main/occurrence-or-course-edit-popup');
        template.open('updatePagePopUp', 'main/update-courses-popup');
        template.open('deleteOccurrencePagePopup', 'main/occurrence-or-course-delete-popup');

        /**
         * Determines if the course edition for occurrences popup must be displayed or if the edit page must be called.
         * @param itemId Id of the course
         * @param start Start date of the course occurrences
         * @param end End date of the course occurrences
         * @param isDrag Is true if the course has been dragged by user
         */
        $scope.chooseTypeEdit = async (itemId: string, start?: string, end?: string, isDrag?: boolean): Promise<void> => {
            $scope.courseToEdit = _.findWhere(_.pluck($scope.structure.calendarItems.all, 'course'), {_id: itemId});
            $scope.paramEdition = {
                start: start,
                end: end
            };
            $scope.courseToEdit.isDragged = (isDrag);
            $scope.editOccurrence = true;
            $scope.occurrenceDate = $scope.courseToEdit.getNextOccurrenceDate(Utils.getFirstCalendarDay());

            if ($scope.isAbleToChooseEditionType($scope.courseToEdit, start)) {
                if ($scope.courseToEdit.recurrenceObject === undefined) {
                    $scope.courseToEdit.recurrenceObject = {}; // Weird trick to stop multiple call
                    let recurrence : {startDate: string; endDate: string} = null;

                    try {
                        recurrence = await courseService.getCourseRecurrenceDates($scope.courseToEdit.recurrence);
                    } catch (e) {
                        recurrence = {startDate: "", endDate: ""}
                    }
                    $scope.courseToEdit.recurrenceObject = { start: DateUtils.getDateFormat(recurrence.startDate),
                                                            end: DateUtils.getDateFormat(recurrence.endDate)}
                }

                $scope.showLightBox.home_lightbox = true;
            } else {
                $scope.calendarUpdateItem(itemId, $scope.paramEdition.start, $scope.paramEdition.end);
            }
            Utils.safeApply($scope);
        };

        $scope.cancelEditionLightbox = () =>{
            $scope.showLightBox.home_lightbox = false;
            // model.calendar.setDate(model.calendar.firstDay)
            Utils.safeApply($scope);
        };

        $scope.cancelUpdateLightbox = () =>{
            $scope.showLightBox.update_lightbox = false;
            Utils.safeApply($scope);
        };

        /**
         * Close the delete course occurrences popup.
         */
        $scope.cancelDeleteOccurrenceLightbox = () : void =>{
            $scope.showLightBox.isUpdateOccurrenceLightbox = false;
            Utils.safeApply($scope);
        };

        /**
         * Checks if a course mutiple occurences can be edited
         * @param course the course to edit
         * @param start the date from which courses should be edited
         */
        $scope.isAbleToChooseEditionType = (course: Course, start: Moment): boolean => {
            let now: Moment = moment();
            if (!start) {
                start = moment(course.startDate);
            }
            let previousOccurrence: string = course.getPreviousOccurrenceDate(start);
            let atLeastOnePreviousOccurence: boolean = moment(previousOccurrence).isAfter(moment(start));
            let upcomingOccurrence: string = course.getNextOccurrenceDate(start);
            let atLeastOneOccurence: boolean = moment(course.getNextOccurrenceDate(upcomingOccurrence)).isBefore(moment(start));


            let newDay: string = moment(start).format("DD");
            let previousDay: string = moment(course.startDate).format("DD");
            return course.recurrence !== undefined &&
                ((atLeastOneOccurence && moment(upcomingOccurrence).isAfter(now))
                    || (moment(previousOccurrence).isAfter(now) && atLeastOnePreviousOccurence)
                    || (newDay != previousDay && moment(course.getNextOccurrenceDate(upcomingOccurrence)).isAfter(start))
                    || (moment(start).isAfter(now) && atLeastOneOccurence));
        };

        $scope.getSimpleDateFormat = (date) => {
            return moment(date).format('YYYY-MM-DD');
        };
        $scope.getSimpleFRDateFormat = (date) => {
            return moment(date).format('DD/MM/YYYY');
        };

        $scope.getFirstRecurrenceDate = (course: Course): string => {
            if (course && course.recurrenceObject) {
                return $scope.getSimpleFRDateFormat(moment(course.recurrenceObject.start).isBefore(moment()) ?
                    moment() : course.recurrenceObject.start);
            } else return $scope.getSimpleFRDateFormat(moment());

        };

        /**
         * Drag & drop method
         */
        let initTriggers = (init?: boolean) => {
            DragAndDrop.init(init, $scope, $location);
        };

        $scope.isNotPast = (item: ScheduleItem): boolean => {
            return(moment(item.startDate).add(-15, "minutes").isAfter(moment()));
        };

        /**
         * Open the proper update form (either the delete all occurrences form or the delete one course form).
         */
        $scope.openUpdateForm = async (): Promise<void> => {
            if ($scope.params.coursesToUpdate.length === 1) {
                let course: Course = $scope.params.coursesToUpdate[0];
                if (course.is_recurrent) {
                    if ($scope.isAbleToChooseEditionType(course, course.startDate)) {
                        $scope.courseToEdit = course;
                        if ($scope.courseToEdit.recurrenceObject === undefined) {
                            $scope.courseToEdit.recurrenceObject = {}; // Weird trick to stop multiple call Duplication code. Clean up later

                            let recurrence : {startDate: string; endDate: string} = null;
                            try {
                                recurrence = await courseService.getCourseRecurrenceDates($scope.courseToEdit.recurrence);
                            } catch (e) {
                                recurrence = {startDate: "", endDate: ""}
                            }

                            $scope.courseToEdit.recurrenceObject = { start: DateUtils.getDateFormat(recurrence.startDate),
                                end: DateUtils.getDateFormat(recurrence.endDate)}
                        }
                        $scope.showLightBox.isUpdateOccurrenceLightbox = true;
                    }
                } else {
                    $scope.showLightBox.update_lightbox = true;
                }
            } else {
                $scope.showLightBox.update_lightbox = true;
            }

            Utils.safeApply($scope);
        };

        /**
         * Delete the selected courses.
         */
        $scope.deleteCourses = async () : Promise<void> => {
            const promises = [];
            $scope.params.coursesToUpdate.map((course: Course) => promises.push(course.delete(course._id)));
            await Promise.all(promises);
            $scope.syncCourses();
        };

        $scope.updateLabels = async (): Promise<void> => {
            let courseIds: Array<string> = $scope.params.coursesToUpdate.map((course: Course) => course._id);
            await courseService.updateCoursesTag(courseIds, $scope.updateMultipleLightboxForm.tagId);
            $scope.syncCourses();
        }

        $scope.updateMultipleCourses = async () : Promise<void> => {
            $scope.showLightBox.update_lightbox = false;

            if ($scope.updateMultipleLightboxForm.isDeleteCourses) {
                $scope.deleteCourses();
            } else {
                $scope.updateLabels();
            }
        }

        $scope.toggleSelectAllCourses = (): void => {
            $scope.isAllCoursesSelected = !$scope.isAllCoursesSelected;
            DragAndDrop.togglePrepareDeleteAllCourses($scope, $scope.isAllCoursesSelected);
        };

        /**
         * Check if usen selected the delete all occurrences option and calls the corresponding method
         * @param deleteOccurrence if true all occurrences of the selected course  must be deleted
         */
        $scope.deleteCourseOccurrences = async (deleteOccurrence : boolean) : Promise<void> => {

            $scope.showLightBox.isUpdateOccurrenceLightbox = false;

            if (deleteOccurrence) {
                await $scope.courseToEdit.delete(null, $scope.courseToEdit.recurrence);
                $scope.syncCourses();
            } else {
                $scope.deleteCourses();
            }
        };

        $scope.updateDatas = async () : Promise<void> => {
            isUpdateData = true;
            if(!angular.equals($scope.params.oldGroup, $scope.params.group)) {
                await $scope.syncCourses();
                initTriggers();
                $scope.params.oldGroup = angular.copy($scope.params.group);
            }

            if(!angular.equals($scope.params.oldUser, $scope.params.user)) {
                await $scope.syncCourses();
                initTriggers();
                $scope.params.oldUser = angular.copy($scope.params.user);
            }
        };

        /**
         * Toogle a group/class filter
         * @param {Group} filter selected filter to toggle
         */
        $scope.toogleFilter = async (filter: Group): Promise<void> => {
            $scope.calendarLoader.display();
            if (!$scope.isFilterActive(filter)) {
                $scope.params.group.push(filter);
                // if we found a matching with deletedGroup and the group we just added, we delete it since it will be added later on
                $scope.params.deletedGroups.groupsDeleted.forEach((group, index: number) => {
                    if ($scope.params.group.includes(group)) {
                        $scope.params.deletedGroups.groupsDeleted.splice(index, 1);
                    }
                });
            } else {
                let groups: Group[] = [filter];
                $scope.dropGroup(filter);
                await $scope.structure.calendarItems.getGroups(groups, $scope.params.deletedGroups);
                groups.splice(0, 1);
                groups.forEach(group => {
                    groups.push($scope.structure.groups.all.filter(res => group.name == res.name)[0]);
                });
                groups.forEach(
                    group => $scope.dropGroup(group)
                );
            }
            await $scope.updateDatas();
            $scope.calendarLoader.hide();
            $scope.safeApply();
        };

        /**
         * Check if a filter has been activated
         * @param {Group} filter filter to check
         */
        $scope.isFilterActive = (filter : Group) : boolean => {
            return ($scope.params.group.indexOf(filter) !== -1);
        };

        /**
         * Deselect every currently selected filters
         */
        $scope.deselectAllFilters = () : void => {
            $scope.params.group = [];
            $scope.updateDatas();
        };


        $scope.getMomentFromDate = function (date,time) {
            return  moment([
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                time.hour(),
                time.minute()
            ])
        };

        $scope.initDateCreatCourse = (param?: any, course?: Course): void => {

            if (model.calendar.newItem || (param && param["beginning"] && param["end"])) {
                let timeSlotInfo : {beginning : string, end : string} = {
                    beginning: param ? param.beginning : model.calendar.newItem.beginning.format('x'),
                    end: param ? param.end : model.calendar.newItem.end.format('x')
                };

                let startTime: Moment = (moment.utc(timeSlotInfo["beginning"], 'x')
                    .add('hours', -moment().format('Z').split(':')[0]))
                    .seconds(0)
                    .millisecond(0);
                let endTime: Moment = (moment.utc(timeSlotInfo["end"], 'x')
                    .add('hours', -moment().format('Z').split(':')[0]))
                    .seconds(0)
                    .millisecond(0);


                let dayOfWeek: number = moment(timeSlotInfo["beginning"], 'x').day();
                let roomLabel: string = course ? course.roomLabels[0] : '';

                $scope.courseOccurrenceForm = new CourseOccurrence(
                    dayOfWeek,
                    roomLabel,
                    startTime.toDate(),
                    endTime.toDate()
                );

                delete model.calendar.newItem;
                return moment(timeSlotInfo["beginning"], 'x');

            } else {
                if (course && !course.is_recurrent) {
                    $scope.courseOccurrenceForm = new CourseOccurrence(
                        course.dayOfWeek,
                        course.roomLabels[0],
                        moment(course.startDate).utc().toDate(),
                        moment(course.endDate).utc().toDate()
                    );
                } else
                    $scope.courseOccurrenceForm = new CourseOccurrence();
                return moment();
            }
        };

        const changeDatesOnSunday = (): void => {
            model.calendar.setDate(
                moment().day() === DAY_OF_WEEK.SUNDAY
                    ? moment().add(1, 'week').startOf('week')
                    : moment()
            );
        }

        const initTimeSlots = async (): Promise<void> => {
            await $scope.timeSlots.syncTimeSlots();
            if ($scope.timeSlots.all.length > 0) {
                model.calendar.setTimeslots($scope.timeSlots.all);
            } else $scope.timeSlots.all = null;
        };

        /**
         * Subscriber to directive calendar changes event
         */
        model.calendar.on('date-change', async () => {
            $timeout(async () => {
                $scope.calendarLoader.display();
                if (!$scope.structure.synced) {
                    await $scope.syncStructure($scope.structure);
                }
                await $scope.syncCourses();
                $scope.safeApply();
                initTriggers();
                $scope.calendarLoader.hide();
                $scope.safeApply();
            });
        });

        this.$onInit = (): void => {
            $scope.onEventUpdateChild.asObservable().subscribe((student: Student) => {
                $scope.switchChild(student)
            });

            $scope.onEventUpdateStructure.asObservable().subscribe(async (structure: Structure) => {
                await $scope.switchStructure(new Structure(structure.id, structure.name));
                await $scope.syncCourses();
            });
        }

        this.$onDestroy = (): void => {
            $scope.onEventUpdateChild.unsubscribe();
            $scope.onEventUpdateStructure.unsubscribe();
        }

        $scope.$on('$destroy', () => model.calendar.callbacks['date-change'] = []);

        $scope.safeApply = function (fn?) {
            const phase = $scope.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof (fn) === 'function')) {
                    fn();
                }
            } else {
                $scope.$apply(fn);
            }
        };

        function getStructure(): Structure {
            if (window.preferenceStructure && window.preferenceStructure.id) {
                if (window.preferenceStructure.id == lang.translate("all.structures.id")) {
                    $scope.isAllStructure = true;
                    return new Structure(window.preferenceStructure.id, window.preferenceStructure.name);
                }
                let structure: Structure = $scope.structures.all.find((structure: Structure) =>
                    structure.id === window.preferenceStructure.id);
                return structure ? structure : $scope.structures.first();
            } else {
                // return first structure since we haven't found any
                return $scope.structures.first();
            }
        }

        route({
            main: () : void => {
                template.open('main', 'main/main');
                initTimeSlots();
                changeDatesOnSunday();
                if (!$scope.pageInitialized) {
                    setTimeout((): void => {initTriggers(true);}, 1000);
                }
            },
            create: async () : Promise<void> => {
                let startDate = $scope.initDateCreatCourse();
                const roundedDown = Math.floor(startDate.minute() / 15) * 15;
                startDate.minute(roundedDown).second(0);
                let endDate = moment(startDate).add(1, 'hours');

                $scope.params.group
                    .sort((g, gg) => {
                    if (g.displayName && !gg.displayName) {
                        return -1;
                    } else if (gg.displayName && !g.displayName) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                $scope.course = new Course({
                    structure: _.clone($scope.structure),
                    teachers: _.clone($scope.params.user),
                    groups: _.clone($scope.params.group).filter(g => g !== undefined),
                    courseOccurrences: [],
                    startDate: startDate,
                    endDate: endDate,
                });

                if ($scope.structure && $scope.structures.all.length === 1)
                    $scope.course.structureId = $scope.structure.id;

                if ($scope.canManage()) {
                    template.open('main', 'manage-course');
                }
                Utils.safeApply($scope);
            },
            edit: async (params: any) : Promise<void> => {
                $scope.course = $scope.structure.calendarItems.all.find(course => course._id === params.idCourse);
                if (!$scope.course) {
                    $scope.goTo('/');
                    return;
                }

                $scope.course = new Course($scope.course);
                $scope.course.mapWithStructure(window.structure);
                $scope.initDateCreatCourse(params, $scope.course);
                if ($scope.course.is_recurrent && params.type !== 'occurrence') {
                    let recurrenceObject = $scope.course.recurrenceObject;
                    if (!recurrenceObject) {
                        recurrenceObject = {}; // Weird trick to stop multiple call
                        let recurrence : {startDate: string; endDate: string} = null;
                        try {
                            recurrence = await courseService.getCourseRecurrenceDates($scope.courseToEdit.recurrence);
                        } catch (e) {
                            recurrence = {startDate: "", endDate: ""}
                        }

                        recurrenceObject = { start: DateUtils.getDateFormat(recurrence.startDate),
                            end: DateUtils.getDateFormat(recurrence.endDate)}
                    }
                    $scope.course.startDate = moment(recurrenceObject.start);
                    $scope.course.endDate = moment(recurrenceObject.end);
                    $scope.editOccurrence = false;
                    $scope.course.is_recurrent = true;
                } else {
                    $scope.editOccurrence = true;
                }

                if ($scope.canManage()) {
                    template.open('main', 'manage-course');
                }
                Utils.safeApply($scope);
            },
            importSts: () : void => {
                template.open('main', 'sniplet-sts');
            }
        });
    }]);

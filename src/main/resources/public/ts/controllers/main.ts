import {_, angular, Behaviours, idiom as lang, model, moment, ng, template} from 'entcore';
import {
    CalendarItem,
    Course,
    CourseOccurrence,
    Group,
    Structure,
    Structures,
    Student,
    Teacher,
    USER_TYPES,
    Utils
} from '../model';
import {TimeSlots} from '../model/timeSlots';
import {AutocompleteUtils} from '../model/autocompleteUtils';
import {Moment} from 'moment/moment';
import {DragAndDrop} from "../utils/dragAndDrop";
import {PreferencesUtils} from "../utils/preference/preferences";

declare const window: any;

export let main = ng.controller('EdtController',
    ['$scope', 'route', '$location', '$timeout', async ($scope, route, $location, $timeout) => {
        $scope.structures = new Structures();
        $scope.params = {
            user: [],
            group: [],
            oldGroup: [],
            oldUser: [],
            coursesToDelete: [],
            updateItem: null,
            dateFromCalendar: null
        };

        $scope.autocomplete = AutocompleteUtils;

        $scope.chronoEnd = true;

        let isUpdateData = false;
        $scope.isAllStructure = false;
        $scope.structures.sync();
        
        //GroupsDeleted =groups wich are deleted from the filter
        //classes : classes for wich the groups are deleted
        $scope.params.deletedGroups = {
            groupsDeleted: [],
            classes: []
        };

        // setting preference structure in or the first()
        $scope.structure = getStructure();

        /**
         * Returns time slot by structure
         */
        $scope.timeSlots = new TimeSlots($scope.structure.id);
        $scope.timeSlot = undefined;

        $scope.display = {
            showQuarterHours : true
        };
        $scope.show = {
            home_lightbox : false,
            delete_lightbox: false,
            isDeleteOccurrenceLightbox: false
        };
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
        $scope.syncStructure = async (structure: Structure) : Promise<void> => {
            $scope.timeSlots.structure_id = structure.id;
            AutocompleteUtils.init(structure);
            const promises: Promise<void>[] = [];
            promises.push($scope.structure.sync(model.me.type === USER_TYPES.teacher));
            promises.push(initTimeSlots());
            await Promise.all(promises);
            switch (model.me.type) {
                // student case
                case USER_TYPES.student : {
                    $scope.params.group = structure.groups.all;
                    break;
                }
                // relative
                case USER_TYPES.relative : {
                    if ($scope.structure.students.all.length > 0) {
                        if( model.me.type === USER_TYPES.relative && !$scope.children){
                            $scope.children = structure.students.all;
                            $scope.children.sort( (c,cc) => {
                                if (c.lastName < cc.lastName)
                                    return -1;
                                else if (c.lastName === cc.lastName) {
                                    if (c.firstName < cc.firstName)
                                        return -1;
                                    else
                                        return 1;
                                }else
                                    return 1;
                            })
                            $scope.child = structure.students.all[0];
                        }
                        $scope.params.group = _.map(structure.students.all[0].classes, (groupid) => {
                            return _.findWhere(structure.groups.all, {id: groupid});
                        });
                        $scope.currentStudent = structure.students.all[0];
                    }
                    break;
                }
            }
            if (!$scope.isPersonnel()) {
                $timeout(async () => await $scope.syncCourses())
            }
            window.structure = $scope.structure;
            $scope.safeApply();
        };

        $scope.switchChild = (child: Student) => {
            $scope.child = child;
            $scope.syncCourses();
        };

        /**
         * Changes current structure
         * @param structure selected structure
         */
        $scope.switchStructure = async (structure: Structure) : Promise<void> => {
            $scope.calendarLoader.hide();
            $scope.structure = structure;
            // 1# if null then we figure we are in all_structure
            if ($scope.structure == null) {
                $scope.structure = new Structure(lang.translate("all.structures.id"), lang.translate("all.structures.label"));
            }
            $scope.timeSlots = new TimeSlots($scope.structure.id);
            // case we found our structure
            if ($scope.structure.id != lang.translate("all.structures.id") &&
                (($scope.params.group.length !== 0 ||  $scope.params.user.length !== 0) ||
                    $scope.isPersonnel() || $scope.isTeacher())) {
                await $scope.syncStructure($scope.structure);
                $scope.safeApply();
                $scope.isAllStructure = false;
            } else if ($scope.structure.id == lang.translate("all.structures.id")) {
                // (cf 1#), we are in the case where it is all_structure
                $scope.isAllStructure = true;
                await $scope.syncCourses();
                $scope.safeApply();
            }

            await PreferencesUtils.updateStructure({id : $scope.structure.id, name : $scope.structure.name});
        };

        /**
         * Returns if current user is a personnel
         * @returns {boolean}
         */
        $scope.isPersonnel = (): boolean => model.me.type === USER_TYPES.personnel;

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

        $scope.isAParentWhoNeedSidebar = () =>{

            return $scope.isRelative() && ($scope.structures.all.length > 1 || model.me.childrenIds.length > 1)
        }
        $scope.checkAccess = ()=> {return $scope.isPersonnel() || $scope.isTeacher() ||   $scope.isAParentWhoNeedSidebar()};
        $scope.checkTwelve = () => {
            return $scope.isStudent() || ($scope.isRelative() && $scope.structures.all.length < 2)
        };

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
        $scope.syncCourses = async () : Promise<void> => {
            let arrayIds: string[] =[];
            $scope.structure.calendarItems.all = [];

            $scope.params.coursesToDelete = [];
            if($scope.structure.groups.all.length === 0) {
                await $scope.structure.calendarItems.getGroups($scope.structure.groups.all,null);
            }

            if (!isUpdateData && $scope.isRelative()) {
                if($scope.child) {
                    arrayIds.push($scope.child.idClasses)
                } else {
                    arrayIds = model.me.classes
                }
                let groups : Group[] = $scope.structure.groups.all;
                $scope.params.group = groups.filter((item : Group) => arrayIds.indexOf(item.id) > -1);
            }

            if (!isUpdateData && $scope.isTeacher()) {
                const {userId, username} = model.me;
                $scope.params.user = [{id: userId, displayName: username}];
            }

            //add groups to classes
            if (model.me.type === USER_TYPES.personnel || model.me.type === USER_TYPES.teacher)
                $scope.params.group.map(g => {
                    let isInClass : boolean = false;
                    $scope.params.deletedGroups.classes.map(c => {
                        if ((c && g) && c.id === g.id ){
                            isInClass = true;
                        }
                    });

                    if(!isInClass && g.type_groupe !== 0 && g.users) {
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
                await $scope.structure.calendarItems.getGroups($scope.params.group,$scope.params.deletedGroups);

                for (let i = 0 ; i < $scope.params.group.length; i++) {

                    let group : Group = $scope.params.group[i];

                    //swap groups with corresponding groups with color
                    if(group.color === '' || group.color === undefined || $scope.structure.groups.all.indexOf(group) === -1) {
                        $scope.params.group[i] = ($scope.structure.groups.all.filter(res => group.name == res.name)[0]);
                    }
                }

                $scope.params.deletedGroups.groupsDeleted.map((g : Group) => {
                    $scope.params.group.map(gg  => {
                        if(g.id === gg.id && gg.type_groupe !== Utils.getClassGroupTypeMap()['MANUAL_GROUP']){
                            $scope.params.group = _.without($scope.params.group, gg);
                        }
                    })
                })
            }
            //add classes after filter groups
            $scope.params.group.map((g : Group) => {
                let isInClass = false;

                $scope.params.deletedGroups.classes.map(c => {
                    if (g && c && c.id === g.id){
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

        if ($scope.isRelative()) {
            $scope.currentStudent = null;
        }

        /**
         * Drop a teacher in teachers list
         * @param {Teacher} teacher Teacher to drop
         */
        $scope.dropTeacher = (teacher: Teacher): void => {
            $scope.params.user = _.without($scope.params.user, teacher);
            $scope.updateDatas();
        };

        /**
         * Drop a group in groups list
         * @param {Group} group Group to drop
         */
        $scope.dropGroup = (group: Group): void => {

            if((group.type_groupe != 0 || group.type_groupe === undefined) && group.color != "")
                $scope.params.deletedGroups.groupsDeleted.push(group);

            $scope.params.deletedGroups.classes.map((c,index) => {
                if(c.id == group.id){
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
            if(!$scope.params.user.some(user => user.id === teacher.id)){
                $scope.params.user.push(teacher);
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
            $scope.toogleFilter($scope.getGroupFromId(group.id))
            AutocompleteUtils.resetSearchFields();
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
                $scope.show.home_lightbox = false;
                let type = occurrence ? 'occurrence' : 'course';
                let url = `/edit/${type}/${itemId}`;
                if (start && end) url += `/${start.format('x')}/${end.format('x')}`;
                $scope.goTo(url);
            }
        };

        template.open('homePagePopUp', 'main/occurrence-or-course-edit-popup');
        template.open('deletePagePopUp', 'main/delete-courses-popup');
        template.open('deleteOccurrencePagePopup', 'main/occurrence-or-course-delete-popup');

        function formatRecurrenceForLightBox(recurrence: Course[]): { start: any, end: any } {
            if (recurrence.length === 0) {
                return null;
            }

            let start: Moment = moment(recurrence[0].startDate);
            let end: Moment = moment(recurrence[0].endDate);

            for (let i = 0; i < recurrence.length; i++) {
                let course = recurrence[i];
                if (moment(course.startDate).diff(start) < 0) {
                    start = moment(course.startDate);
                }

                if (end.diff(moment(course.endDate)) < 0) {
                    end = moment(course.endDate);
                }
            }

            return {
                start: start.format(),
                end: end.format()
            };
        }

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
                    const recurrence = await ($scope.courseToEdit as Course).retrieveRecurrence();
                    $scope.courseToEdit.recurrenceObject = formatRecurrenceForLightBox(recurrence);
                }

                $scope.show.home_lightbox = true;
            } else {
                $scope.calendarUpdateItem(itemId, $scope.paramEdition.start, $scope.paramEdition.end);
            }
            Utils.safeApply($scope);
        };

        $scope.cancelEditionLightbox = () =>{
            $scope.show.home_lightbox = false;
            // model.calendar.setDate(model.calendar.firstDay)
            Utils.safeApply($scope);
        };

        $scope.cancelDeleteLightbox = () =>{
            $scope.show.delete_lightbox = false;
            Utils.safeApply($scope);
        };

        /**
         * Close the delete course occurrences popup.
         */
        $scope.cancelDeleteOccurrenceLightbox = () : void =>{
            $scope.show.isDeleteOccurrenceLightBox = false;
            Utils.safeApply($scope);
        }

        /**
         * Checks if a course mutiple occurences can be edited
         * @param course the course to edit
         * @param start the date from which courses should be edited
         */
        $scope.isAbleToChooseEditionType = (course: Course, start: string): boolean => {
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

        /**
         * Drag & drop method
         */
        let initTriggers = (init?: boolean) => {
            DragAndDrop.init(init, $scope, $location);
        };

        $scope.isNotPast = (item) => {
            return(moment(item.startDate).isAfter(moment()));
        }

        /**
         * Open the proper delete form (either the delete all occurrences form or the delete one course form).
         */
        $scope.openDeleteForm = async (): Promise<void> => {
            if ($scope.params.coursesToDelete.length === 1) {
                let course: Course = $scope.params.coursesToDelete[0];
                if (course.is_recurrent) {
                    if ($scope.isAbleToChooseEditionType(course, course.startDate)) {
                        $scope.courseToEdit = course;
                        if ($scope.courseToEdit.recurrenceObject === undefined) {
                            $scope.courseToEdit.recurrenceObject = {}; // Weird trick to stop multiple call Duplication code. Clean up later
                            const recurrence = await ($scope.courseToEdit as Course).retrieveRecurrence();
                            $scope.courseToEdit.recurrenceObject = formatRecurrenceForLightBox(recurrence);
                            $scope.show.isDeleteOccurrenceLightbox = true;
                        }
                    }
                } else {
                    $scope.show.delete_lightbox = true;
                }
            } else {
                $scope.show.delete_lightbox = true;
            }

            Utils.safeApply($scope);
        };

        function orderDeletes(c: any) {
            c.timeToDelete.sort((t,tt) => {
                if(moment(t).isAfter(moment(tt))){
                    return 1;
                }else if(moment(t).isBefore(moment(tt))){
                    return -1;
                }else
                    return 0;
            })
        }


        /**
         * Delete the selected courses.
         */
        $scope.deleteCourses = async () : Promise<void> => {
            $scope.show.delete_lightbox = false;
            const promises = [];
            $scope.params.coursesToDelete.map((course: Course) => promises.push(course.delete(course._id)));
            await Promise.all(promises)
            $scope.syncCourses();
        };

        /**
         * Check if usen selected the delete all occurrences option and calls the corresponding method
         * @param deleteOccurrence if true all occurrences of the selected course  must be deleted
         */
        $scope.deleteCourseOccurrences = async (deleteOccurrence : boolean) : Promise<void> => {

            $scope.show.isDeleteOccurrenceLightbox = false;

            if (deleteOccurrence) {
                await $scope.courseToEdit.delete(null, $scope.courseToEdit.recurrence);
                $scope.syncCourses();
            } else {
                $scope.deleteCourses();
            }
        };

        $scope.updateDatas = async () : Promise<void> => {
            isUpdateData = true;
            if(!angular.equals($scope.params.oldGroup, $scope.params.group)){
                await $scope.syncCourses();
                initTriggers();
                $scope.params.oldGroup = angular.copy($scope.params.group);
            }

            if(!angular.equals($scope.params.oldUser, $scope.params.user)){

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
        }

        /**
         * Deselect every currently selected filters
         */
        $scope.deselectAllFilters = () : void => {
            $scope.params.group = [];
            $scope.updateDatas();
        }


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

                let startTime: Moment = (moment.utc(timeSlotInfo["beginning"], 'x').add('hours', -moment().format('Z').split(':')[0])).minute(0).seconds(0).millisecond(0);
                let endTime: Moment = (moment.utc(timeSlotInfo["end"], 'x').add('hours', -moment().format('Z').split(':')[0])).minute(60).seconds(0).millisecond(0);


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
                if (!$scope.structure.synced) {
                    await $scope.syncStructure($scope.structure);
                }

                await $scope.syncCourses();
                $scope.safeApply();
                initTriggers();
            });
        });



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
                let structure: Structure = $scope.structures.all.find((structure: Structure) =>
                    structure.id === window.preferenceStructure.id);
                if (structure) {
                    // return the structure fetched from preferebce
                    return structure;
                } else {
                    // Case we are in all_structure
                    $scope.isAllStructure = true;
                    return new Structure(window.preferenceStructure.id, window.preferenceStructure.name)
                }
            } else {
                // return first structure since we haven't found any
                return $scope.structures.first();
            }
        }

        route({
            main: () : void => {
                template.open('main', 'main');
                if(!$scope.pageInitialized)
                    setTimeout(function(){  initTriggers(true); }, 1000);

            },
            create: async () : Promise<void> => {
                let startDate = $scope.initDateCreatCourse();
                const roundedDown = Math.floor(startDate.minute() / 15) * 15;
                startDate.minute(roundedDown).second(0);
                let endDate = moment(startDate).add(1, 'hours');

                $scope.params.group.sort((g, gg) => {
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
                    groups: _.clone($scope.params.group),
                    courseOccurrences: [],
                    startDate: startDate,
                    endDate: endDate,
                });

                if ($scope.structure && $scope.structures.all.length === 1)
                    $scope.course.structureId = $scope.structure.id;

                if ($scope.isPersonnel()) {
                    template.open('main', 'manage-course');
                }
                Utils.safeApply($scope);
            },
            edit: async (params: any) : Promise<void> => {
                $scope.course = new Course();
                await $scope.course.sync(params.idCourse, $scope.structure);
                $scope.initDateCreatCourse(params, $scope.course);
                if (params.type === 'occurrence') {
                    $scope.occurrenceDate = $scope.courseToEdit.getNextOccurrenceDate(Utils.getFirstCalendarDay());
                    $scope.editOccurrence = true;
                    $scope.course.is_recurrent = false;
                } else {
                    $scope.editOccurrence = false;
                }

                if ($scope.isPersonnel()) {
                    template.open('main', 'manage-course');
                }
                Utils.safeApply($scope);
            },
            importSts: () : void => {
                template.open('main', 'sniplet-sts');
            }
        });
    }]);

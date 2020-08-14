import {_, Behaviours, idiom as lang, model, moment, ng, template, angular , toasts} from 'entcore';
import {
    Course,
    CourseOccurrence,
    Group,
    Structure,
    Structures,
    Student,
    Teacher,
    USER_TYPES,
    UtilDragAndDrop,
    Utils
} from '../model';
import http from "axios";
import {TimeSlots} from "../model/timeSlots";
import { AutocompleteUtils } from "../model/autocompleteUtils";



export let main = ng.controller('EdtController',
    ['$scope', 'route', '$location', async  ($scope, route, $location ) => {
        $scope.structures = new Structures();
        $scope.params = {
            user: [],
            group: [],
            oldGroup:[],
            oldUser: [],
            coursesToDelete:[],
            updateItem: null,
            dateFromCalendar: null
        };

        $scope.autocomplete = AutocompleteUtils;

        $scope.chronoEnd = true;
        async function getMainStruct() {
            let {data} =  await http.get(`/directory/user/${model.me.userId}?_=1556865888485`);
            model.me.idMainStructure = data.functions[0][1][0];
            $scope.structure = $scope.structures.first();
            $scope.syncStructure( $scope.structure)
        }

        let isUpdateData = false;
        $scope.isAllStructure = false;
        $scope.structures.sync();
        //GroupsDeleted =groups wich are deleted from the filter
        //classes : classes for wich the groups are deleted
        $scope.params.deletedGroups = {
            groupsDeleted: [],
            classes: []
        };
        if(model.me.type === "PERSEDUCNAT"){
            getMainStruct()
        }

        $scope.structure = $scope.structures.first();

        $scope.display = {
            showQuarterHours : true
        };
        $scope.show = {
            home_lightbox : false,
            delete_lightbox: false
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
            $scope.structure = structure;
            $scope.timeSlots.structure_id = $scope.structure.id;
            AutocompleteUtils.init(structure);
            $scope.structure.eventer.once('refresh', () =>   Utils.safeApply($scope));
            await $scope.structure.sync(model.me.type === USER_TYPES.teacher);
            await $scope.timeSlots.syncTimeSlots();
            switch (model.me.type) {
                case USER_TYPES.student : {
                    $scope.params.group = $scope.structure.groups.all;

                    break;
                }

                case USER_TYPES.relative : {
                    if ($scope.structure.students.all.length > 0) {
                        if( model.me.type === USER_TYPES.relative && !$scope.children){
                            $scope.children = $scope.structure.students.all;
                            $scope.children.sort( (c,cc) => {
                                if (c.lastName < cc.lastName)
                                    return -1;
                                else if (c.lastName === cc.lastName)
                                {
                                    if (c.firstName < cc.firstName)
                                        return -1;
                                    else
                                        return 1;
                                }else
                                    return 1;
                            })
                            $scope.child = $scope.structure.students.all[0];
                        }
                        $scope.params.group = _.map($scope.structure.students.all[0].classes, (groupid) => {
                            return _.findWhere($scope.structure.groups.all, {id: groupid});

                        });
                        $scope.currentStudent = $scope.structure.students.all[0];
                    }
                    break;
                }
            }

            if ($scope.structures.all.length > 1 && $scope.isTeacher()) {

                let allStructures : Structure = new Structure(lang.translate("all.structures.id"), lang.translate("all.structures.label"));
                if (allStructures && $scope.structures.all.filter(i => i.id == allStructures.id).length < 1){
                    $scope.structures.all.unshift(allStructures);
                    $scope.switchStructure($scope.structures.all[0]);
                }
            }

            Utils.safeApply($scope);
            if (!$scope.isPersonnel()) {
                $scope.syncCourses();
            }
        };

        $scope.switchChild = (child: Student) =>{
            $scope.child= child;

            $scope.syncCourses();
        };

        /**
         * Changes current structure
         * @param structure selected structure
         */
        $scope.switchStructure = (structure: Structure) : void => {
            $scope.timeSlots = new TimeSlots($scope.structure.id);
            if (structure.id != lang.translate("all.structures.id") &&
                (($scope.params.group.length !== 0 ||  $scope.params.user.length !== 0) ||   $scope.isPersonnel() || $scope.isTeacher() )) {

                $scope.syncStructure(structure);
                $scope.isAllStructure = false;
            }
            else if (structure.id == lang.translate("all.structures.id")) {
                $scope.isAllStructure = true;
                $scope.structure = structure;
            };
        };

        /**
         * Returns time slot by structure
         */
        $scope.timeSlots = new TimeSlots($scope.structure.id);
        $scope.timeSlot = undefined;

        $scope.timeSlots.syncTimeSlots().then(() => {
            if ($scope.timeSlots.haveSlot()) {
                for (let i = 0; i < $scope.timeSlots.all.length; i ++) {
                    if ($scope.timeSlots.all[i].default) {
                        $scope.timeSlot = $scope.timeSlots.all[i];
                        Utils.safeApply($scope);
                        return;
                    }
                }
            }
        });

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

        function filterCourses() {
            $scope.structure.calendarItems.all.map((item,i) =>{
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
            let arrayIds : string[] =[];
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

            $scope.calendarLoader.display();
            $scope.structure.calendarItems.all = [];

            //add groups to classes
            if (model.me.type === USER_TYPES.personnel || model.me.type === USER_TYPES.teacher)
                $scope.params.group.map(g => {
                    let isInClass = false;
                    $scope.params.deletedGroups.classes.map(c => {
                        if (c.id === g.id ){
                            isInClass = true;
                        }
                    });

                    if(!isInClass  && g.type_groupe !== 0 && g.users ){
                        $scope.params.deletedGroups.classes.push(g);
                    }

                    $scope.params.deletedGroups.classes.map(c => {
                        $scope.params.deletedGroups.groupsDeleted.map((gg,index : number) => {
                            if(gg.id === c.id)
                                $scope.params.deletedGroups.groupsDeleted.splice(index,1);

                        });
                    });
                });

            if($scope.params.group.length > 0) {
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
                        if(g.id == gg.id){
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
                if(!isInClass){
                    $scope.params.deletedGroups.classes.push(g);
                }
            });

            await $scope.structure.calendarItems.sync($scope.structure, $scope.params.user, $scope.params.group, $scope.structures, $scope.isAllStructure);

            filterCourses();
            $scope.calendarLoader.hide();
            await Utils.safeApply($scope);

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
         * @param teacher the selected class/group
         */
        $scope.selectClass = async (model : string, group : Group) : Promise<void> => {
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
                let type = occurrence? 'occurrence' : 'course' ;
                let url = `/edit/${type}/${itemId}`;
                if(start && end) url += `/${start.format('x')}/${end.format('x')}`;
                $scope.goTo(url);
            }
        };

        template.open('homePagePopUp', 'main/occurrence-or-course-edit-popup');
        template.open('deletePagePopUp', 'main/delete-courses-popup');

        $scope.chooseTypeEdit = (itemId,  start?, end?, isDrag?) => {
            $scope.courseToEdit = _.findWhere(_.pluck($scope.structure.calendarItems.all, 'course'), {_id: itemId});
            $scope.paramEdition = {
                start : start,
                end : end
            };
            $scope.courseToEdit.isDragged = (isDrag);
            $scope.editOccurrence = true;
            $scope.occurrenceDate = $scope.courseToEdit.getNextOccurrenceDate(Utils.getFirstCalendarDay());

            if($scope.ableToChooseEditionType($scope.courseToEdit,start)){
                $scope.show.home_lightbox = true;
            }else{
                $scope.calendarUpdateItem(itemId, $scope.paramEdition.start, $scope.paramEdition.end);
            }
            Utils.safeApply($scope);
        };

        $scope.cancelEditionLightbox = () =>{
            $scope.show.home_lightbox = false;
            model.calendar.setDate(model.calendar.firstDay)
            Utils.safeApply($scope);
        };
        $scope.cancelDeleteLightbox = () =>{
            $scope.show.delete_lightbox = false;
            Utils.safeApply($scope);
        }

        $scope.ableToChooseEditionType = (course: Course,start):boolean => {
            let now = moment();
            if(!start){
                start = moment(course.startDate);
            }
            let previousOccurrence = course.getPreviousOccurrenceDate(start);
            let atLeastOnePreviousOccurence = moment(previousOccurrence).isAfter(moment(start));
            let upcomingOccurrence = course.getNextOccurrenceDate(start);
            let atLeastOneOccurence = moment(course.getNextOccurrenceDate(upcomingOccurrence)).isBefore(moment(start)) ;


            let newDay = moment(start).format("DD");
            let previousDay= moment(course.startDate).format("DD");
            return course.isRecurrent() &&
                ((  atLeastOneOccurence  && moment(upcomingOccurrence).isAfter(now))
                    || ( moment(previousOccurrence).isAfter(now)  && atLeastOnePreviousOccurence )
                    || (newDay != previousDay && moment(course.getNextOccurrenceDate(upcomingOccurrence)).isAfter(start))
                    || (moment(start).isAfter(now) && atLeastOneOccurence ));
        };

        $scope.getSimpleDateFormat = (date) => {
            return moment(date).format('YYYY-MM-DD');
        };
        $scope.getSimpleFRDateFormat = (date) => {
            return moment(date).format('DD/MM/YYYY');
        };

        let initTriggers = (init ?: boolean) => {
            if(init){
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
                switch(model.calendar.days.all[0].name){
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
                    .mousemove((e) => topPositionnement = UtilDragAndDrop.drag(e, $dragging))
                    .mouseenter((e) => topPositionnement = UtilDragAndDrop.drag(e, $dragging));

                var mousemoveCalendarHr = (e) => topPositionnement = UtilDragAndDrop.drag(e, $dragging);
                $('body').off('mousemove', 'calendar hr', mousemoveCalendarHr);
                $('body').on('mousemove', 'calendar hr', mousemoveCalendarHr);

                var mouseupCalendar = (e) => {
                    if(e.which === 3){
                        return;
                    }
                    if ($dragging) {
                        let coursItem;
                        $('.timeslot').removeClass('selecting-timeslot');
                        if(model.calendar.increment === "day"){
                            let dayOfWeek = getDayOfWeek();

                            coursItem = UtilDragAndDrop.drop(e, $dragging, topPositionnement, startPosition,dayOfWeek);
                        }
                        else{
                            coursItem = UtilDragAndDrop.drop(e, $dragging, topPositionnement, startPosition);
                        }
                        if (coursItem) $scope.chooseTypeEdit(coursItem.itemId, coursItem.start, coursItem.end, true);
                        initVar();
                    }
                };
                $('body').off('mouseup', 'calendar', mouseupCalendar);
                $('body').on('mouseup', 'calendar', mouseupCalendar);

                var mousedownCalendarScheduleItem = (e) => {
                    if(e.which === 3){
                        return;
                    }
                    if($(e.target).hasClass("notpast") || $(e.target).hasClass("inside-schedule")) {
                        $dragging = UtilDragAndDrop.takeSchedule(e, $timeslots);
                        startPosition = $dragging.offset();
                        let calendar = $('calendar');
                        calendar.off('mousemove', (e) => UtilDragAndDrop.moveScheduleItem(e, $dragging));
                        calendar.on('mousemove', (e) => UtilDragAndDrop.moveScheduleItem(e, $dragging));
                    }else{
                        return;
                    }
                };

                $('body').off('mousedown', 'calendar .schedule-item', mousedownCalendarScheduleItem);
                $('body').on('mousedown', 'calendar .schedule-item', mousedownCalendarScheduleItem);
                $('body calendar .schedule-item').css('cursor', 'move');


                var mouseDownEditIcon = (e) => {

                    if (e.which === 1) {//check left click
                        e.stopPropagation();
                        $scope.chooseTypeEdit($(e.currentTarget).data('id'),moment(e.target.children[0].innerHTML),moment(e.target.children[1].innerHTML));
                        $(e.currentTarget).unbind('mousedown');
                    }
                };
                var prepareToDelete = (event) =>{
                    let start =  moment( event.currentTarget.children[0].children[1].children[0].children[0].innerHTML);

                    if(event.which == 3 && !$(event.currentTarget).hasClass("selected") && start.isAfter(moment())) {
                        event.stopPropagation();
                        let itemId = $(event.currentTarget).data("id");
                        $(event.currentTarget).addClass("selected");
                        let courseToDelete = _.findWhere(_.pluck($scope.structure.calendarItems.all, 'course'), {_id: itemId});


                        $scope.editOccurrence = true;
                        let occurrenceDate = courseToDelete.getNextOccurrenceDate(Utils.getFirstCalendarDay());
                        if($scope.ableToChooseEditionType(courseToDelete,start)){
                            courseToDelete.occurrenceDate =  occurrenceDate
                        }

                        (!courseToDelete.timeToDelete) ?  courseToDelete.timeToDelete = [] : courseToDelete.timeToDelete;

                        courseToDelete.timeToDelete.push(moment(start).format("YYYY/MM/DD"));

                        $scope.params.coursesToDelete.push(courseToDelete)
                        $scope.params.coursesToDelete = $scope.params.coursesToDelete.sort().filter(function(el,i,a){return i===a.indexOf(el)})

                    }else if(event.which == 3 && !$(event.currentTarget).hasClass("selected") && start.isBefore(moment()) && $scope.chronoEnd) {
                        event.stopPropagation();
                        $scope.chronoEnd = false ;
                        setTimeout((function (){
                            $scope.chronoEnd = true;
                        }),100);
                        toasts.info("edt.cantDelete.courses");

                    }

                    Utils.safeApply($scope);
                };


                var cancelDelete = (event) =>{
                    let start =  moment( event.currentTarget.children[0].children[1].children[0].children[0].innerHTML);

                    if(event.which == 3 && $(event.currentTarget).hasClass("selected")) {
                        event.stopPropagation();
                        $(event.currentTarget).removeClass("selected");
                        let idToDelete =  $(event.currentTarget).data("id")
                        $scope.params.coursesToDelete.map((course,i) => {
                            if(course._id  === idToDelete){
                                let currentCourse = $scope.params.coursesToDelete[i];
                                if( currentCourse.timeToDelete.length > 1){
                                    currentCourse.timeToDelete.map((t,ii) => {
                                        if (moment(start).format("YYYY/MM/DD") === t){
                                            $scope.params.coursesToDelete[i].timeToDelete.splice(ii,1);
                                        }
                                    })

                                }else{
                                    $scope.params.coursesToDelete[i].timeToDelete = [];
                                    $scope.params.coursesToDelete.splice(i,1);
                                }
                            }
                        })

                    }
                    if(event.which == 3 && $(event.currentTarget).hasClass("cantDelete")) {
                        event.stopPropagation();
                        $(event.currentTarget).removeClass("cantDelete");
                    }
                    Utils.safeApply($scope);

                }

                //left click on icon
                $('body').off('mousedown', '.one.cell.edit-icone', mouseDownEditIcon);
                $('body').on('mousedown', '.one.cell.edit-icone', mouseDownEditIcon);
                $('body').on('mousedown', '.schedule-item-content', prepareToDelete);
                $('body').on('mousedown', '.schedule-item-content.selected', cancelDelete);
                $('body').on('mousedown', '.schedule-item-content.cantDelete', cancelDelete);


                /*    $('calendar .previous-timeslots').mousedown(()=> {initTriggers()});
                    $('calendar .next-timeslots').mousedown(()=> {initTriggers()});*/
            }
            // --End -- Calendar Drag and Drop
        };

        /**
         * Subscriber to directive calendar changes event
         */
        model.calendar.on('date-change'  , async function(){
            await $scope.syncCourses();
            initTriggers();
        });


        $scope.isNotPast = (item) =>{
            return(moment(item.startDate).isAfter(moment()));

        }
        $scope.openDeleteForm = () =>{
            $scope.show.delete_lightbox = true;
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

        $scope.deleteCourses = async () =>{
            $scope.show.delete_lightbox = false;
            $scope.params.coursesToDelete.map(async c => {
                orderDeletes(c)
                if(c.occurrenceDate){
                    await c.delete(c.timeToDelete);
                }
                else
                    await c.delete();

                $scope.syncCourses();
                Utils.safeApply($scope);
            });


        }
        $scope.updateDatas = async () => {
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
        $scope.toogleFilter = async function (filter : Group) : Promise<void> {
            $scope.calendarLoader.display();
            if (!$scope.isFilterActive(filter)) {
                $scope.params.group.push(filter);
            } else {
                let groups : Group[] = [filter];
                $scope.dropGroup(filter);
                await $scope.structure.calendarItems.getGroups(groups,$scope.params.deletedGroups);
                groups.splice(0,1);
                groups.forEach(group => {
                    groups.push($scope.structure.groups.all.filter(res => group.name == res.name)[0]);
                });
                groups.forEach(
                    group => $scope.dropGroup(group)
                );
            }
            await $scope.updateDatas();
            $scope.calendarLoader.hide();
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
        $scope.initDateCreatCourse = (param?, course?: Course) => {

            if(model.calendar.newItem || (param && param["beginning"] && param["end"]) ) {
                let TimeslotInfo =  {
                    beginning : param ? param.beginning: model.calendar.newItem.beginning.format('x'),
                    end : param ? param.end : model.calendar.newItem.end.format('x')};
                let startTime = (moment.utc(TimeslotInfo["beginning"], 'x').add('hours',- moment().format('Z').split(':')[0])).minute(0).seconds(0).millisecond(0);

                let endTime = (moment.utc(TimeslotInfo["end"], 'x').add('hours',- moment().format('Z').split(':')[0])).minute(0).seconds(0).millisecond(0);

                let dayOfWeek=  moment(TimeslotInfo["beginning"], 'x').day();
                let roomLabel = course ? course.roomLabels[0] : '';

                $scope.courseOccurrenceForm = new CourseOccurrence(
                    dayOfWeek,
                    roomLabel,
                    startTime.toDate(),
                    endTime.toDate()
                );
                delete model.calendar.newItem;
                return  moment(TimeslotInfo["beginning"], 'x');
            }else {
                if(course && !course.is_recurrent) {
                    $scope.courseOccurrenceForm = new CourseOccurrence(
                        course.dayOfWeek,
                        course.roomLabels[0],
                        moment(course.startDate).utc().toDate(),
                        moment(course.endDate).utc().toDate()
                    );
                }else
                    $scope.courseOccurrenceForm = new CourseOccurrence();
                return moment();
            }
        };

        $scope.syncStructure($scope.structure);



        route({
            main:  () => {
                template.open('main', 'main');
                if(!$scope.pageInitialized)
                    setTimeout(function(){  initTriggers(true); }, 1000);

            },
            create:async () => {
                let startDate = $scope.initDateCreatCourse();
                const roundedDown = Math.floor(startDate.minute() / 15) * 15;
                startDate.minute(roundedDown).second(0);
                let endDate = moment(startDate).add(1, 'hours');

                $scope.params.group.sort((g,gg) =>{
                    if (g.displayName && !gg.displayName){
                        return -1;
                    }
                    else if(gg.displayName && !g.displayName){
                        return 1;
                    }else{
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

                template.open('main', 'manage-course');
                Utils.safeApply($scope);
            },
            edit: async  (params) => {
                $scope.course =  new Course();
                await $scope.course.sync(params.idCourse, $scope.structure);
                $scope.initDateCreatCourse( params, $scope.course );
                if (params.type === 'occurrence'){
                    $scope.occurrenceDate = $scope.courseToEdit.getNextOccurrenceDate(Utils.getFirstCalendarDay());
                    $scope.editOccurrence = true;
                    $scope.course.is_recurrent = false;
                }else{
                    $scope.editOccurrence = false;

                }
                template.open('main', 'manage-course');
                Utils.safeApply($scope);
            },
            importSts: () => {
                template.open('main', 'sniplet-sts');
            }
        });
    }]);

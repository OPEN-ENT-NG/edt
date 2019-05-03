import {_, Behaviours, idiom as lang, model, moment, ng, notify, template, angular} from 'entcore';
import {
    Course,
    CourseOccurrence, Exclusions,
    Group,
    Structure,
    Structures,
    Student,
    Teacher,
    USER_TYPES,
    UtilDragAndDrop,
    Utils
} from '../model';
import {Subject} from "../model/subject";
import http from "axios";



export let main = ng.controller('EdtController',
    ['$scope', 'route', '$location', async  ($scope, route, $location ) => {
        $scope.structures = new Structures();
        $scope.params = {
            user: [],
            group: [],
            oldGroup:[],
            oldUser: [],
            updateItem: null,
            dateFromCalendar: null
        };

        async function getMainStruct() {
            let {data} =  await http.get('/directory/user/4265605f-3352-4f42-8cef-18e150bbf6bf?_=1556865888485');
            model.me.idMainStructure = data.functions[0][1][0];
            $scope.structure = $scope.structures.first();
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
            home_lightbox : false
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
        $scope.syncStructure = async (structure: Structure) => {
            $scope.structure = structure;
            $scope.structure.eventer.once('refresh', () =>   Utils.safeApply($scope));
            await $scope.structure.sync(model.me.type === USER_TYPES.teacher);
            switch (model.me.type) {
                case USER_TYPES.student : {
                    $scope.params.group = _.map(model.me.classes, (groupid) => {
                        _.findWhere($scope.structure.groups.all, {id: groupid});
                    });
                    break;
                }

                case USER_TYPES.relative : {
                    if ($scope.structure.students.all.length > 0) {
                        $scope.params.group = _.map($scope.structure.students.all[0].classes, (groupid) => {
                            return _.findWhere($scope.structure.groups.all, {id: groupid});
                        });
                        $scope.currentStudent = $scope.structure.students.all[0];
                    }
                    break;
                }
            }
            if ($scope.structures.all.length > 1 && $scope.isTeacher()) {
                let allStructures = new Structure(lang.translate("all.structures.id"), lang.translate("all.structures.label"));
                if (allStructures && $scope.structures.all.filter(i => i.id == allStructures.id).length < 1){
                    $scope.structures.all.push(allStructures);
                }
            }
            if (!$scope.isPersonnel()) {
                $scope.syncCourses();
            } else {
                Utils.safeApply($scope);
            }
        };

        $scope.syncStructure($scope.structure);

        // async function syncAllStructure() {
        //
        // }

        $scope.switchStructure = (structure: Structure) => {

            if (structure.id != lang.translate("all.structures.id") &&
                ($scope.params.group.length !== 0 ||  $scope.params.user.length !== 0)) {
                $scope.syncStructure(structure);
                $scope.isAllStructure = false;

            }
            else if (structure.id == lang.translate("all.structures.id")) {
                // $scope.structure = structure;
                $scope.isAllStructure = true;
                $scope.syncCourses();

                // syncAllStructure();
                // let allStructures = [];
                //
                // console.log($scope.structures.all);
                // for (let i = 0; i < $scope.structures.all.length; i++) {
                //     allStructures = _.map($scope.structures.all[i].teachers.all, (teachers) => {
                //         allStructures.push(teachers);
                //     });
                // }
                // console.log(allStructures);
            };
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


        $scope.checkAccess = ()=> {return $scope.isPersonnel() || $scope.isTeacher() || ($scope.isRelative() && $scope.structures.all.length > 1)};
        $scope.checkTwelve = () => {
            return $scope.isStudent() || ($scope.isRelative() && $scope.structures.all.length < 2)
        };

        /**
         * Returns student group
         * @param {Student} user user group
         * @returns {Group}
         */
        $scope.getStudentGroup = (user: Student): Group =>  _.findWhere($scope.structure.groups.all, { externalId: user.classes[0] });

        /**
         * Get timetable bases on $scope.params object
         * @returns {Promise<void>}
         */
        $scope.syncCourses = async () => {

            if (!isUpdateData && $scope.isRelative()) {

                let arrayIds = model.me.classes;
                let groups = $scope.structure.groups.all;
                $scope.params.group = groups.filter((item) => arrayIds.indexOf(item.id) > -1);
            }

            if (!isUpdateData && $scope.isTeacher()) {
                let found = _.find($scope.structure.teachers.all, function (teacher) {
                    return teacher.id == model.me.userId;
                });
                if (found && $scope.params.user.indexOf(found) == -1)
                    $scope.params.user.push(found);
            }

            $scope.calendarLoader.display();
            $scope.structure.calendarItems.all = [];

            //add groups to classes
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
                    $scope.params.deletedGroups.groupsDeleted.map((gg,index) => {
                        if(gg.id === c.id)
                            $scope.params.deletedGroups.groupsDeleted.splice(index,1);

                    });
                });
            });




            if($scope.params.group.length > 0){
                await $scope.structure.calendarItems.getGroups($scope.params.group,$scope.params.deletedGroups);
                $scope.params.deletedGroups.groupsDeleted.map(g =>{
                    $scope.params.group.map(gg  => {
                        if(g.id == gg.id){
                            $scope.params.group = _.without($scope.params.group, gg);
                        }
                    })
                })
            }
            //add classes after filter groups
            $scope.params.group.map(g => {
                let isInClass = false;

                $scope.params.deletedGroups.classes.map(c => {
                    if (c.id === g.id){
                        isInClass = true;
                    }
                });
                if(!isInClass){
                    $scope.params.deletedGroups.classes.push(g);
                }
            });

            await $scope.structure.calendarItems.sync($scope.structure, $scope.params.user, $scope.params.group, $scope.structures, $scope.isAllStructure);

            $scope.calendarLoader.hide();
            await   Utils.safeApply($scope);

        };

        if ($scope.isRelative()) {
            $scope.currentStudent = null;
        }


        $scope.dropTeacher = (teacher: Teacher): void => {
            $scope.params.user = _.without($scope.params.user, teacher);
        };

        /**
         * Drop a group in groups list
         * @param {Group} group Group to drop
         */
        $scope.dropGroup = (group: Group): void => {

            if(group.type_groupe != 0 || group.type_groupe === undefined)
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
            }
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
        $scope.chooseTypeEdit = (itemId,  start?, end?, isDrag?) => {
            $scope.courseToEdit = _.findWhere(_.pluck($scope.structure.calendarItems.all, 'course'), {_id: itemId});
            $scope.paramEdition = {
                start : start,
                end : end
            };
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
            Utils.safeApply($scope);
        };

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
            //return true;
            return course.isRecurrent() &&
                ((  atLeastOneOccurence  && moment(upcomingOccurrence).isAfter(now))
                    || ( moment(previousOccurrence).isAfter(now)  && atLeastOnePreviousOccurence )
                    || (newDay != previousDay && moment(course.getNextOccurrenceDate(upcomingOccurrence)).isAfter(start)));
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
            //  if ( $scope.isTeacher() || $scope.isStudent())
            //  return ;
            model.calendar.eventer.off('calendar.create-item');
            model.calendar.eventer.on('calendar.create-item', () => {
                if ($location.path() !== '/create') {
                    $scope.createCourse();
                }
            });


            Utils.safeApply($scope);

            // --Start -- Calendar Drag and Drop

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
                    if ($dragging) {
                        $('.timeslot').removeClass('selecting-timeslot');
                        let coursItem = UtilDragAndDrop.drop(e, $dragging, topPositionnement, startPosition);
                        if (coursItem) $scope.chooseTypeEdit(coursItem.itemId, coursItem.start, coursItem.end);
                        initVar();
                    }
                };
                $('body').off('mouseup', 'calendar', mouseupCalendar);
                $('body').on('mouseup', 'calendar', mouseupCalendar);

                var mousedownCalendarScheduleItem = (e) => {
                    $dragging = UtilDragAndDrop.takeSchedule(e, $timeslots);
                    startPosition = $dragging.offset();
                    let calendar = $('calendar');
                    calendar.off('mousemove', (e) => UtilDragAndDrop.moveScheduleItem(e, $dragging));
                    calendar.on('mousemove', (e) => UtilDragAndDrop.moveScheduleItem(e, $dragging));
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
                //left click on icon
                $('body').off('mousedown', '.one.cell.edit-icone', mouseDownEditIcon);
                $('body').on('mousedown', '.one.cell.edit-icone', mouseDownEditIcon);


                /*    $('calendar .previous-timeslots').mousedown(()=> {initTriggers()});
                    $('calendar .next-timeslots').mousedown(()=> {initTriggers()});*/
            }
            // --End -- Calendar Drag and Drop
        };
        model.calendar.on('date-change'  , async function(){
            await $scope.syncCourses();
            initTriggers();


        });      /**
         * Subscriber to directive calendar changes event
         */

        $scope.updateDatas = async () => {
            isUpdateData = true;
            if(!angular.equals($scope.params.oldGroup, $scope.params.group)){
                console.log("pp")

                if($scope.params.group.length > $scope.params.oldGroup.length){
                }
                await $scope.syncCourses();
                initTriggers();
                $scope.params.oldGroup = angular.copy($scope.params.group);
            }

            if(!angular.equals($scope.params.oldUser, $scope.params.user)){
                console.log("xx")

                await $scope.syncCourses();
                initTriggers();
                $scope.params.oldUser = angular.copy($scope.params.user);
            }
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
        $scope.initDateCreatCourse = (param?, course?: Course) => {

            if(model.calendar.newItem || (param && param["beginning"] && param["end"]) ) {
                let TimeslotInfo =  {
                    beginning : param ? param.beginning: model.calendar.newItem.beginning.format('x'),
                    end : param ? param.end : model.calendar.newItem.end.format('x')};
                let startTime = (moment.utc(TimeslotInfo["beginning"], 'x').add('hours',- moment().format('Z').split(':')[0])).minute(0).seconds(0).millisecond(0);

                startTime = $scope.getSummerTimeIfMandatory(startTime);
                let endTime = (moment.utc(TimeslotInfo["end"], 'x').add('hours',- moment().format('Z').split(':')[0])).minute(0).seconds(0).millisecond(0);
                endTime = $scope.getSummerTimeIfMandatory(endTime);

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

        $scope.getSummerTimeIfMandatory = (time) =>{
            let  summerDay = moment([2011,3,1]);
            let winterDay = moment ([2011,9,28]);
            if(moment(time).format("MM") >= moment(summerDay).format("MM") &&
                moment(time).format("MM") < moment(winterDay).format("MM") ){
                time = moment(time).subtract(1,'hours');
            }else if(moment(time).format("MM") ===  moment(winterDay).format("MM") && moment(time).format("dd") <= moment(winterDay).format("dd") ){
                time =  moment(time).subtract(1,'hours');

            }
            return time;
        };
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
            }
        });
    }]);
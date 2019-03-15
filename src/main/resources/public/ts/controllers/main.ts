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
        let isUpdateData = false
        $scope.structures.sync();
        $scope.params.deletedGroups = [];
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
        $scope.displayAllClass = async () =>{
          await $scope.structure.groups.sync($scope.structure.id,model.me.type === USER_TYPES.teacher);
          await Utils.safeApply($scope);
        };

        /**
         * Synchronize a structure.
         */
        $scope.syncStructure = async (structure: Structure) => {
            $scope.structure = structure;
            $scope.structure.eventer.once('refresh', () =>   Utils.safeApply($scope));
            await $scope.structure.sync();
            switch (model.me.type) {
                case USER_TYPES.student : {
                    $scope.params.group = _.map(model.me.classes, (groupid) => {
                        return _.findWhere($scope.structure.groups.all, {id: groupid});
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
            if (!$scope.isPersonnel()) {
                $scope.syncCourses();
            } else {
                Utils.safeApply($scope);
            }
        };

        $scope.syncStructure($scope.structure);

        $scope.switchStructure = (structure: Structure) => {
            $scope.syncStructure(structure);
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
            if($scope.params.group.length > 0){
                   await $scope.structure.calendarItems.getGroups($scope.params.group);
                   $scope.params.deletedGroups.map(g =>{
                        $scope.params.group.map(gg  => {
                            if(g.id == gg.id){
                                $scope.params.group = _.without($scope.params.group, gg);
                            }
                        })
                   })
            }
            await $scope.structure.calendarItems.sync($scope.structure, $scope.params.user, $scope.params.group);
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
            $scope.params.deletedGroups.push(group);
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

        $scope.chooseTypeEdit = (itemId,  start?, end?, isDrag?) => {

            $scope.courseToEdit = _.findWhere(_.pluck($scope.structure.calendarItems.all, 'course'), {_id: itemId});
            $scope.paramEdition = {
                start : start,
                end : end
            };
            $scope.editOccurrence = true;
            // if(isDrag){
            //     $scope.editOccurrence = isDrag;
            // }
            $scope.occurrenceDate = $scope.courseToEdit.getNextOccurrenceDate(Utils.getFirstCalendarDay());

            if($scope.ableToChooseEditionType($scope.courseToEdit,end)){

                $scope.show.home_lightbox = true;
                template.open('homePagePopUp', 'main/occurrence-or-course-edit-popup');

            }else{
                $scope.calendarUpdateItem(itemId, $scope.paramEdition.start, $scope.paramEdition.end);
                //$scope.show.home_lightbox = true;
                // template.open('homePagePopUp', 'main/occurrence-or-course-edit-popup');
            }
            Utils.safeApply($scope);
        };

        $scope.cancelEditionLightbox = () =>{
            $scope.show.home_lightbox = false;
            template.close('homePagePopUp');

            Utils.safeApply($scope);
        };

        $scope.ableToChooseEditionType = (course: Course,end):boolean => {
            let now = moment();
            if(!end){
                end = moment(course.startDate);
            }
            let upcomingOccurrence = course.getNextOccurrenceDate(end);
            let moreThenOneOccurrenceLeft = moment(course.getNextOccurrenceDate(upcomingOccurrence)).isBefore(moment(end)) ;

            let isLastOccurence = moment(course.getLastOccurrence().endTime).format('YYYY-MM-DD') != upcomingOccurrence;


            return course.isRecurrent() && moreThenOneOccurrenceLeft && isLastOccurence && moment(upcomingOccurrence).isAfter(now);
        };

        $scope.getSimpleDateFormat = (date) => {
            return moment(date).format('YYYY-MM-DD');
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

            if(model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.manage)) {
                let $dragging = null;
                let topPositionnement = 0;
                let startPosition = {top: null, left: null};
                let $timeslots= $('calendar .timeslot');
                $timeslots.removeClass( 'selecting-timeslot' );
                let initVar = () => {
                    $dragging = null;
                    topPositionnement = 0;
                    $timeslots.removeClass( 'selecting-timeslot' );
                    $('calendar .selected-timeslot').remove();
                };



                $timeslots
                    .mousemove((e) =>topPositionnement = UtilDragAndDrop.drag(e, $dragging))
                    .mouseenter((e) =>topPositionnement = UtilDragAndDrop.drag(e, $dragging));

                $('calendar hr')
                    .mousemove( (e) =>topPositionnement = UtilDragAndDrop.drag(e, $dragging));






                $('calendar')
                    .mouseup(  (e) => {

                        if($dragging){
                            $('.timeslot').removeClass( 'selecting-timeslot' );
                            let coursItem = UtilDragAndDrop.drop(e, $dragging, topPositionnement, startPosition);
                            if(coursItem) $scope.chooseTypeEdit(coursItem.itemId, coursItem.start, coursItem.end,true);
                            initVar();
                        }
                    });

                $('calendar .schedule-item')
                    .css('cursor','move')
                    .mousedown((e)=>  {
                        $dragging = UtilDragAndDrop.takeSchedule(e,$timeslots);
                        startPosition = $dragging.offset();
                        let calendar = $('calendar');
                        calendar.off( 'mousemove', (e)=> UtilDragAndDrop.moveScheduleItem(e, $dragging));
                        calendar.on( 'mousemove', (e)=> UtilDragAndDrop.moveScheduleItem(e, $dragging));
                    });


                //left click on icon
                $('.one.cell.edit-icone')
                    .mousedown((e) => {
                        if(e.which === 1) {//check left click
                            e.stopPropagation();
                            $scope.chooseTypeEdit($(e.currentTarget).data('id'));
                            $(e.currentTarget).unbind('mousedown');
                        }
                    });



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
                if($scope.params.group.length > $scope.params.oldGroup.length){
                    $scope.params.deletedGroups = [];
                }
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
                }
                template.open('main', 'manage-course');
                Utils.safeApply($scope);
            }
        });
    }]);
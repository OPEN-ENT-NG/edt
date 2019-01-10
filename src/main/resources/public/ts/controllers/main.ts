import {_, Behaviours, idiom as lang, model, moment, ng, notify, template} from 'entcore';
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
            updateItem: null,
            dateFromCalendar: null
        };

        $scope.structures.sync();
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
            if ($scope.params.user  && $scope.params.user.length > 0
                && $scope.params.group && $scope.params.group.length > 0) {

                notify.error('');
            } else  {
                if ($scope.isRelative()) {
                    let arrayIds = model.me.classes;
                    let groups = $scope.structure.groups.all;
                    $scope.params.group = groups.filter((item) => arrayIds.indexOf(item.id) > -1);
                }
                $scope.calendarLoader.display();
                $scope.structure.calendarItems.all = [];
                await $scope.structure.calendarItems.sync($scope.structure, $scope.params.user, $scope.params.group);
                $scope.calendarLoader.hide();
                await   Utils.safeApply($scope);
            }
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
            $scope.params.group = _.without($scope.params.group, group);
        };
        /**
         * Course creation
         */
        $scope.createCourse = () => {
            const edtRights = Behaviours.applicationsBehaviours.edt.rights;
            if (model.me.hasWorkflow(edtRights.workflow.create)) {
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

        $scope.chooseTypeEdit = (itemId,  start?, end?) => {
            $scope.courseToEdit = _.findWhere(_.pluck($scope.structure.calendarItems.all, 'course'), {_id: itemId});
            $scope.paramEdition = {
                start : start,
                end : end
            };
            $scope.editOccurrence = false;
            $scope.occurrenceDate = $scope.courseToEdit.getNextOccurrenceDate(Utils.getFirstCalendarDay());
            if($scope.ableToChooseEditionType($scope.courseToEdit)){
                $scope.show.home_lightbox = true;
                template.open('homePagePopUp', 'main/occurrence-or-course-edit-popup');
            }else{
                $scope.calendarUpdateItem(itemId, $scope.paramEdition.start, $scope.paramEdition.end);
            }
            Utils.safeApply($scope);
        };

        $scope.cancelEditionLightbox = () =>{
            $scope.show.home_lightbox = false;

            Utils.safeApply($scope);
        };

        $scope.ableToChooseEditionType = (course: Course):boolean => {
            let now = moment();
            let upcomingOccurrence = course.getNextOccurrenceDate(now);
            let moreThenOneOccurrenceLeft = moment(course.getNextOccurrenceDate(upcomingOccurrence)).isBefore(moment(course.endDate)) ;
            return course.isRecurrent() && moreThenOneOccurrenceLeft && moment($scope.occurrenceDate).isAfter(now);
        };

        $scope.getSimpleDateFormat = (date) => {
            return moment(date).format('YYYY-MM-DD');
        };

        let initTriggers = (init ?: boolean) => {
            if(init){
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


       //     Utils.safeApply($scope);

            // --Start -- Calendar Drag and Drop
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

            $('calendar div.edit-icone')
                .css('cursor','pointer')
                .mousedown((e) => {
                    e.stopPropagation();
                    $scope.chooseTypeEdit($(e.currentTarget).data('id'));
                    $(e.currentTarget).unbind('mousedown');
                });

            $('calendar')
                .mouseup(  (e) => {

                    if($dragging){
                        $('.timeslot').removeClass( 'selecting-timeslot' );
                        let coursItem = UtilDragAndDrop.drop(e, $dragging, topPositionnement, startPosition);
                        if(coursItem) $scope.chooseTypeEdit(coursItem.itemId, coursItem.start, coursItem.end);
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

                /*    $('calendar .previous-timeslots').mousedown(()=> {initTriggers()});
                    $('calendar .next-timeslots').mousedown(()=> {initTriggers()});*/
            // --End -- Calendar Drag and Drop
        };
        model.calendar.on('date-change'  , async function(){
          //  console.log("date*-change");
           await $scope.syncCourses();
           initTriggers();


        });      /**
         * Subscriber to directive calendar changes event
         */


        $scope.initDateCreatCourse = (param?, course?: Course) => {

            if(model.calendar.newItem || (param && param["beginning"] && param["end"]) ) {
                let TimeslotInfo =  {
                    beginning : param ? moment( param.beginning, 'x') : model.calendar.newItem.beginning.subtract(2, 'hours') ,
                    end : param ? moment( param.end, 'x') : model.calendar.newItem.end.subtract(2, 'hours') };

                let startTime = moment(TimeslotInfo["beginning"]).minute(0).seconds(0).millisecond(0);
                let endTime = moment(TimeslotInfo["end"]).minute(0).seconds(0).millisecond(0);
                let dayOfWeek=  moment(TimeslotInfo["beginning"]).day();
                let roomLabel = course ? course.roomLabels[0] : '';

                $scope.courseOccurrenceForm = new CourseOccurrence(
                    dayOfWeek,
                    roomLabel,
                    startTime.toDate(),
                    endTime.toDate()
                );
                delete model.calendar.newItem;
                return  moment(TimeslotInfo["beginning"]).subtract(2, 'hours');
            }else {
                if(course && !course.is_recurrent) {
                    $scope.courseOccurrenceForm = new CourseOccurrence(
                        course.dayOfWeek,
                        course.roomLabels[0],
                        moment(course.startDate).toDate(),
                        moment(course.endDate).toDate()
                    );
                }else
                    $scope.courseOccurrenceForm = new CourseOccurrence();
                return moment();
            }
        };
        route({
            main:  () => {
                $scope.syncCourses();
                template.open('main', 'main');
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
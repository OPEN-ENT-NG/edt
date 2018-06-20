import { ng, template, notify, moment, idiom as lang, _, Behaviours, model } from 'entcore';
import {Structures, USER_TYPES, Course, Student, Group, Structure, Teacher} from '../model';



export let main = ng.controller('EdtController',
    ['$scope', 'route', '$location', async function ($scope, route, $location) {
        $scope.structures = new Structures();
        $scope.draggedItem ;
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
        $scope.calendarLoader = {
            show: false,
            display: () => {
                $scope.calendarLoader.show = true;
                $scope.safeApply();
            },
            hide: () => {
                $scope.calendarLoader.show = false;
                $scope.safeApply();
            }
        };

        /**
         * Synchronize a structure.
         */
        $scope.syncStructure = async (structure: Structure) => {
            $scope.structure = structure;
            $scope.structure.eventer.once('refresh', () => $scope.safeApply());
            await $scope.structure.sync();
            switch (model.me.type) {
                case USER_TYPES.teacher : {
                    $scope.params.user = [model.me.userId];
                }
                    break;
                case USER_TYPES.student : {
                    $scope.params.group = _.map(model.me.classes, (groupid) => {
                        return _.findWhere($scope.structure.groups.all, {id: groupid});
                    });
                }
                    break;
                case USER_TYPES.relative : {
                    if ($scope.structure.students.all.length > 0) {
                        $scope.params.group = _.map($scope.structure.students.all[0].classes, (groupid) => {
                            return _.findWhere($scope.structure.groups.all, {id: groupid});
                        });
                        $scope.currentStudent = $scope.structure.students.all[0];
                    }
                }
            }
            if (!$scope.isPersonnel()) {
                $scope.getTimetable();
            } else {
                $scope.safeApply();
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
        $scope.getStudentGroup = (user: Student): Group => {
            return _.findWhere($scope.structure.groups.all, { externalId: user.classes[0] });
        };

        /**
         * Get timetable bases on $scope.params object
         * @returns {Promise<void>}
         */
        $scope.getTimetable = async () => {
            if ($scope.params.user  && $scope.params.user.length > 0
                && $scope.params.group && $scope.params.group.length > 0) {
                notify.error('');
            } else  {
                $scope.calendarLoader.display();
                $scope.structure.courses.all = [];
                await $scope.structure.courses.sync($scope.structure, $scope.params.user, $scope.params.group);
                $scope.calendarLoader.hide();
                $scope.safeApply();
                initTriggers();

            }
        };

        $scope.getTeacherTimetable = () => {
            $scope.params.group = [];
            $scope.params.user = [model.me.userId ];
            $scope.getTimetable();
        };

        if ($scope.isRelative()) {
            $scope.currentStudent = null;
        }

        $scope.safeApply = (): Promise<any> => {
            return new Promise((resolve) => {
                let phase = $scope.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (resolve && (typeof(resolve) === 'function')) {
                        resolve();
                    }
                } else {
                    if (resolve && (typeof(resolve) === 'function')) {
                        $scope.$apply(resolve);
                    } else {
                        $scope.$apply();
                    }
                }
            });
        };
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
            $scope.safeApply();
        };

        $scope.translate = (key: string) => lang.translate(key);

        $scope.calendarUpdateItem = (item) => {
            $scope.params.updateItem =item;
            $scope.goTo('/create');
        };

        $scope.calendarDropItem = (item) => {
            $scope.calendarUpdateItem(item);
        };

        $scope.calendarResizedItem = (item) => {
            $scope.calendarUpdateItem(item);
        };



        let initTriggers = () => {
            model.calendar.eventer.off('calendar.create-item');
            model.calendar.eventer.on('calendar.create-item', () => {
                if ($location.path() !== '/create') {
                    $scope.createCourse();
                }
            });
            let $dragging = null;
            let topPositionnement=0;
            let $mouseInitial={};
            let $positionSchedule={
                top : null,
                left :null
            };
            let $positionShadowSchedule = {
                top : null,
                left :null
            };
            let $initialCss = null ;
            $('.timeslot').removeClass( 'selecting-timeslot' );
            let initVar = () => {
                $dragging = null;
                $mouseInitial={};
                $positionShadowSchedule = {
                    top : null,
                    left :null
                };
                $positionSchedule={
                    top : null,
                    left :null};
                $initialCss = null ;
            };


            $(document.body).on("mousemove", function(e) {
                if ($dragging) {
                    $positionSchedule = {
                        top: e.pageY - $dragging.height()/2,
                        left: e.pageX - $dragging.width()/2
                    };
                    $dragging.offset($positionSchedule);
                }
            });
            $('.timeslot')
                .on("mousemove",(e) => drag(e) )
                .mouseenter((e) => drag(e) );

            $('hr').on('mouseover', (e) => drag(e) );
            $('.schedule-item').css('cursor','move')
                .mousedown((e)=>{
                $dragging = $(e.currentTarget);
                $('.timeslot').addClass( 'selecting-timeslot' );
                $mouseInitial = {
                    x: e.pageX,
                    y: e.pageY
                };
                $(document).mousedown((e) => {return false;})
            });




            $(document.body).on("mouseup", function (e) {
                $('.timeslot').removeClass( 'selecting-timeslot' );
                drop(e);
                initVar();
            });
            let drag = (e) => {
                if($dragging){
                    $('.selected-timeslot').remove();
                    let curr = $(e.currentTarget);
                    $positionSchedule = {
                        top: e.pageY - $dragging.height()/2,
                        left: e.pageX - $dragging.width()/2
                    };
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
                    let top = Math.floor($dragging.height()/2);
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
                    topPositionnement = getTopPositionnement();
                    if($(prev).prop("tagName") === 'HR' &&  notFound === false ) {
                         $(prev).before(`<div class="selected-timeslot" style="height: ${$dragging.height()}px; top:-${topPositionnement}px;"></div>`);
                    }else if( i >= currDivHr.length && notFound === true ){
                         $(next).after(`<div class="selected-timeslot" style="height: ${$dragging.height()}px; top:-${topPositionnement}px;"></div>`);
                    }else{
                         $(prev).append(`<div class="selected-timeslot"  style="height: ${$dragging.height()}px; top:-${topPositionnement}px;"></div>`);
                    }
                }
            };
            let getTopPositionnement = () => {
                let top = Math.floor($dragging.height()/2);
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
            let getCalendarAttributes=( selectedTimeslot )=>{
                let day;

                let indexHr = $(selectedTimeslot).prev('hr').index();
               let dayOfweek = $(selectedTimeslot).parents('div.day').index();
               day = model.calendar.days.all[dayOfweek];
               let timeslot = model.calendar.timeSlots.all[$(selectedTimeslot).parents('.timeslot').index()];
               let startCourse = (day.date.hour(timeslot.beginning).minute(0).second(0)).subtract(15 * (indexHr+1)  ,'minutes').add( 15 * (topPositionnement /10),'minutes' );
               let endCourse = ( day.date.hour(timeslot.end).minute(0).second(0)).subtract(15 * (indexHr+1)  ,'minutes').add( 15 * (topPositionnement /10),'minutes' );
               console.log(startCourse, endCourse);
               $scope.calendarUpdateItem($scope.draggedItem);
            };
            let drop = (e) => {
                if($dragging ){
                    let selected_timeslot  = $('.selected-timeslot');
                    $positionShadowSchedule = selected_timeslot.offset();
                    getCalendarAttributes(selected_timeslot);
                    $dragging.offset($positionShadowSchedule);
                    selected_timeslot.remove();
                    $(document).unbind("mousedown");
                }
            }
        };

        initTriggers();

        /**
         * Subscriber to directive calendar changes event
         */
        $scope.$watch( () => {return  model.calendar.firstDay}, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if (moment(oldValue).format('DD/MM/YYYY') !== moment(newValue).format('DD/MM/YYYY')) {
                    $scope.getTimetable();
                }
            }
        }, true);


        $scope.$watch( () => {return  model.calendar.increment}, function (newValue, oldValue) {
            if (newValue !== oldValue) {

                $scope.getTimetable();
            }
        }, true);
        $scope.$watch( () => {return  $scope.params.user}, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if(newValue.length >0) $scope.params.group = [];
                $scope.getTimetable();
            }
        }, true);
        $scope.$watch( () => {return  $scope.params.group}, async function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if(newValue.length > 0)  $scope.params.user = [];
                $scope.getTimetable();
            }
        }, true);
        route({
            main: () => {
                template.open('main', 'main');
                $scope.getTimetable();
            },
            create: () => {
                let startDate = new Date();
                let endDate = new Date();
                if (model && model.calendar && model.calendar.newItem) {
                    let dateFromCalendar = model.calendar.newItem;
                    if (dateFromCalendar.beginning)
                        startDate = dateFromCalendar.beginning;
                    if (dateFromCalendar.end)
                        endDate = dateFromCalendar.end ;
                    $scope.params.dateFromCalendar = dateFromCalendar;
                }
                if ($scope.params.updateItem) {

                    $scope.course = new Course($scope.params.updateItem);
                }
                else {
                    $scope.course = new Course({
                        teachers: [],
                        groups: [],
                        courseOccurrences: [],
                        startDate: startDate,
                        endDate: endDate,
                    }, startDate, endDate);
                    if ($scope.structure && $scope.structures.all.length === 1)
                        $scope.course.structureId = $scope.structure.id;
                }
                template.open('main', 'course-create');
            }
        });
    }]);
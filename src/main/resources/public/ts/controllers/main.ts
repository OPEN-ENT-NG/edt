import { ng, template, notify, moment, idiom as lang, _, Behaviours, model } from 'entcore';
import {Structures, USER_TYPES, Course, Student, Group, Structure, Teacher, Utils, UtilDragAndDrop} from '../model';


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
        $scope.calendarLoader = {
            show: false,
            display: () => {
                $scope.calendarLoader.show = true;
                Utils.safeApply($scope);
            },
            hide: () => {
                $scope.calendarLoader.show = false;
                Utils.safeApply($scope);
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
        $scope.getStudentGroup = (user: Student): Group => {
            return _.findWhere($scope.structure.groups.all, { externalId: user.classes[0] });
        };

        /**
         * Get timetable bases on $scope.params object
         * @returns {Promise<void>}
         */
        $scope.syncCourses = async () => {
            if ($scope.params.user  && $scope.params.user.length > 0
                && $scope.params.group && $scope.params.group.length > 0) {
                notify.error('');
            } else  {
                $scope.calendarLoader.display();
                $scope.structure.courses.all = [];
                await $scope.structure.courses.sync($scope.structure, $scope.params.user, $scope.params.group);
                $scope.calendarLoader.hide();
                await   Utils.safeApply($scope);
                initTriggers();
            }
        };

        $scope.getTeacherTimetable = () => {
            $scope.params.group = [];
            $scope.params.user = [model.me.userId];
            $scope.syncCourses();
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

        $scope.calendarUpdateItem = (itemId, start?, end?) => {
            if(itemId) {
                $scope.params.updateItem = itemId;
                let url = `/edit/${itemId}`;
                if(start && end) url += `/${start.format('x')}/${end.format('x')}`;
                $scope.goTo(url);
            }
        };


        let initTriggers = () => {
            if ( $scope.isTeacher() || $scope.isStudent())
                return ;
            model.calendar.eventer.off('calendar.create-item');
            model.calendar.eventer.on('calendar.create-item', () => {
                if ($location.path() !== '/create') {
                    $scope.createCourse();
                }
            });
            // --Start -- Calendar Drag and Drop
            let $dragging = null;
            let topPositionnement = 0;

            let $timeslots= $('calendar .timeslot');
            $timeslots.removeClass( 'selecting-timeslot' );
            let initVar = () => {
                $dragging = null;
                topPositionnement = 0;
                $timeslots.removeClass( 'selecting-timeslot' );
            };

            $('calendar .schedule-item')
                .css('cursor','move')
                .mousedown((e)=>  {
                    $dragging = UtilDragAndDrop.takeSchedule(e,$timeslots);
                    let calendar = $('calendar');
                    calendar.off( 'mousemove', (e)=> UtilDragAndDrop.moveScheduleItem(e, $dragging));
                    calendar.on( 'mousemove', (e)=> UtilDragAndDrop.moveScheduleItem(e, $dragging));
                });

            $timeslots
                .mousemove((e) =>topPositionnement = UtilDragAndDrop.drag(e, $dragging))
                .mouseenter((e) =>topPositionnement = UtilDragAndDrop.drag(e, $dragging));

            $('calendar hr')
                .mousemove( (e) =>topPositionnement = UtilDragAndDrop.drag(e, $dragging));

            $('calendar div.edit-icone')
                .css('cursor','pointer')
                .mousedown((e) => {
                    e.stopPropagation();
                    $scope.calendarUpdateItem($(e.currentTarget).data('id'));
                    $(e.currentTarget).unbind('mousedown');
                });

            $('calendar')
                .mouseup(  (e) => {
                if($dragging){
                    $('.timeslot').removeClass( 'selecting-timeslot' );
                    let coursItem = UtilDragAndDrop.drop(e, $dragging, topPositionnement);
                    $scope.calendarUpdateItem(coursItem.itemId, coursItem.start, coursItem.end);
                    initVar();
                }
            });

            $('calendar .previous-timeslots').mousedown((e)=> {initTriggers()});
            $('calendar .next-timeslots').mousedown((e)=> {initTriggers()});
            // --End -- Calendar Drag and Drop
        };


        /**
         * Subscriber to directive calendar changes event
         */
        $scope.$watch( () => {return  model.calendar.firstDay}, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if (moment(oldValue).format('DD/MM/YYYY') !== moment(newValue).format('DD/MM/YYYY')) {
                    $scope.syncCourses();
                }
            }
        }, true);


        $scope.$watch( () => {return  model.calendar.increment}, function (newValue, oldValue) {
            if (newValue !== oldValue) {

                $scope.syncCourses();
            }
        }, true);
        $scope.$watch( () => {return  $scope.params.user}, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if(newValue.length > 0) $scope.params.group = [];
                $scope.syncCourses();
            }
        }, true);
        $scope.$watch( () => {return  $scope.params.group}, async function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if(newValue.length > 0)  $scope.params.user = [];
                $scope.syncCourses();
            }
        }, true);
        $scope.$watch( () => {return model.calendar.timeSlots.all}, async function (newValue, oldValue) {
            if (newValue !== oldValue) {
                setTimeout(function(){  initTriggers(); }, 1500);
            }
        }, true);
        route({
            main:  () => {
                $scope.syncCourses();
                template.open('main', 'main');
                Utils.safeApply($scope);
                setTimeout(function(){  initTriggers(); }, 1500);

            },
            create: () => {
                let startDate = moment();
                let endDate;
                if (model && model.calendar && model.calendar.newItem) {
                    startDate = moment(model.calendar.newItem.beginning);
                    startDate.subtract(2, 'hours');
                    delete model.calendar.newItem;
                }

                const roundedDown = Math.floor(startDate.minute() / 15) * 15;
                startDate.minute(roundedDown).second(0);
                endDate = moment(startDate).add(1, 'hours');

                $scope.course = new Course({
                    teachers: _.clone($scope.params.user),
                    groups: _.clone($scope.params.group),
                    courseOccurrences: [],
                    startDate: startDate,
                    endDate: endDate,
                }, startDate, endDate);
                if ($scope.structure && $scope.structures.all.length === 1)
                    $scope.course.structureId = $scope.structure.id;

                template.open('main', 'manage-course');
                Utils.safeApply($scope);
            },
            edit: async  (params) => {
                $scope.course =  new Course({});
                await $scope.course.sync( params.idCourse );
                template.open('main', 'manage-course');
                Utils.safeApply($scope);
            }
        });
    }]);
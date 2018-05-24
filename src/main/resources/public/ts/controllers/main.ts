import { ng, template, notify, moment, idiom as lang, _, Behaviours, model } from 'entcore';
import { Structures, USER_TYPES, Course, Student, Group, Structure } from '../model';

export let main = ng.controller('EdtController',
    ['$scope', 'route', '$location', async function ($scope, route, $location) {
        $scope.structures = new Structures();
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
                    $scope.params.user = model.me.userId;
                }
                break;
                case USER_TYPES.student : {
                    $scope.params.group = _.findWhere($scope.structure.groups.all, {id: model.me.classes[0]});
                }
                break;
                case USER_TYPES.relative : {
                    if ($scope.structure.students.all.length > 0) {
                        let externalClassId = $scope.structure.students.all[0].classes[0];
                        $scope.params.group = _.findWhere($scope.structure.groups.all, { externalId: externalClassId });
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
            if ($scope.params.user !== null
                && $scope.params.group !== null) {
                notify.error('');
            } else  {
                $scope.calendarLoader.display();
                $scope.structure.courses.all = [];
                await $scope.structure.courses.sync($scope.structure, $scope.params.user, $scope.params.group);
                $scope.calendarLoader.hide();
                $scope.safeApply();
            }
        };

        $scope.getTeacherTimetable = () => {
            $scope.params.group = null;
            $scope.params.user = model.me.userId;
            $scope.getTimetable();
        };

        $scope.params = {
            user: null,
            group: null,
            updateItem: null,
            dateFromCalendar: null
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

            model.calendar.eventer.off('calendar.drop-item');
            model.calendar.eventer.on('calendar.drop-item', (item) => {
                $scope.calendarDropItem(item);
            });
            model.calendar.eventer.off('calendar.resize-item');
            model.calendar.eventer.on('calendar.resize-item', (item) => {
                $scope.calendarResizedItem(item);
            });

        };

        initTriggers();

        /**
         * Subscriber to directive calendar changes event
         */
        $scope.$watch( () => {return  model.calendar.firstDay}, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                initTriggers();
                if (moment(oldValue).format('DD/MM/YYYY') !== moment(newValue).format('DD/MM/YYYY')) {
                    $scope.getTimetable();
                }
            }
        }, true);

        $scope.$watch( () => {return  model.calendar.increment}, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                initTriggers();
                $scope.getTimetable();
            }
        }, true);

        route({
            main: () => {
                template.open('main', 'main');
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
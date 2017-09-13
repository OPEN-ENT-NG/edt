import { ng, template, notify, moment, idiom as lang, _ } from 'entcore';
import { Structures, USER_TYPES, Course, Student, Group } from '../model';

export let main = ng.controller('EdtController',
    ['$scope', 'model', 'route', '$location', async function ($scope, model, route, $location) {
        $scope.structures = new Structures();
        $scope.structures.sync();
        $scope.structure = $scope.structures.first();

        $scope.lightbox = {
            display: false,
            show: function () {
                this.display = true;
                $scope.safeApply();
            },
            hide: function () {
                this.display = false;
                $scope.safeApply();
            },
            openTemplate(templateName: string) {
                template.open('lightbox', templateName);
                $scope.safeApply();
            }
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
        $scope.syncStructure = async () => {
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

        $scope.syncStructure();

        $scope.switchStructure = () => {
            $scope.syncStructure();
        };

        /**
         * Returns if current user is a personnel
         * @returns {boolean}
         */
        $scope.isPersonnel = (): boolean => model.me.type == USER_TYPES.personnel;

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
            }
        };

        $scope.params = {
            user: null,
            group: null
        };

        if ($scope.isRelative()) {
            $scope.currentStudent = null;
        }

        $scope.safeApply = (): Promise<any> => {
            return new Promise((resolve, reject) => {
                let phase = $scope.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (resolve && (typeof(resolve) === 'function')) {
                        resolve();
                    }
                } else {
                    if (resolve && (typeof(resolve) === 'function')) {
                        $scope.$apply(resolve);
                    } else {
                        $scope.$apply()();
                    }
                }
            });
        };

        /**
         * Course creation with occurrences
         */
        $scope.createCourseWithOccurrences = () => {
            $scope.goTo('/create');
        };

        /**
         * Course creation without occurrences
         */
        $scope.createCourse = () => {
            $scope.course = new Course({
                teachers: [],
                groups: [],
                roomLabels: []
            }, model.calendar.newItem.beginning, model.calendar.newItem.end);
            if ($scope.params.group) $scope.course.groups.push($scope.params.group);
            if ($scope.params.user) $scope.course.teachers.push($scope.params.user);
            if ($scope.structures.all.length === 1) $scope.course.structureId = $scope.structure.id;
            $scope.lightbox.openTemplate('course-create');
            $scope.lightbox.show();
        };

        $scope.goTo = (state: string) => {
            $location.path(state);
            $scope.safeApply();
        };

        $scope.translate = (key: string) => lang.translate(key);

        let initTriggers = () => {
            model.calendar.eventer.off('calendar.create-item');
            model.calendar.eventer.on('calendar.create-item', () => {
                if ($location.path() !== '/create') {
                    $scope.createCourse();
                }
            });

            model.calendar.eventer.off('calendar.drop-item');
            model.calendar.eventer.on('calendar.drop-item', (item) => {
                console.log('dropped');
            });

            model.calendar.eventer.off('calendar.resize-item');
            model.calendar.eventer.on('calendar.resize-item', (item) => {
                console.log('resized');
                console.log(item);
            });

        };

        initTriggers();

        /**
         * Subscriber to directive calendar changes event
         */
        $scope.$watch(() => model.calendar, function (oldVal, newVal) {
            initTriggers();
            if (moment(oldVal.dayForWeek).format('DD/MM/YYYY') !== moment(newVal.dayForWeek).format('DD/MM/YYYY')) {
                $scope.getTimetable();
            }

        });

        route({
            main: () => {
                template.open('main', 'main');
            },
            create: () => {
                $scope.course = new Course({
                    teachers: [],
                    groups: [],
                    courseOccurrences: [],
                    startDate: new Date(),
                    endDate: new Date(),
                });
                if ($scope.structure && $scope.structures.all.length === 1) $scope.course.structureId = $scope.structure.id;
                template.open('main', 'course-create-occurrence');
            }
        });
    }]);
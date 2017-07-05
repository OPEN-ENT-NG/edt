import { ng, template, model, notify } from 'entcore/entcore';
import { Structures, USER_TYPES } from '../model';

export let main = ng.controller('EdtController',
    ['$scope', 'model', 'route', '$route', async function ($scope, model, route, $route) {
        $scope.structures = new Structures();
        $scope.structures.sync();
        $scope.structure = $scope.structures.first();

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
            $scope.structure.eventer.on('refresh', () => $scope.safeApply());
            await $scope.structure.sync();
            if ($scope.isTeacher()) {
                $scope.calendarLoader.display();
                await $scope.structure.courses.sync($scope.structure, null, null);
                $scope.calendarLoader.hide();
            } else {
                $scope.safeApply();
            }
        };

        $scope.syncStructure();

        $scope.switchStructure = () => {
            $scope.syncStructure();
        };

        /**
         * Return if current user is a personnel
         * @returns {boolean}
         */
        $scope.isPersonnel = (): boolean => {
            return model.me.type == USER_TYPES.personnel;
        };

        /**
         * Return if current user is a teacher
         * @returns {boolean}
         */
        $scope.isTeacher = (): boolean => {
            return model.me.type === USER_TYPES.teacher;
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
                await $scope.structure.courses.sync($scope.structure, $scope.params.user, $scope.params.group);
                $scope.calendarLoader.hide();
            }
        };

        $scope.params = {
            user: $scope.isPersonnel() ? null : model.me,
            group: null
        };

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
         * Subscriber to directive calendar changes event
         */
        model.on('calendar.date-change', async () => {
            await $scope.structure.courses.sync($scope.structure, null, null);
            $scope.safeApply();
        });

        route({
            main: async () => {
                template.open('main', 'main');
            }
        });
    }]);
import { ng, template, model } from 'entcore/entcore';
import { Structures } from '../model';

export let main = ng.controller('EdtController',
    ['$scope', 'model', 'route', '$route', async function ($scope, model, route, $route) {
        $scope.structures = new Structures();
        $scope.structures.sync();
        $scope.structure = $scope.structures.first();

        $scope.syncStructure = () => {
            $scope.structure.sync().then(() => {
                $scope.$apply();
            });
        };

        $scope.syncStructure();

        $scope.switchStructure = () => {
            $scope.syncStructure();
        };

        model.on('calendar.date-change', async () => {
            await $scope.structure.courses.sync($scope.structure);
            $scope.$apply();
        });

        route({
            main: async () => {
                template.open('main', 'main');
            }
        });
    }]);
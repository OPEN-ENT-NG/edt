import {idiom, ng} from 'entcore';
import {Structure, Student} from "../model";
import {Subject} from "rxjs";


interface IViewModel {
    $onInit(): any;
    $onDestroy(): any;
    translate(key: string): any;

    eventUpdateChild: Subject<Student>;
    eventUpdateStructure: Subject<Structure>;

    structure: Structure;
    structures: Array<Structure>;

    switchChild(): void;
    switchStructure(): void;

    // props
    child: Student;
    children: Array<Student>;
}

export const SelectChildren = ng.directive('selectChildren', ['$timeout', ($timeout) => {
    return {
        restrict: 'E',
        scope: {
            child: '=',
            children: '=',
            structure: '<',
            eventUpdateChild: '<',
            eventUpdateStructure: '<'
        },
        template: `
        <!-- select children section -->
        <div class="cell margin-select-child">
            <div ng-if="vm.children && vm.children.length > 1" class="row display-inline-block section-content">
                <select ng-model="vm.child"
                        id="children-list"
                        class="twelve margin-left-2 margin-bottom-mid remove-border-select-child"
                        ng-change="vm.switchChild()"
                        ng-options="child as child.displayName for child in vm.children">
                </select>
            </div>
        </div>

        <!-- select structure section -->
        <div class="cell margin-select-child">
            <div class="row display-inline-block section-content">
                <select ng-model="vm.structure"
                        id="structure-list"
                        class="twelve margin-left-2 margin-bottom-mid remove-border-select-child"
                        ng-change="vm.switchStructure()"
                        ng-options="structure as structure.name for structure in vm.child.structures"
                        ng-show="vm.child.structures.length > 1">
                </select>
            </div>
        </div>
        `,
        controllerAs: 'vm',
        bindToController: true,
        replace: false,
        controller: function ($scope) {
            const vm: IViewModel = <IViewModel> $scope.vm;
        },
        link: function ($scope) {
            const vm: IViewModel = $scope.vm;

            vm.switchChild = (): void => {
                vm.structure = (vm.child && vm.child.structures && vm.child.structures.length > 0) ?
                    vm.child.structures[0] : null;
                vm.eventUpdateChild.next(vm.child);
            };

            vm.switchStructure = (): void => {
                vm.eventUpdateStructure.next(vm.structure);
            };

            vm.translate = (key: string): any => idiom.translate(key);
        }
    };
}]);
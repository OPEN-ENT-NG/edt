import { ng, appPrefix, $ } from 'entcore';

/**
 * Stepper directive
 * @Param onCancel {function} Function triggered on cancel
 * @param onFinish {function} Function triggered when last step is validated
 * @param classes {string} Optional. String which is injected as classes on the stepper.
 */
export let stepper = ng.directive('stepper', () => {
    return {
        restrict: 'E',
        templateUrl: '/' + appPrefix + '/public/template/stepper/stepper.html',
        scope : {
            onCancel: '&',
            onFinish: '&',
            classes: '=?'
        },
        transclude: true,
        compile: (element, attributes, transclude) => {
            return ($scope, element, attributes) => {
                $scope.classes = $scope.classes || '';
                const steps = element.find('div.steps a-step');
                const nbSteps = steps.length;
                let currentStep = 0;
                $(steps[nbSteps-1]).attr('last', true);
                $(steps[currentStep]).attr('first', true);
                for (let i = 0; i < nbSteps; i++) {
                    $(steps[i]).attr('disabled', true).attr('order', i);
                }
                $(steps[currentStep]).attr('active', true).removeAttr('disabled');

                $scope.$on('stepper.next-step', () => {
                    $(steps[currentStep]).removeAttr('active');
                    currentStep++;
                    $(steps[currentStep]).removeAttr('disabled');
                    $(steps[currentStep]).attr('active', true);
                });

                $scope.$on('stepper.cancel', () => {
                    $scope.onCancel();
                });

                $scope.$on('stepper.end', () => {
                    $scope.onFinish();
                });

                $scope.$on('stepper.previous-step', () => {
                    $(steps[currentStep]).removeAttr('active');
                    currentStep--;
                    $(steps[currentStep]).removeAttr('disabled');
                    $(steps[currentStep]).attr('active', true);
                });

                $scope.$on('stepper.goToStep', (event: object, order: string) => {
                    if (!$(steps[order]).attr('disabled')
                        && !$(steps[order]).attr('active')) {
                        $(steps[currentStep]).removeAttr('active');
                        currentStep = parseInt(order);
                        $(steps[currentStep]).attr('active', true);
                    }
                });
            }
        }
    }
});

/**
 * A step component for stepper directive
 * @param title {string} Step title
 * @param nextCondition {function} next condition validating step. Should returns a boolean
 * @param onActivation {function} Optional. Function triggered when step is activated
 * @param disabled {boolean} Optional. Boolean used by stepper directive. Must not be used.
 * @param active {boolean} Optional. Boolean used by stepper directive. Must not be used.
 */
export let aStep = ng.directive('aStep', () => {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            title: '=',
            nextCondition: '&',
            onActivation: '&?',
            disabled: '=?',
            active: '=?'
        },
        templateUrl: '/' + appPrefix + '/public/template/stepper/aStep.html',
        link: (scope, element) => {
            scope.last = false;
            scope.first = false;
            scope.disabled = false;
            scope.active = false;
            scope.valid = false;

            scope.nextStep = () => {
                if (scope.nextCondition()) {
                    scope.valid = true;
                    scope.$emit('stepper.next-step');
                }
            };

            scope.previousStep = () => {
                scope.$emit('stepper.previous-step');
            };

            scope.cancelStep = () => {
                scope.$emit('stepper.cancel');
            };

            scope.finishStepper = () => {
                scope.$emit('stepper.end');
            };

            scope.goToStep = () => {
                scope.$emit('stepper.goToStep', $(element).attr('order'));
            };

            scope.$watch(element, () => {
                scope.last = $(element).attr('last') !== undefined;
                scope.first = $(element).attr('first') !== undefined;
            });

            scope.$watch(() => element.attr('disabled'), () => {
                scope.disabled = $(element).attr('disabled') !== undefined;
            });

            scope.$watch(() => element.attr('active'), () => {
                scope.active = $(element).attr('active') !== undefined;
                if (scope.active && typeof scope.onActivation === 'function') scope.onActivation();
            });
        }
    }
});
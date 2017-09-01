import { ng, routes } from 'entcore';
import { main, creationController } from './controllers';
import { stepper, aStep } from './directives';

ng.controllers.push(main);
ng.controllers.push(creationController);

ng.directives.push(stepper);
ng.directives.push(aStep);

routes.define(($routeProvider) => {
    $routeProvider
        .when('/', {
            action: 'main'
        })
        .when('/create', {
            action: 'create'
        })
        .otherwise({
            redirectTo: '/'
        });
});
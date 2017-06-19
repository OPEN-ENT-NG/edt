import { ng, routes } from 'entcore/entcore';
import { main } from './controllers/main';

ng.controllers.push(main);

routes.define(($routeProvider) => {
    $routeProvider
        .when('/', {
            action: 'main'
        })
        .otherwise({
            redirectTo: '/'
        });
});
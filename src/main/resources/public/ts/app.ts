import {model, ng, routes, Behaviours } from 'entcore';
import * as controllers from './controllers';
import * as directives from './directives';

for (let controller in controllers) {
    ng.controllers.push(controllers[controller]);
}
for (let directive in directives) {
    ng.directives.push(directives[directive]);
}

routes.define(($routeProvider) => {
    $routeProvider
        .when('/', {
            action: 'main'
        });

    if(model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.create)) {
        $routeProvider.when('/create', {
            action: 'create'
        });
    }
    if(model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.manage)) {
        $routeProvider
            .when ('/edit/:idCourse/:beginning?/:end?',  {
                action: 'edit'
            });
    }
    $routeProvider.otherwise({
        redirectTo: '/'
    });
});
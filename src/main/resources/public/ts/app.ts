import {model, ng, routes, Behaviours } from 'entcore';
import * as controllers from './controllers';
import * as directives from './directives';
import * as services from './services';

for (let controller in controllers) {
    ng.controllers.push(controllers[controller]);
}
for (let directive in directives) {
    ng.directives.push(directives[directive]);
}

for (let service in services) {
    ng.services.push(services[service]);
}

routes.define(($routeProvider) => {
    $routeProvider
        .when('/', {
            action: 'main'
        });

    if(model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.manage)) {
        $routeProvider.when('/create', {
            action: 'create'
        });
    }
    if(model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.manage)) {
        $routeProvider
            .when ('/edit/:type/:idCourse/:beginning?/:end?',  {
                action: 'edit'
            });

    }
    if(model.me.hasWorkflow(Behaviours.applicationsBehaviours.edt.rights.workflow.manage))
    $routeProvider.when('/importSts', {
            action: 'importSts'
    });
});
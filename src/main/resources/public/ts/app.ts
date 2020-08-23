import {model, ng, routes, Behaviours, Me} from 'entcore';
import * as controllers from './controllers';
import * as directives from './directives';
import * as services from './services';
import {PreferencesUtils} from "./utils/preference/preferences";

declare let window: any;

Me.preference(PreferencesUtils.PREFERENCE_KEYS.EDT_STRUCTURE).then((value: any) => {
    window.preferenceStructure = value;
});

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
package fr.cgi.edt.security;

import fr.cgi.edt.utils.EdtWorkflowActions;
import fr.wseduc.webutils.http.Binding;
import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpServerRequest;

public class ManageSettingsWorkflowAction implements ResourcesProvider {
    @Override
    public void authorize(HttpServerRequest resourceRequest, Binding binding, UserInfos user, Handler<Boolean> handler) {
        handler.handle(new WorkflowActionUtils().hasRight(user, EdtWorkflowActions.MANAGE.toString()));

    }
}

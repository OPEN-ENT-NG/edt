package fr.cgi.edt.security;

import org.entcore.common.user.UserInfos;

import java.util.List;

public class WorkflowActionUtils {

    /**
     * Check if user got provided workflow action
     * @param user user
     * @param action workflow action
     * @return returns if user got provided workflow action
     */
    public boolean hasRight (UserInfos user, String action) {
        List<UserInfos.Action> actions = user.getAuthorizedActions();
        for (UserInfos.Action userAction : actions) {
            if (action.equals(userAction.getDisplayName())) {
                return true;
            }
        }
        return false;
    }
}

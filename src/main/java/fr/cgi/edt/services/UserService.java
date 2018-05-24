package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;

public interface UserService {
	/**
	 * Returns user children information
	 * @param user current
	 * @param handler handler returning data
	 */
    void getChildrenInformation(UserInfos user, Handler<Either<String, JsonArray>> handler);
}

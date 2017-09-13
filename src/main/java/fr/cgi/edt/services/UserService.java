package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;

public interface UserService {
	/**
	 * Returns user children information
	 * @param user current
	 * @param handler handler returning data
	 */
	public void getChildrenInformation(UserInfos user, Handler<Either<String, JsonArray>> handler);
}

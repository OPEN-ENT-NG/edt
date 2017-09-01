package fr.cgi.edt.services;

import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.Either;

/**
 * Generic REST service for Edt.
 */
public interface EdtService {

	public void createCourses(JsonArray courses, Handler<Either<String, JsonObject>> handler);
}

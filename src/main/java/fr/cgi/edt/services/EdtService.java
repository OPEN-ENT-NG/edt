package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

/**
 * Generic REST service for Edt.
 */
public interface EdtService {

	/**
	 * Create courses
	 * @param courses JsonArray containing courses
	 * @param handler handler
	 */
	public void create(JsonArray courses, Handler<Either<String, JsonObject>> handler);

	/**
	 * Updates courses
	 * @param courses JsonArray containing courses
	 * @param handler handler
	 */
	public void update(JsonArray courses, Handler<Either<String, JsonObject>> handler);
}

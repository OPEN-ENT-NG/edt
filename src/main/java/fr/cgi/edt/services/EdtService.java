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

	//CRUD
	public void createEdt(UserInfos user, JsonObject data, Handler<Either<String, JsonObject>> handler);
	public void getEdt(String id, Handler<Either<String, JsonObject>> handler);
	public void listEdt(UserInfos user, Handler<Either<String, JsonArray>> handler);
	public void updateEdt(String id, JsonObject data, Handler<Either<String, JsonObject>> handler);
	public void deleteEdt(String id, Handler<Either<String, JsonObject>> handler);

	//TRASHBIN
	public void trashEdt(String id, Handler<Either<String, JsonObject>> handler);
	public void recoverEdt(String id, Handler<Either<String, JsonObject>> handler);

}

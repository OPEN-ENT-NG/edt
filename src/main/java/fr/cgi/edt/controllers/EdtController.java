package fr.cgi.edt.controllers;

import static org.entcore.common.http.response.DefaultResponseHandler.arrayResponseHandler;
import static org.entcore.common.http.response.DefaultResponseHandler.defaultResponseHandler;
import fr.cgi.edt.services.EdtService;
import fr.cgi.edt.services.EdtServiceMongoImpl;
import fr.wseduc.rs.*;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.request.RequestUtils;

import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

/**
 * Vert.x backend controller for the application using Mongodb.
 */
public class EdtController extends MongoDbControllerHelper {

	//Computation service
	private final EdtService edtService;

	//Permissions
	private static final String
		read_only 			= "edt.view",
		modify 				= "edt.create",
		manage_ressource	= "edt.manager",
		contrib_ressource	= "edt.contrib",
		view_ressource		= "edt.read";

	/**
	 * Creates a new controller.
	 * @param collection Name of the collection stored in the mongoDB database.
	 */
	public EdtController(String collection) {
		super(collection);
		edtService = new EdtServiceMongoImpl(collection);
	}

	/**
	 * Displays the home view.
	 * @param request Client request
	 */
	@Get("")
	@SecuredAction(read_only)
	public void view(HttpServerRequest request) {
		renderView(request);
	}

	//////////////
	//// CRUD ////
	//////////////

	/**
	 * Creates a new edt.
	 * @param request Client request.
	 */
	@Post("")
	@SecuredAction(modify)
	public void createEdt(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			public void handle(final UserInfos user) {
				if (user != null) {
					RequestUtils.bodyToJson(request, pathPrefix + "create", new Handler<JsonObject>() {
						public void handle(JsonObject data) {
							edtService.createEdt(user, data, defaultResponseHandler(request));
						}
					});
				}
			}
		});
	}

	/**
	 * Returns the associated data.
	 * @param request Client request containing the id.
	 */
	@Get("/get/:id")
	@SecuredAction(value = view_ressource, type = ActionType.RESOURCE)
	public void getEdt(final HttpServerRequest request) {
		edtService.getEdt(request.params().get("id"), defaultResponseHandler(request));
	}

	/**
	 * Lists every object associated with the user.
	 * @param request Client request.
	 */
	@Get("/list")
	@SecuredAction(value = read_only, type = ActionType.AUTHENTICATED)
	public void listEdt(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			public void handle(final UserInfos user) {
				if (user != null) {
					Handler<Either<String, JsonArray>> handler = arrayResponseHandler(request);
					edtService.listEdt(user, handler);
				}
			}
		});
	}

	/**
	 * Updates a single edt.
	 * @param request Client request.
	 */
	@Put("/:id")
	@SecuredAction(value = contrib_ressource, type = ActionType.RESOURCE)
	public void updateEdt(final HttpServerRequest request) {
		RequestUtils.bodyToJson(request, pathPrefix + "update", new Handler<JsonObject>() {
			public void handle(JsonObject data) {
				edtService.updateEdt(request.params().get("id"), data, defaultResponseHandler(request));
			}
		});
	}

	/**
	 * Deletes a single edt.
	 * @param request Client request.
	 */
	@Delete("/:id")
	@SecuredAction(value = manage_ressource, type = ActionType.RESOURCE)
	public void deleteEdt(final HttpServerRequest request) {
		edtService.deleteEdt(request.params().get("id"), defaultResponseHandler(request));
	}

	///////////////////
	//// TRASH BIN ////
	///////////////////

	/**
	 * Puts a edt into the trash bin.
	 * @param request Client request containing the id.
	 */
	@Put("/:id/trash")
	@SecuredAction(value = manage_ressource, type = ActionType.RESOURCE)
	public void trashEdt(final HttpServerRequest request) {
		final String id = request.params().get("id");
		edtService.trashEdt(id, defaultResponseHandler(request));
	}

	/**
	 * Recovers a edt from the trash bin.
	 * @param request Client request containing the id.
	 */
	@Put("/:id/recover")
	@SecuredAction(value = manage_ressource, type = ActionType.RESOURCE)
	public void recoverEdt(final HttpServerRequest request) {
		final String id = request.params().get("id");
		edtService.recoverEdt(id, defaultResponseHandler(request));
	}

	/////////////////
	//// SHARING ////
	/////////////////

	/**
	 * Lists sharing rights.
	 * @param request Client request containing the id.
	 */
	@Get("/share/json/:id")
	@SecuredAction(value = view_ressource, type = ActionType.RESOURCE)
	public void listRights(final HttpServerRequest request) {
		super.shareJson(request, false);
	}

	/**
	 * Adds sharing rights.
	 * @param request Client request containing the id.
	 */
	@Put("/share/json/:id")
	@SecuredAction(value = manage_ressource, type = ActionType.RESOURCE)
	public void addRights(final HttpServerRequest request) {
		super.shareJsonSubmit(request, "notify-share.html", false);
	}

	/**
	 * Drops sharing rights.
	 * @param request Client request containing the id.
	 */
	@Put("/share/remove/:id")
	@SecuredAction(value = manage_ressource, type = ActionType.RESOURCE)
	public void dropRights(final HttpServerRequest request) {
		super.removeShare(request, false);
	}

}

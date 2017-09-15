package fr.cgi.edt.controllers;

import fr.cgi.edt.services.EdtService;
import fr.cgi.edt.services.UserService;
import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import fr.cgi.edt.services.impl.UserServiceNeo4jImpl;
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

import static fr.wseduc.webutils.http.response.DefaultResponseHandler.*;

/**
 * Vert.x backend controller for the application using Mongodb.
 */
public class EdtController extends MongoDbControllerHelper {

	private final EdtService edtService;
	private final UserService userService;

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
		userService = new UserServiceNeo4jImpl();
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

	private Handler<Either<String, JsonObject>> getServiceHandler (final HttpServerRequest request) {
		return new Handler<Either<String, JsonObject>>() {
			@Override
			public void handle(Either<String, JsonObject> result) {
				if (result.isRight()) {
					renderJson(request, result.right().getValue());
				} else {
					renderError(request);
				}
			}
		};
	}

	@Post("/course")
	@SecuredAction(modify)
	@ApiDoc("Create a course with 1 or more occurrences")
	public void create(final HttpServerRequest request) {
		RequestUtils.bodyToJsonArray(request, new Handler<JsonArray>() {
			@Override
			public void handle(JsonArray body) {
				edtService.create(body, getServiceHandler(request));
			}
		});
	}

	@Put("/course")
	@SecuredAction(value = "", type = ActionType.AUTHENTICATED)
	@ApiDoc("Update course")
	public void update (final HttpServerRequest request) {
		RequestUtils.bodyToJsonArray(request, new Handler<JsonArray>() {
			@Override
			public void handle(JsonArray body) {
				edtService.update(body, getServiceHandler(request));
			}
		});
	}

	@Get("/user/children")
	@SecuredAction(value = "", type = ActionType.AUTHENTICATED)
	@ApiDoc("Return information needs by relative profiles")
	public void getChildrenInformation(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(UserInfos user) {
				userService.getChildrenInformation(user, arrayResponseHandler(request));
			}
		});
	}
}

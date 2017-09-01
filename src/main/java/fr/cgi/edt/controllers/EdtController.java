package fr.cgi.edt.controllers;

import static org.entcore.common.http.response.DefaultResponseHandler.defaultResponseHandler;
import fr.cgi.edt.services.EdtService;
import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import fr.wseduc.rs.*;
import fr.wseduc.security.SecuredAction;

import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.request.RequestUtils;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

/**
 * Vert.x backend controller for the application using Mongodb.
 */
public class EdtController extends MongoDbControllerHelper {

	private final EdtService edtService;

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

	@Post("/course")
	@SecuredAction(modify)
	@ApiDoc("Create a course with 1 or more occurrences")
	public void create(final HttpServerRequest request) {
		RequestUtils.bodyToJsonArray(request, new Handler<JsonArray>() {
			@Override
			public void handle(JsonArray body) {
				edtService.createCourses(body, new Handler<Either<String, JsonObject>>() {
					@Override
					public void handle(Either<String, JsonObject> result) {
						if (result.isRight()) {
							renderJson(request, result.right().getValue());
						} else {
							renderError(request);
						}
					}
				});
			}
		});
	}
}

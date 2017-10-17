package fr.cgi.edt.services.impl;

import java.util.ArrayList;
import java.util.List;

import fr.cgi.edt.utils.EdtMongoHelper;
import fr.cgi.edt.services.EdtService;
import org.entcore.common.service.impl.MongoDbCrudService;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import com.mongodb.DBObject;
import com.mongodb.QueryBuilder;
import com.mongodb.util.JSON;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.webutils.Either;

/**
 * MongoDB implementation of the REST service.
 * Methods are usually self-explanatory.
 */
public class EdtServiceMongoImpl extends MongoDbCrudService implements EdtService {

	private final String collection;

	public EdtServiceMongoImpl(final String collection) {
		super(collection);
		this.collection = collection;
	}

	@Override
	public void create(JsonArray courses, Handler<Either<String, JsonObject>> handler) {
		new EdtMongoHelper(this.collection).transaction(courses, handler);
	}

	@Override
	public void update(JsonArray courses, Handler<Either<String, JsonObject>> handler) {
		new EdtMongoHelper(this.collection).transaction(courses, handler);
	}
}

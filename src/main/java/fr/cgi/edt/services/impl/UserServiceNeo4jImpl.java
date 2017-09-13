package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.UserService;
import fr.wseduc.webutils.Either;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;
import org.entcore.common.user.UserInfos;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

public class UserServiceNeo4jImpl implements UserService {
	@Override
	public void getChildrenInformation(UserInfos user, Handler<Either<String, JsonArray>> handler) {
		String query = "MATCH (:User {id:{userId}})<-[RELATED]-(u:User)-[IN]->(s:Structure) " +
				"return distinct u.id as id, u.firstName as firstName, u.lastName as lastName, " +
				"u.displayName as displayName, u.classes as classes, collect(s.id) as structures";

		Neo4j.getInstance().execute(query, new JsonObject().putString("userId", user.getUserId()), Neo4jResult.validResultHandler(handler));
	}
}

package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.StructureService;
import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;

public class StructureServiceNeo4jImpl implements StructureService {
    @Override
    public void retrieveUAI(String id, Handler<Either<String, String>> handler) {
        String query = "MATCH(s:Structure {id:{id}}) RETURN s.UAI as uai";
        JsonObject params = new JsonObject().put("id", id);
        Neo4j.getInstance().execute(query, params, Neo4jResult.validUniqueResultHandler(evt -> {
            if (evt.isLeft()) handler.handle(new Either.Left<>(evt.left().getValue()));
            else handler.handle(new Either.Right<>(evt.right().getValue().getString("uai")));
        }));
    }
}

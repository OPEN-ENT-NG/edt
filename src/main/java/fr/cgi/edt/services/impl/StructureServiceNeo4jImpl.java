package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.StructureService;
import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;

import java.util.List;

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

    @Override
    public void fetchStructuresInfos(List<String> structuresId, Handler<Either<String, JsonArray>> handler) {
        String query = "MATCH (s:Structure) WHERE s.id IN {structuresId} return s.id as id, s.name as name";
        JsonObject params = new JsonObject().put("structuresId", structuresId);
        Neo4j.getInstance().execute(query, params, Neo4jResult.validResultHandler(handler));
    }

}

package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.StructureService;
import fr.cgi.edt.services.UserService;
import fr.wseduc.webutils.Either;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;
import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public class UserServiceNeo4jImpl implements UserService {
    private static final Logger log = LoggerFactory.getLogger(UserServiceNeo4jImpl.class);

    private final StructureService structureService = new StructureServiceNeo4jImpl();

    @Override
    @SuppressWarnings("unchecked")
    public void getChildrenInformation(UserInfos user, Handler<Either<String, JsonArray>> handler) {
        String query = "MATCH (:User {id:{userId}})<-[RELATED]-(u:User)-[:IN]->(g:ProfileGroup)-[:DEPENDS]->(s:Structure), " +
                "(u)--(m:Group{filter:\"Student\"})--(b:Class) " +
                "RETURN distinct u.id AS id, u.firstName AS firstName, u.lastName AS lastName," +
                " u.displayName AS displayName, u.classes AS classes, collect(DISTINCT b.id) AS idClasses, collect(DISTINCT s.id) AS structures ";

        Neo4j.getInstance().execute(query, new JsonObject().put("userId", user.getUserId()), Neo4jResult.validResultHandler(event -> {
                if (event.isLeft()) {
                    log.error("[EDT@UserServiceNeo4jImpl::getChildrenInformation] Failed to retrieve children info " + event.left().getValue());
                    handler.handle(new Either.Left<>(event.left().getValue()));
                } else {
                    JsonArray childrenData = event.right().getValue();
                    // We handler childrenData as empty
                    if (childrenData.isEmpty()) {
                        handler.handle(new Either.Right<>(childrenData));
                    } else {
                        List<String> structuresIds = new ArrayList<>();

                        ((List<JsonObject>) childrenData.getList()).forEach(child ->
                                structuresIds.addAll(child.getJsonArray("structures", new JsonArray()).getList()));

                        structureService.fetchStructuresInfos(structuresIds.stream().distinct().collect(Collectors.toList()),
                                structureInfoResult -> {
                            if (structureInfoResult.isLeft()) {
                                log.error("[EDT@UserServiceNeo4jImpl::getChildrenInformation::fetchStructuresInfos] " +
                                        "Failed to retrieve groups " + structureInfoResult.left().getValue());
                                handler.handle(new Either.Left<>(structureInfoResult.left().getValue()));
                            } else {
                                JsonArray structuresInfo = structureInfoResult.right().getValue();
                                setStructureInfo(childrenData, structuresInfo);
                                handler.handle(new Either.Right<>(childrenData));
                            }
                        });
                    }
                }
        }));
    }

    @SuppressWarnings("unchecked")
    private void setStructureInfo(JsonArray childrenData, JsonArray structuresInfo) {
        Map<String, JsonObject> structuresMap = ((List<JsonObject>) structuresInfo.getList())
                .stream()
                .collect(Collectors.toMap(structure -> structure.getString("id"), Function.identity()));

        ((List<JsonObject>) childrenData.getList()).forEach(child -> {
            child.put("structuresInfo", new JsonArray());
            List<String> structures = ((List<String>) child.getJsonArray("structures").getList());
            structures.forEach(structure -> {
                if (structuresMap.containsKey(structure)) {
                    child.getJsonArray("structuresInfo").add(structuresMap.get(structure));
                }
            });
            child.put("structures", child.getJsonArray("structuresInfo"));
            child.remove("structuresInfo");
        });
    }
}

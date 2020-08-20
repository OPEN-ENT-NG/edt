package fr.cgi.edt.services.impl;

import fr.cgi.edt.helper.FutureHelper;
import fr.cgi.edt.services.SearchService;
import fr.wseduc.webutils.Either;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class DefaultSearchService implements SearchService {
    private static final Logger LOGGER = LoggerFactory.getLogger(fr.cgi.edt.services.impl.DefaultSearchService.class);

    @Override
    public void search(String query, String structureId, Handler<Either<String, JsonArray>> handler) {

        Future<JsonArray> groupFuture = Future.future();
        Future<JsonArray> manualGroupFuture = Future.future();

        CompositeFuture.all(groupFuture, manualGroupFuture).setHandler(event -> {
            if(event.failed()) {
                String message = "[EDT@DefaultSearchService::search] Failed to retrieve groups" + event.cause();
                LOGGER.error(message);
                handler.handle(new Either.Left<>(message));
            } else {
                List items = Stream.concat(groupFuture.result().stream(), manualGroupFuture.result().stream())
                        .collect(Collectors.toList());

                items.sort((Comparator<JsonObject>) (o1, o2) -> o1.getString("displayName")
                        .compareToIgnoreCase(o2.getString("displayName")));
                handler.handle(new Either.Right<>(new JsonArray(items)));
            }
        });

        searchGroups(query, structureId, FutureHelper.handlerJsonArray(groupFuture));
        searchManualGroup(query, structureId, FutureHelper.handlerJsonArray(manualGroupFuture));
    }


    /**
     * Search all functional groups and classes.
     * @param query the user search query.
     * @param structureId the current structure id.
     * @param handler the search results handler.
     */
    private void searchGroups(String query, String structureId, Handler<Either<String, JsonArray>> handler) {
        String searchQuery =
                "MATCH (g)-[:BELONGS|:DEPENDS]->(s:Structure {id:{structureId}}) " +
                "WHERE toLower(g.name) CONTAINS '" + query.toLowerCase() + "' " +
                "AND (g:Class OR g:FunctionalGroup) " +
                "RETURN g.id as id, g.name as displayName, 'GROUP' as type, g.id as groupId, g.name as groupName ";

        JsonObject params = new JsonObject().put("structureId", structureId);
        Neo4j.getInstance().execute(searchQuery, params, Neo4jResult.validResultHandler(handler));
    }

    /**
     * Search all manual groups.
     * @param query the user search query.
     * @param structureId the current structure id.
     * @param handler the search results handler.
     */
    private void searchManualGroup(String query, String structureId, Handler<Either<String, JsonArray>> handler) {
        String searchQuery =
                "MATCH (User {profiles:['Student']})-[:IN]->(g:ManualGroup)-[:BELONGS|:DEPENDS]->(s:Structure {id: {structureId}}) " +
                "WHERE toLower(g.name) CONTAINS '" + query.toLowerCase() + "' " +
                "RETURN DISTINCT g.id as id, g.name as displayName, 'GROUP' as type, g.id as groupId, g.name as groupName ";

        JsonObject params = new JsonObject().put("structureId", structureId);
        Neo4j.getInstance().execute(searchQuery, params, Neo4jResult.validResultHandler(handler));
    }
}


package fr.cgi.edt.services.impl;

import fr.cgi.edt.helper.FutureHelper;
import fr.cgi.edt.services.SearchService;
import fr.wseduc.webutils.Either;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Promise;
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

        Promise<JsonArray> groupPromise = Promise.promise();
        Promise<JsonArray> manualGroupPromise = Promise.promise();

        Future.all(groupPromise.future(), manualGroupPromise.future()).onComplete(event -> {
            if(event.failed()) {
                String message = "[EDT@DefaultSearchService::search] Failed to retrieve groups" + event.cause();
                LOGGER.error(message);
                handler.handle(new Either.Left<>(message));
            } else {
                List items = Stream.concat(groupPromise.future().result().stream(), manualGroupPromise.future().result().stream())
                        .collect(Collectors.toList());

                items.sort((Comparator<JsonObject>) (o1, o2) -> o1.getString("displayName")
                        .compareToIgnoreCase(o2.getString("displayName")));
                handler.handle(new Either.Right<>(new JsonArray(items)));
            }
        });

        searchGroups(query, structureId, FutureHelper.handlerEitherPromise(groupPromise,
                String.format("[EDT@%s::search] " +
                        "Failed to search for groups for structure %s", this.getClass().getSimpleName(), structureId)
        ));
        searchManualGroup(query, structureId, FutureHelper.handlerEitherPromise(manualGroupPromise,
                String.format("[EDT@%s::search] " +
                        "Failed to search for manual groups for structure %s", this.getClass().getSimpleName(), structureId)
        ));
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
                "WHERE toLower(g.name) CONTAINS {query} " +
                "AND (g:Class OR g:FunctionalGroup) " +
                "RETURN g.id as id, g.name as displayName, 'GROUP' as type, g.id as groupId, g.name as groupName ";

        JsonObject params = new JsonObject()
                .put("structureId", structureId)
                .put("query", query.toLowerCase());
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
                "WHERE toLower(g.name) CONTAINS {query} " +
                "RETURN DISTINCT g.id as id, g.name as displayName, 'GROUP' as type, g.id as groupId, g.name as groupName ";

        JsonObject params = new JsonObject()
                .put("structureId", structureId)
                .put("query", query.toLowerCase());
        Neo4j.getInstance().execute(searchQuery, params, Neo4jResult.validResultHandler(handler));
    }
}


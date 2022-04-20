package fr.cgi.edt.services.impl;

import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jRest;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.mockito.internal.util.reflection.FieldSetter;
import org.mockito.stubbing.Answer;
import org.powermock.reflect.Whitebox;

import static org.mockito.Mockito.mock;

@RunWith(VertxUnitRunner.class)
public class SearchServiceTest {

    DefaultSearchService defaultSearchService;

    private final Neo4j neo4j = Neo4j.getInstance();
    private final Neo4jRest neo4jRest = mock(Neo4jRest.class);

    @Before
    public void setUp() throws NoSuchFieldException {
        this.defaultSearchService = new DefaultSearchService();
        FieldSetter.setField(neo4j, neo4j.getClass().getDeclaredField("database"), neo4jRest);
    }

    @Test
    public void testSearchGroups(TestContext ctx) {
        String expectedQuery = "MATCH (g)-[:BELONGS|:DEPENDS]->(s:Structure {id:{structureId}}) WHERE toLower(g.name) " +
                "CONTAINS {query} AND (g:Class OR g:FunctionalGroup) RETURN g.id as id, g.name as displayName, 'GROUP' " +
                "as type, g.id as groupId, g.name as groupName ";
        JsonObject expectedParams = new JsonObject()
                .put("structureId", "structureId")
                .put("query", "6eme");

        Mockito.doAnswer((Answer<Void>) invocation -> {
            String queryResult = invocation.getArgument(0);
            JsonObject paramsResult = invocation.getArgument(1);
            ctx.assertEquals(queryResult, expectedQuery);
            ctx.assertEquals(paramsResult, expectedParams);
            return null;
        }).when(neo4jRest).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));

        try {
            Whitebox.invokeMethod(this.defaultSearchService, "searchGroups", "6EME", "structureId", (Handler) e -> {

            });
        } catch (Exception e) {
            ctx.assertNotNull(e);
        }
    }

    @Test
    public void testSearchManualGroup(TestContext ctx) {
        String expectedQuery = "MATCH (User {profiles:['Student']})-[:IN]->(g:ManualGroup)-[:BELONGS|:DEPENDS]->(s:Structure {id: {structureId}})" +
                " WHERE toLower(g.name) CONTAINS {query} RETURN DISTINCT g.id as id, g.name as displayName, 'GROUP' as" +
                " type, g.id as groupId, g.name as groupName ";
        JsonObject expectedParams = new JsonObject()
                .put("structureId", "structureId")
                .put("query", "6eme");

        Mockito.doAnswer((Answer<Void>) invocation -> {
            String queryResult = invocation.getArgument(0);
            JsonObject paramsResult = invocation.getArgument(1);
            ctx.assertEquals(queryResult, expectedQuery);
            ctx.assertEquals(paramsResult, expectedParams);
            return null;
        }).when(neo4jRest).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));

        try {
            Whitebox.invokeMethod(this.defaultSearchService, "searchManualGroup", "6EME", "structureId", (Handler) e -> {

            });
        } catch (Exception e) {
            ctx.assertNotNull(e);
        }
    }
}

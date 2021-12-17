package fr.cgi.edt.services.impl;
import fr.cgi.edt.services.UserService;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jRest;
import org.entcore.common.user.UserInfos;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.mockito.internal.util.reflection.FieldSetter;
import org.mockito.stubbing.Answer;

import static org.mockito.Mockito.mock;


@RunWith(VertxUnitRunner.class)
public class UserServiceNeo4jTest {

    private final Neo4j neo4j = Neo4j.getInstance();
    private final Neo4jRest neo4jRest = mock(Neo4jRest.class);
    private Vertx vertx;

    private UserService userService;

    @Before
    public void setUp(TestContext context) throws NoSuchFieldException {
        vertx = Vertx.vertx();
        this.userService = new UserServiceNeo4jImpl();
        FieldSetter.setField(neo4j, neo4j.getClass().getDeclaredField("database"), neo4jRest);
    }

    @Test
    public void testGetChildrenInformation(TestContext ctx) {

        String expectedQuery = "MATCH (:User {id:{userId}})<-[RELATED]-(u:User)-[:IN]->(g:ProfileGroup)-[:DEPENDS]->(s:Structure), " +
                "(u)--(m:Group{filter:\"Student\"})--(b:Class) " +
                "RETURN distinct u.id AS id, u.firstName AS firstName, u.lastName AS lastName," +
                " u.displayName AS displayName, u.classes AS classes, collect(DISTINCT b.id) AS idClasses, collect(DISTINCT s.id) AS structures ";

        UserInfos userInfos = new UserInfos();
        userInfos.setUserId("userId");


        JsonObject expectedParams = new JsonObject().put("userId", "userId");


        Mockito.doAnswer((Answer<Void>) invocation -> {

            String queryResult = invocation.getArgument(0);
            JsonObject paramsResult = invocation.getArgument(1);
            ctx.assertEquals(queryResult, expectedQuery);
            ctx.assertEquals(paramsResult.toString(), expectedParams.toString());
            return null;
        }).when(neo4jRest).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));

        this.userService.getChildrenInformation(userInfos, event -> {});
    }
}

package fr.cgi.edt.sts;

import fr.cgi.edt.sts.bean.Subject;
import fr.cgi.edt.sts.bean.Teacher;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.common.neo4j.Neo4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;

import java.util.ArrayList;
import java.util.List;

@RunWith(VertxUnitRunner.class)
public class StsDAOTest {
    Neo4j neo4j = Mockito.mock(Neo4j.class);
    MongoDb mongoDb = Mockito.mock(MongoDb.class);
    StsDAO dao = new StsDAO(neo4j, mongoDb);

    String UAI = "0771991W";
    List<Teacher> TEACHERS = new ArrayList<>();
    List<Subject> SUBJECTS = new ArrayList<>();

    JsonObject CORRECT_TEACHERS_PARAMS;
    JsonObject CORRECT_SUBJECTS_PARAMS;

    @Before
    public void init() {
        Teacher teacher = new Teacher().setId("1").setLastName("DOE").setFirstName("John").setBirthDate("2018-09-03");
        CORRECT_TEACHERS_PARAMS = new JsonObject()
                .put("uai", UAI)
                .put("lastName_0", teacher.lastName().toLowerCase())
                .put("firstName_0", teacher.firstName().toLowerCase())
                .put("birthDate_0", teacher.birthDate());
        TEACHERS.add(teacher);

        Subject subject = new Subject().setCode("090100");
        SUBJECTS.add(subject);

        CORRECT_SUBJECTS_PARAMS = new JsonObject()
                .put("uai", UAI)
                .put("codes", new JsonArray().add(subject.code()));
    }

    @Test
    public void retrieveStructureIdentifier_Should_Generate_CorrectParameters(TestContext ctx) {
        Mockito.doAnswer((Answer<Void>) invocation -> {
            JsonObject params = invocation.getArgument(1);

            ctx.assertEquals(params, new JsonObject().put("uai", UAI));
            return null;
        }).when(neo4j).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));

        dao.retrieveStructureIdentifier(UAI, Future.future());
    }

    @Test
    public void retrieveTeachers_Should_Not_Call_Neo4jWithEmptyTeacherList_And_Returns_EmptyJsonArray(TestContext ctx) {
        Future future = Future.future();
        List futures = new ArrayList();
        futures.add(future);
        CompositeFuture.all(futures).setHandler(ar -> {
            if (ar.failed()) ctx.fail(ar.cause());
            else {
                ctx.assertTrue(((JsonArray) future.result()).isEmpty());
                Mockito.verify(neo4j, Mockito.never()).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));
            }
        });

        dao.retrieveTeachers(UAI, new ArrayList<>(), future);
    }

    @Test
    public void retrieveTeachers_Should_Process_CorrectRequestAndParameters_WithOnlyOneTeacher(TestContext ctx) {
        String CORRECT_REQUEST = "MATCH (s:Structure {UAI: {uai}})<-[:DEPENDS]-(:ProfileGroup)<-[:IN]-(u:User {profiles:['Teacher']}) WHERE (toLower(u.lastName) = {lastName_0} AND toLower(u.firstName) = {firstName_0} AND u.birthDate = {birthDate_0}) RETURN u.id AS id, u.lastName AS lastName, u.firstName AS firstName, u.birthDate as birthDate, u.displayName AS displayName";

        Mockito.doAnswer(invocation -> {
            String query = invocation.getArgument(0);
            JsonObject params = invocation.getArgument(1);

            ctx.assertEquals(query, CORRECT_REQUEST);
            ctx.assertEquals(params, CORRECT_TEACHERS_PARAMS);
            return null;
        }).when(neo4j).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));

        dao.retrieveTeachers(UAI, TEACHERS, Future.future());
    }

    @Test
    public void retrieveTeachers_Should_Process_CorrectRequestAndParameters_WithTwoTeachers(TestContext ctx) {
        String CORRECT_REQUEST = "MATCH (s:Structure {UAI: {uai}})<-[:DEPENDS]-(:ProfileGroup)<-[:IN]-(u:User {profiles:['Teacher']}) WHERE (toLower(u.lastName) = {lastName_0} AND toLower(u.firstName) = {firstName_0} AND u.birthDate = {birthDate_0}) OR (toLower(u.lastName) = {lastName_1} AND toLower(u.firstName) = {firstName_1} AND u.birthDate = {birthDate_1}) RETURN u.id AS id, u.lastName AS lastName, u.firstName AS firstName, u.birthDate as birthDate, u.displayName AS displayName";
        Teacher teacher = new Teacher().setId("1").setLastName("DOE").setFirstName("Jane").setBirthDate("2018-06-03");
        TEACHERS.add(teacher);
        CORRECT_TEACHERS_PARAMS
                .put("lastName_1", teacher.lastName().toLowerCase())
                .put("firstName_1", teacher.firstName().toLowerCase())
                .put("birthDate_1", teacher.birthDate());

        Mockito.doAnswer(invocation -> {
            String query = invocation.getArgument(0);
            JsonObject params = invocation.getArgument(1);

            ctx.assertEquals(query, CORRECT_REQUEST);
            ctx.assertEquals(params, CORRECT_TEACHERS_PARAMS);
            return null;
        }).when(neo4j).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));

        dao.retrieveTeachers(UAI, TEACHERS, Future.future());
    }

    @Test
    public void retrieveSubjects_Should_Not_Call_Neo4jWithEmptySubjectList_And_Returns_EmptyJsonArray(TestContext ctx) {
        Future future = Future.future();
        List futures = new ArrayList();
        futures.add(future);
        CompositeFuture.all(futures).setHandler(ar -> {
            if (ar.failed()) ctx.fail(ar.cause());
            else {
                ctx.assertTrue(((JsonArray) future.result()).isEmpty());
                Mockito.verify(neo4j, Mockito.never()).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));
            }
        });

        dao.retrieveSubjects(UAI, new ArrayList<>(), future);
    }

    @Test
    public void retrieveSubjects_Should_Process_CorrectRequestAndParameters_WithOnlyOneSubject(TestContext ctx) {
        String CORRECT_REQUEST = "MATCH (s:Structure {UAI: {uai}})<-[:SUBJECT]-(sub:Subject) WHERE sub.code IN {codes} RETURN sub.id AS id, sub.code AS code, sub.label AS label;";
        Mockito.doAnswer(invocation -> {
            String query = invocation.getArgument(0);
            JsonObject params = invocation.getArgument(1);

            ctx.assertEquals(query, CORRECT_REQUEST);
            ctx.assertEquals(params, CORRECT_SUBJECTS_PARAMS);
            return null;
        }).when(neo4j).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));

        dao.retrieveSubjects(UAI, SUBJECTS, Future.future());
    }

    @Test
    public void retrieveSubjects_Should_Process_CorrectRequestAndParameters_WithTwoSubjects(TestContext ctx) {
        String CORRECT_REQUEST = "MATCH (s:Structure {UAI: {uai}})<-[:SUBJECT]-(sub:Subject) WHERE sub.code IN {codes} RETURN sub.id AS id, sub.code AS code, sub.label AS label;";
        Subject subject = new Subject().setCode("109800");
        SUBJECTS.add(subject);
        CORRECT_SUBJECTS_PARAMS.put("codes", CORRECT_SUBJECTS_PARAMS.getJsonArray("codes").add(subject.code()));
        Mockito.doAnswer(invocation -> {
            String query = invocation.getArgument(0);
            JsonObject params = invocation.getArgument(1);

            ctx.assertEquals(query, CORRECT_REQUEST);
            ctx.assertEquals(params, CORRECT_SUBJECTS_PARAMS);
            return null;
        }).when(neo4j).execute(Mockito.anyString(), Mockito.any(JsonObject.class), Mockito.any(Handler.class));

        dao.retrieveSubjects(UAI, SUBJECTS, Future.future());
    }

}

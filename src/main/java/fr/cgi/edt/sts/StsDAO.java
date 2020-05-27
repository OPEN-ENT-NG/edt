package fr.cgi.edt.sts;

import fr.cgi.edt.sts.bean.Subject;
import fr.cgi.edt.sts.bean.Teacher;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.mongodb.MongoDbResult;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

public class StsDAO {

    private String COLLECTION = "courses";

    private Neo4j neo4j;
    private MongoDb mongoDb;

    public StsDAO(Neo4j neo4j, MongoDb mongoDb) {
        this.neo4j = neo4j;
        this.mongoDb = mongoDb;
    }

    public void retrieveStructureIdentifier(String uai, Future handler) {
        String query = "MATCH (s:Structure {UAI: {uai}}) RETURN s.id as id, s.name as name";
        JsonObject params = new JsonObject().put("uai", uai);
        neo4j.execute(query, params, Neo4jResult.validUniqueResultHandler(evt -> {
            if (evt.isLeft()) handler.fail(evt.left().getValue());
            else handler.complete(evt.right().getValue());
        }));
    }

    public void retrieveTeachers(String uai, List<Teacher> teachers, Future handler) {
        if (teachers.isEmpty()) {
            handler.complete(new JsonArray());
            return;
        }

        StringBuilder builder = new StringBuilder("MATCH (s:Structure {UAI: {uai}})<-[:DEPENDS]-(:ProfileGroup)<-[:IN]-(u:User {profiles:['Teacher']}) WHERE");
        JsonObject params = new JsonObject()
                .put("uai", uai);
        for (int i = 0; i < teachers.size(); i++) {
            Teacher teacher = teachers.get(i);
            builder.append(" (toLower(u.lastName) = {lastName_" + i + "} AND toLower(u.firstName) = {firstName_" + i + "} AND u.birthDate = {birthDate_" + i + "})");
            params.put("lastName_" + i, teacher.lastName().toLowerCase())
                    .put("firstName_" + i, teacher.firstName().toLowerCase())
                    .put("birthDate_" + i, teacher.birthDate());
            if (i < teachers.size() - 1) builder.append(" OR");
        }

        builder.append(" RETURN u.id AS id, u.lastName AS lastName, u.firstName AS firstName, u.birthDate as birthDate, u.displayName AS displayName");
        String query = builder.toString();
        neo4j.execute(query, params, Neo4jResult.validResultHandler(evt -> {
            if (evt.isLeft()) handler.fail(evt.left().getValue());
            else handler.complete(evt.right().getValue());
        }));
    }

    public void retrieveSubjects(String uai, List<Subject> subjects, Future handler) {
        if (subjects.isEmpty()) {
            handler.complete(new JsonArray());
            return;
        }

        JsonObject params = new JsonObject().put("uai", uai)
                .put("codes", new JsonArray(subjects.stream().map(Subject::code).collect(Collectors.toList())));
        String query = "MATCH (s:Structure {UAI: {uai}})<-[:SUBJECT]-(sub:Subject) WHERE sub.code IN {codes} RETURN sub.id AS id, sub.code AS code, sub.label AS label;";
        neo4j.execute(query, params, Neo4jResult.validResultHandler(evt -> {
            if (evt.isLeft()) handler.fail(evt.left().getValue());
            else handler.complete(evt.right().getValue());
        }));
    }

    public void insertCourses(JsonArray courses, Handler<AsyncResult<Void>> handler) {
        mongoDb.insert(COLLECTION, courses, MongoDbResult.validActionResultHandler(evt -> {
            if (evt.isLeft()) handler.handle(Future.failedFuture(evt.left().getValue()));
            else handler.handle(Future.succeededFuture());
        }));
    }

    public void dropFutureCourses(String structure, Handler<AsyncResult<Integer>> handler) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        String now = sdf.format(new Date());
        JsonObject dateMatcher = new JsonObject()
                .put("$gt", now);

        JsonObject matcher = new JsonObject()
                .put("structureId", structure)
                .put("startDate", dateMatcher)
                .put("source", "STS");
        mongoDb.delete(COLLECTION, matcher, MongoDbResult.validActionResultHandler(evt -> {
            if (evt.isLeft()) handler.handle(Future.failedFuture(evt.left().getValue()));
            else handler.handle(Future.succeededFuture(evt.right().getValue().getInteger("number")));
        }));
    }
}

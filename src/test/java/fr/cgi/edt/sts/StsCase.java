package fr.cgi.edt.sts;

import fr.cgi.edt.sts.defaultValues.DefaultStructure;
import fr.cgi.edt.sts.defaultValues.DefaultSubject;
import fr.cgi.edt.sts.defaultValues.DefaultTeacher;
import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import org.mockito.Mockito;

public class StsCase {
    protected Vertx vertx;
    protected StsImport sts;
    protected StsDAO dao;

    public StsCase(StsDAO dao) {
        this.vertx = Vertx.vertx();
        this.dao = dao;
        this.sts = new StsImport(vertx, dao);

        mockSubjects();
        mockTeachers();
        mockStructure();
        mockDropFutureCourses();
    }

    protected void mockDropFutureCourses(Integer value) {
        Mockito.doAnswer(invocation -> {
            Handler<AsyncResult<Integer>> handler = invocation.getArgument(1);
            handler.handle(Future.succeededFuture(value));
            return null;
        }).when(dao).dropFutureCourses(Mockito.anyString(), Mockito.any(Handler.class));
    }

    protected void mockDropFutureCourses() {
        mockDropFutureCourses(1024);
    }

    protected void mockTeachers(JsonArray teachers) {
        Mockito.doAnswer(invocation -> {
            Future future = invocation.getArgument(2);
            future.complete(teachers);
            return null;
        }).when(dao).retrieveTeachers(Mockito.anyString(), Mockito.anyList(), Mockito.any(Future.class));
    }

    protected void mockTeachers() {
        mockTeachers(new JsonArray().add(DefaultTeacher.DEFAULT_TEACHER));
    }

    protected void mockSubjects(JsonArray subjects) {
        Mockito.doAnswer(invocation -> {
            Future future = invocation.getArgument(2);
            future.complete(subjects);
            return null;
        }).when(dao).retrieveSubjects(Mockito.anyString(), Mockito.anyList(), Mockito.any(Future.class));
    }

    protected void mockSubjects() {
        mockSubjects(new JsonArray().add(DefaultSubject.DEFAULT_SUBJECT));
    }

    protected void mockStructure(JsonObject structure) {
        Mockito.doAnswer(invocation -> {
            Future future = invocation.getArgument(1);
            future.complete(structure);
            return null;
        }).when(dao).retrieveStructureIdentifier(Mockito.anyString(), Mockito.any(Future.class));
    }

    protected void mockStructure() {
        mockStructure(DefaultStructure.DEFAULT_STRUCTURE);
        this.sts.setRequestStructure(DefaultStructure.DEFAULT_STRUCTURE.getString("id"));
    }

    protected void expected(TestContext ctx, JsonArray expectation) {
        Async async = ctx.async();
        Mockito.doAnswer(invocation -> {
            JsonArray courses = invocation.getArgument(0);

            ctx.assertEquals(courses.size(), expectation.size());
            ctx.assertEquals(courses, expectation);
            async.complete();
            return null;
        }).when(dao).insertCourses(Mockito.any(JsonArray.class), Mockito.any(Handler.class));
    }

    protected void expectedError(TestContext ctx, String path, StsError expected) {
        Async async = ctx.async();
        sts.importFiles(path, ar -> {
            if (ar.failed()) {
                ctx.assertEquals(ar.cause().getMessage(), expected.key());
            } else ctx.fail("StsImport should trigger " + expected.name());
            async.complete();
        });
    }
}

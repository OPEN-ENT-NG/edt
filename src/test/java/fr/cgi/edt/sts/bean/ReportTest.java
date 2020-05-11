package fr.cgi.edt.sts.bean;

import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@RunWith(VertxUnitRunner.class)
public class ReportTest {
    Locale locale = Locale.FRANCE;
    Vertx vertx = Vertx.vertx();
    Report report = new Report(vertx, "fr");

    String firstName = "John";
    String lastName = "DOE";
    String birthDate = "1992-05-02";

    String code = "090100";
    String name = "ARTS PLASTIQUES";

    int count = 336;

    Teacher teacher = new Teacher().setFirstName(firstName).setLastName(lastName).setBirthDate(birthDate);
    Subject subject = new Subject().setCode(code).setName(name);

    @Test
    public void constructor_Should_Init_ReportWithEmptyTeachersListAndEmptySubjectsList(TestContext ctx) {
        ctx.assertTrue(report.unknownTeachers().isEmpty());
        ctx.assertTrue(report.unknownSubjects().isEmpty());
    }

    @Test
    public void addUnavailableTeacher_Should_Add_TeacherInTeachersList(TestContext ctx) {
        report.addUnknownTeacher(teacher);
        ctx.assertEquals(report.unknownTeachers().get(0).firstName(), firstName);
        ctx.assertEquals(report.unknownTeachers().get(0).lastName(), lastName);
        ctx.assertEquals(report.unknownTeachers().get(0).birthDate(), birthDate);
    }

    @Test
    public void addUnavailableTeacher_Twice_Should_Add_TeacherOnce(TestContext ctx) {
        report.addUnknownTeacher(teacher)
                .addUnknownTeacher(teacher);
        ctx.assertEquals(report.unknownTeachers().size(), 1);
        ctx.assertEquals(report.unknownTeachers().get(0).firstName(), firstName);
        ctx.assertEquals(report.unknownTeachers().get(0).lastName(), lastName);
        ctx.assertEquals(report.unknownTeachers().get(0).birthDate(), birthDate);
    }

    @Test
    public void addUnavailableSubject_Should_Add_SubjectInSubjectsList(TestContext ctx) {
        report.addUnknownSubject(subject);
        ctx.assertEquals(report.unknownSubjects().get(0).code(), code);
        ctx.assertEquals(report.unknownSubjects().get(0).name(), name);
    }


    @Test
    public void addUnavailableSubject_Twice_Should_Add_SubjectOnce(TestContext ctx) {
        report.addUnknownSubject(subject).addUnknownSubject(subject);
        ctx.assertEquals(report.unknownSubjects().size(), 1);
        ctx.assertEquals(report.unknownSubjects().get(0).code(), code);
        ctx.assertEquals(report.unknownSubjects().get(0).name(), name);
    }

    @Test
    public void setCount_Should_Set_CourseCountInsertionValue(TestContext ctx) {
        report.setCount(count);
        ctx.assertEquals(report.count(), count);
    }

    @Test
    public void setUAI_Should_Set_ValidUai(TestContext ctx) {
        String uai = "0771991W";
        report.setUAI(uai);
        ctx.assertEquals(report.uai(), uai);
    }

    @Test
    public void setTeacherCount_Should_Set_ValidTeacherCount(TestContext ctx) {
        int count = 16;
        report.setTeachersCount(count);
        ctx.assertEquals(report.teacherCount(), count);
    }

    @Test
    public void setDeletion_Should_Set_ValidDeletionNumber(TestContext ctx) {
        int deletion = 1024;
        report.setDeletion(deletion);
        ctx.assertEquals(report.deletion(), deletion);
    }

    @Test
    public void duration_Should_Generate_ValidDurationReport(TestContext ctx) {
        Async async = ctx.async();
        Date start = new Date();
        report.start();
        vertx.setTimer(1000, timer -> {
            Date end = new Date();
            report.end();

            SimpleDateFormat sdf = new SimpleDateFormat("EEEE dd MMMM yyyy HH:mm", locale);

            JsonObject duration = report.duration();
            long diff = end.getTime() - start.getTime();
            int gap = Math.round((diff) / 100) * 10;

            ctx.assertEquals(duration.getString("start"), sdf.format(start));
            ctx.assertEquals(duration.getString("end"), sdf.format(end));
            ctx.assertTrue(duration.getInteger("duration") <= (diff + gap) && duration.getInteger("duration") >= (diff - gap));
            async.complete();
        });
    }
}

package fr.cgi.edt.sts;

import fr.cgi.edt.sts.bean.*;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.ArrayList;
import java.util.List;

@RunWith(VertxUnitRunner.class)
public class StsCacheTest {
    StsCache cache;
    Teacher teacher;
    Subject subject;
    Alternation alternation;

    String UAI = "0771991W";
    String ALTERNATION_CODE = "SP";

    @Before
    public void init() {
        cache = new StsCache();
        subject = new Subject().setCode(SubjectTest.CODE).setName(SubjectTest.NAME);
        teacher = new Teacher()
                .setId(TeacherTest.ID)
                .setLastName(TeacherTest.LAST_NAME)
                .setFirstName(TeacherTest.FIRST_NAME)
                .setBirthDate(TeacherTest.BIRTH_DATE);
        alternation = new Alternation(ALTERNATION_CODE);
    }

    @Test
    public void constructor_Should_Init_CacheWithNullUai(TestContext ctx) {
        ctx.assertEquals(cache.uai(), null);
    }

    @Test
    public void constructor_Should_Init_CacheWithEmptyCoursesList(TestContext ctx) {
        ctx.assertTrue(cache.courses() != null);
        ctx.assertTrue(cache.courses().isEmpty());
        ctx.assertTrue(cache.courses() instanceof List);
    }

    @Test
    public void constructor_Should_Init_CacheWithEmptyTeachersList(TestContext ctx) {
        ctx.assertTrue(cache.teachers() != null);
        ctx.assertTrue(cache.teachers().isEmpty());
        ctx.assertTrue(cache.teachers() instanceof List);
    }

    @Test
    public void constructor_Should_Init_CacheWithEmptySubjectsList(TestContext ctx) {
        ctx.assertTrue(cache.subjects() != null);
        ctx.assertTrue(cache.subjects() instanceof List);
        ctx.assertTrue(cache.subjects().isEmpty());
    }

    @Test
    public void setUai_Should_Set_CacheUai(TestContext ctx) {
        cache.setUai(UAI);
        ctx.assertEquals(cache.uai(), UAI);
    }

    @Test
    public void addCourse_Should_Add_GivenCourseInCoursesList(TestContext ctx) {
        String roomName = "TP1";
        cache.addCourse(new Course().setRoom(roomName));
        ctx.assertFalse(cache.courses().isEmpty());
        ctx.assertEquals(cache.courses().get(0).toJSON().getJsonArray("roomLabels").getString(0), roomName);
    }

    @Test
    public void addAlternation_Should_Add_GivenAlternationInAlternationList(TestContext ctx) {
        cache.addAlternation(alternation);
        ctx.assertTrue(cache.alternation(ALTERNATION_CODE) != null);
    }

    @Test
    public void addSubject_Should_Add_GivenSubjectInSubjectsList(TestContext ctx) {
        cache.addSubject(subject);
        ctx.assertFalse(cache.subjects().isEmpty());
    }

    @Test
    public void addTeacher_Should_Add_GivenTeacherInTeacherList(TestContext ctx) {
        cache.addTeacher(teacher);
        ctx.assertFalse(cache.teachers().isEmpty());
    }

    @Test
    public void teacher_Should_Returns_InsertedTeacher(TestContext ctx) {
        cache.addTeacher(teacher);
        ctx.assertNotNull(cache.teacher(teacher.id()));
        ctx.assertEquals(cache.teacher(teacher.id()).id(), teacher.id());
    }

    @Test
    public void subject_Should_Returns_InsertedSubject(TestContext ctx) {
        cache.addSubject(subject);
        ctx.assertNotNull(cache.subject(subject.code()));
        ctx.assertEquals(cache.subject(subject.code()).code(), subject.code());
    }

    @Test
    public void alternations_Should_Returns_ValidAlternationsList(TestContext ctx) {
        cache.addAlternation(alternation);
        ArrayList<Alternation> expected = new ArrayList<>();
        expected.add(alternation);
        ctx.assertEquals(cache.alternations(), expected);
    }


}

package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(VertxUnitRunner.class)
public class CourseTest {

    Course course;

    JsonObject EMPTY_TOJSON = new JsonObject()
            .put("classes", new JsonArray())
            .put("groups", new JsonArray())
            .put("source", "STS")
            .put("theoretical", false)
            .put("teacherIds", new JsonArray())
            .put("roomLabels", new JsonArray());

    JsonArray TEACHER_IDS = new JsonArray().add("a25cd679-b30b-4701-8c60-231cdc30cdf2");
    String SUBJECT_ID = "a494d671-77f2-4fd6-9a04-2035dfe736b7";
    String STRUCTURE_ID = "5c04e497-cb43-4589-8332-16cc8a873920";
    String START_DATE = "2019-08-16T09:00:00";
    String END_DATE = "2019-08-23T10:00:00";
    String ROOM_NAME = "TP1";
    String SERVICE_CODE = "009801";
    String STS_TEACHER = "124611";
    String ALTERNATION_CODE = "SP";
    String DAY_OF_WEEK = "4";
    String DURATION = "0055";
    String START_TIME = "1400";
    JsonArray CLASSES = new JsonArray().add("3A");
    JsonArray GROUPS = new JsonArray().add("3A All Gr-1");

    @Before
    public void init() {
        course = new Course();
    }

    @Test
    public void toJSON_WithEmptyJsonObject_Should_Returns_EmptyToJsonObject(TestContext ctx) {
        Course course = new Course();
        ctx.assertEquals(course.toJSON(), EMPTY_TOJSON);
    }

    @Test
    public void setTeacherIds_Should_Set_TeacherIdsField(TestContext ctx) {
        course.setTeacherIds(TEACHER_IDS);
        ctx.assertEquals(course.toJSON().getJsonArray("teacherIds"), TEACHER_IDS);
    }

    @Test
    public void setSubjectId_Should_Set_SubjectIdField(TestContext ctx) {
        course.setSubjectId(SUBJECT_ID);
        ctx.assertEquals(course.toJSON().getString("subjectId"), SUBJECT_ID);
    }

    @Test
    public void setStructureId_Should_Set_StructureIdField(TestContext ctx) {
        course.setStructureId(STRUCTURE_ID);
        ctx.assertEquals(course.toJSON().getString("structureId"), STRUCTURE_ID);
    }

    @Test
    public void setStartDate_Should_Set_StartDateField(TestContext ctx) {
        course.setStartDate(START_DATE);
        ctx.assertEquals(course.toJSON().getString("startDate"), START_DATE);
    }

    @Test
    public void setEndDate_Should_Set_EndDateField(TestContext ctx) {
        course.setEndDate(END_DATE);
        ctx.assertEquals(course.toJSON().getString("endDate"), END_DATE);
    }

    @Test
    public void setRoom_Should_Insert_RoomInRoomLabelsArray(TestContext ctx) {
        course.setRoom(ROOM_NAME);
        ctx.assertEquals(course.toJSON().getJsonArray("roomLabels").getString(0), ROOM_NAME);
    }

    @Test
    public void setServiceCode_Should_Set_ServiceCode(TestContext ctx) {
        course.setServiceCode(SERVICE_CODE);
        ctx.assertEquals(course.serviceCode(), SERVICE_CODE);
    }

    @Test
    public void setStsTeachers_Should_Set_StsTeachers(TestContext ctx) {
        course.setStsTeacher(STS_TEACHER);
        ctx.assertEquals(course.stsTeacher(), STS_TEACHER);
    }

    @Test
    public void setAlternationCode_Should_Set_AlternationCode(TestContext ctx) {
        course.setAlternation(ALTERNATION_CODE);
        ctx.assertEquals(course.alternation(), ALTERNATION_CODE);
    }

    @Test
    public void setDayOfWeek_Should_Set_DayOfWeekNumber(TestContext ctx) {
        course.setDayOfWeek(DAY_OF_WEEK);
        ctx.assertEquals(course.dayOfWeek(), Integer.parseInt(DAY_OF_WEEK));
    }

    @Test
    public void setDuration_Should_Set_DurationValue(TestContext ctx) {
        course.setDuration(DURATION);
        ctx.assertEquals(course.duration(), DURATION);
    }

    @Test
    public void setStartTime_Should_Set_StartTimeValue(TestContext ctx) {
        course.setStartTime(START_TIME);
        ctx.assertEquals(course.startTime(), START_TIME);
    }

    @Test
    public void setClasses_Should_Set_ClassesValues(TestContext ctx) {
        course.setClasses(CLASSES);
        ctx.assertEquals(course.toJSON().getJsonArray("classes"), CLASSES);
    }

    @Test
    public void setGroups_Should_Set_GroupsValues(TestContext ctx) {
        course.setGroups(GROUPS);
        ctx.assertEquals(course.toJSON().getJsonArray("groups"), GROUPS);
    }
}

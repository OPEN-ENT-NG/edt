package fr.cgi.edt.sts.cases;

import fr.cgi.edt.sts.StsCase;
import fr.cgi.edt.sts.StsDAO;
import fr.cgi.edt.sts.defaultValues.DefaultStructure;
import fr.cgi.edt.sts.defaultValues.DefaultSubject;
import fr.cgi.edt.sts.defaultValues.DefaultTeacher;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;

@RunWith(VertxUnitRunner.class)
public class Case7 extends StsCase {
    /*
        Test case 7 :
            1 class: 3A
            1 group 3B_G2
            2 teachers: Jane Doe, John DOE
            2 subject: Français, HISTOIRE-GEOGRAPHIE
            2 alternation with 2 weeks: H, SA
     */
    public Case7() {
        super(Mockito.mock(StsDAO.class));
    }

    @Before
    public void init() {
        JsonArray teachers = new JsonArray()
                .add(DefaultTeacher.DEFAULT_TEACHER)
                .add(DefaultTeacher.DEFAULT_TEACHER_2);
        super.mockTeachers(teachers);

        JsonArray subjects = new JsonArray()
                .add(DefaultSubject.DEFAULT_SUBJECT)
                .add(DefaultSubject.DEFAULT_SUBJECT_2);
        super.mockSubjects(subjects);
    }

    @Test
    public void importSts_Should_Import_TwoCoursesWithAClass(TestContext ctx) {
        String path = "./src/main/resources/sts/tests/case7";
        JsonObject courseClass1 = new JsonObject()
                .put("classes", new JsonArray().add("3A"))
                .put("groups", new JsonArray())
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID))
                .put("roomLabels", new JsonArray().add("15"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID)
                .put("dayOfWeek", 4)
                .put("startDate", "2099-09-03T14:02:00")
                .put("endDate", "2099-09-03T15:02:00")
                .put("source", "STS");
        JsonObject courseClass2 = new JsonObject()
                .put("classes", new JsonArray().add("3A"))
                .put("groups", new JsonArray())
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID))
                .put("roomLabels", new JsonArray().add("15"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID)
                .put("dayOfWeek", 4)
                .put("startDate", "2099-09-10T14:02:00")
                .put("endDate", "2099-09-10T15:02:00")
                .put("source", "STS");

        JsonObject courseGroup1 = new JsonObject()
                .put("classes", new JsonArray())
                .put("groups", new JsonArray().add("3B_G2"))
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID_2))
                .put("roomLabels", new JsonArray().add("23"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID_2)
                .put("dayOfWeek", 2)
                .put("startDate", "2099-09-01T15:13:00")
                .put("endDate", "2099-09-01T17:13:00")
                .put("source", "STS");
        JsonObject courseGroup2 = new JsonObject()
                .put("classes", new JsonArray())
                .put("groups", new JsonArray().add("3B_G2"))
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID_2))
                .put("roomLabels", new JsonArray().add("23"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID_2)
                .put("dayOfWeek", 2)
                .put("startDate", "2099-09-15T15:13:00")
                .put("endDate", "2099-09-15T17:13:00")
                .put("source", "STS");

        JsonArray expectation = new JsonArray()
                .add(courseClass1)
                .add(courseClass2)
                .add(courseGroup1)
                .add(courseGroup2);

        expected(ctx, expectation);
        sts.importFiles(path, null);
    }
}

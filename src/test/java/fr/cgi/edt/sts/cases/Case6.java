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
public class Case6 extends StsCase {

    /*
        Test case 6 :
            1 class: 3AB_G2
            1 teacher: Jane Doe
            1 subject: Français
            1 alternation with 2 weeks every 2 weeks: H
    */
    public Case6() {
        super(Mockito.mock(StsDAO.class));
    }

    @Before
    public void init() {
        mockStructure();
        mockSubjects();
        mockTeachers();
    }

    @Test
    public void importSts_Should_Import_TwoCoursesWithAGroup(TestContext ctx) {
        String path = "./src/main/resources/sts/tests/case6";
        JsonObject course1 = new JsonObject()
                .put("classes", new JsonArray())
                .put("groups", new JsonArray().add("3B_G2"))
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID))
                .put("roomLabels", new JsonArray().add("23"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID)
                .put("dayOfWeek", 4)
                .put("startDate", "2099-09-03T15:13:00")
                .put("endDate", "2099-09-03T16:13:00")
                .put("source", "STS");
        JsonObject course2 = new JsonObject()
                .put("classes", new JsonArray())
                .put("groups", new JsonArray().add("3B_G2"))
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID))
                .put("roomLabels", new JsonArray().add("23"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID)
                .put("dayOfWeek", 4)
                .put("startDate", "2099-09-17T15:13:00")
                .put("endDate", "2099-09-17T16:13:00")
                .put("source", "STS");

        JsonArray expectation = new JsonArray()
                .add(course1)
                .add(course2);
        expected(ctx, expectation);
        sts.importFiles(path, null);
    }
}

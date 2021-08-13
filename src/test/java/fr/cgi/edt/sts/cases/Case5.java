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
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;

@RunWith(VertxUnitRunner.class)
public class Case5 extends StsCase {
    /*
        Test case 5 :
            1 class: 3A
            1 teacher: Jane Doe
            1 subject: Français
            1 alternation with 2 weeks every two weeks: H
     */
    public Case5() {
        super(Mockito.mock(StsDAO.class));
    }
    
    @Test
    public void importSts_Should_Import_TwoCoursesWithAClassEvery2Weeks(TestContext ctx) {
        String path = "./src/main/resources/sts/tests/case5";
        JsonObject course1 = new JsonObject()
                .put("classes", new JsonArray().add("3A"))
                .put("classesExternalIds", new JsonArray().add(String.format("%d$3A", STRUCTURE_EXTERNAL_ID_CODE)))
                .put("groups", new JsonArray())
                .put("groupsExternalIds", new JsonArray())
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID))
                .put("roomLabels", new JsonArray().add("15"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID)
                .put("dayOfWeek", 4)
                .put("theoretical", false)
                .put("startDate", "2099-09-03T14:02:00")
                .put("endDate", "2099-09-03T15:02:00")
                .put("startTime", "1402")
                .put("duration", "0100")
                .put("source", "STS");
        JsonObject course2 = new JsonObject()
                .put("classes", new JsonArray().add("3A"))
                .put("classesExternalIds", new JsonArray().add(String.format("%d$3A", STRUCTURE_EXTERNAL_ID_CODE)))
                .put("groups", new JsonArray())
                .put("groupsExternalIds", new JsonArray())
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID))
                .put("roomLabels", new JsonArray().add("15"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID)
                .put("dayOfWeek", 4)
                .put("theoretical", false)
                .put("startDate", "2099-09-17T14:02:00")
                .put("endDate", "2099-09-17T15:02:00")
                .put("startTime", "1402")
                .put("duration", "0100")
                .put("source", "STS");
        JsonArray expectation = new JsonArray()
                .add(course1)
                .add(course2);

        expected(ctx, expectation);
        sts.importFiles(path, null);
    }
}

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
public class Case8 extends StsCase {
    /*
        Test case 7 :
            1 class: 3A
            1 teachers: Jane Doe
            2 subject: Français
            1 alternation with 2 weeks: 1 week is a past week so import generate only 1 course
     */
    public Case8() {
        super(Mockito.mock(StsDAO.class));
    }

    @Test
    public void importSts_Should_Import_TwoCoursesWithAClass(TestContext ctx) {
        String path = "./src/main/resources/sts/tests/case8";
        JsonObject courseClass = new JsonObject()
                .put("classes", new JsonArray().add("3A"))
                .put("groups", new JsonArray())
                .put("teacherIds", new JsonArray().add(DefaultTeacher.TEACHER_ID))
                .put("roomLabels", new JsonArray().add("15"))
                .put("structureId", DefaultStructure.STRUCTURE_ID)
                .put("subjectId", DefaultSubject.SUBJECT_ID)
                .put("dayOfWeek", 4)
                .put("theoretical", false)
                .put("startDate", "2099-09-10T14:02:00")
                .put("endDate", "2099-09-10T15:02:00")
                .put("source", "STS");


        JsonArray expectation = new JsonArray()
                .add(courseClass);

        expected(ctx, expectation);
        sts.importFiles(path, null);
    }
}

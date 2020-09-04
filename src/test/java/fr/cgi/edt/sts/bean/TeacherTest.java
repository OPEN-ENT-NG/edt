package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(VertxUnitRunner.class)
public class TeacherTest {
    Teacher teacher;

    public static String ID = "35160";
    public static String FIRST_NAME = "John";
    public static String LAST_NAME = "DOE";
    public static String BIRTH_DATE = "1964-02-20";

    @Before
    public void init() {
        teacher = new Teacher();
    }

    @Test
    public void constructor_Should_Init_TeacherWithNullValue(TestContext ctx) {
        ctx.assertNull(teacher.id());
        ctx.assertNull(teacher.firstName());
        ctx.assertNull(teacher.lastName());
        ctx.assertNull(teacher.birthDate());
    }

    @Test
    public void setId_Should_Set_TeacherIdentifier(TestContext ctx) {
        teacher.setId(ID);
        ctx.assertNotNull(teacher.id());
        ctx.assertEquals(teacher.id(), ID);
    }

    @Test
    public void setLastName_Should_Set_TeacherLastName(TestContext ctx) {
        teacher.setLastName(LAST_NAME);
        ctx.assertNotNull(teacher.lastName());
        ctx.assertEquals(teacher.lastName(), LAST_NAME);
    }

    @Test
    public void setFirstName_Should_Set_TeacherFirstName(TestContext ctx) {
        teacher.setFirstName(FIRST_NAME);
        ctx.assertNotNull(teacher.firstName());
        ctx.assertEquals(teacher.firstName(), FIRST_NAME);
    }

    @Test
    public void setBirthDate_Should_Set_TeacherBirthDate(TestContext ctx) {
        teacher.setBirthDate(BIRTH_DATE);
        ctx.assertNotNull(teacher.birthDate());
        ctx.assertEquals(teacher.birthDate(), BIRTH_DATE);
    }

    @Test
    public void valid_Should_Returns_AValidState(TestContext ctx) {
        Teacher teacher = new Teacher();
        teacher.setId(ID).setFirstName(FIRST_NAME).setLastName(LAST_NAME).setBirthDate(BIRTH_DATE);
        ctx.assertTrue(teacher.valid());
    }

    @Test
    public void valid_Should_Returns_AnInvalidState_Because_AllValuesAreNull(TestContext ctx) {
        ctx.assertFalse(new Teacher().valid());
    }

    @Test
    public void valid_Should_Returns_AnInvalidState_Because_AllValuesAreNullExceptId(TestContext ctx) {
        Teacher teacher = new Teacher().setId(ID);
        ctx.assertFalse(teacher.valid());
    }

    @Test
    public void valid_Should_Returns_AnInvalidState_Because_BirthDateAndLastNameAreNull(TestContext ctx) {
        Teacher teacher = new Teacher().setId(ID).setFirstName(FIRST_NAME);
        ctx.assertFalse(teacher.valid());
    }

    @Test
    public void valid_Should_Returns_AnInvalidState_Because_BirthDateIsNull(TestContext ctx) {
        Teacher teacher = new Teacher().setId(ID).setFirstName(FIRST_NAME).setLastName(LAST_NAME);
        ctx.assertFalse(teacher.valid());
    }

    @Test
    public void mapId_Should_Returns_ConcatenationOfLastNameFirstNameAndBirthDate(TestContext ctx) {
        teacher.setId(ID).setFirstName(FIRST_NAME).setLastName(LAST_NAME).setBirthDate(BIRTH_DATE);
        ctx.assertEquals(teacher.mapId(), teacher.lastName() + "-" + teacher.firstName() + "-" + teacher.birthDate());
    }

    @Test
    public void toJSON_Should_Returns_ValidJsonObject(TestContext ctx) {
        teacher.setId(ID).setFirstName(FIRST_NAME).setLastName(LAST_NAME).setBirthDate(BIRTH_DATE);
        JsonObject expected = new JsonObject()
                .put("onError", false)
                .put("id", ID)
                .put("lastName", LAST_NAME)
                .put("firstName", FIRST_NAME)
                .put("birthDate", BIRTH_DATE);

        ctx.assertEquals(teacher.toJSON(), expected);
    }
}

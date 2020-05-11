package fr.cgi.edt.sts.bean;

import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(VertxUnitRunner.class)
public class ServiceTest {
    Service service;

    String CODE = "030201";
    String TEACHER = "35160";

    @Before

    public void init() {
        service = new Service();
    }

    @Test
    public void setCode_Should_Set_CodeValue(TestContext ctx) {
        ctx.assertEquals(service.setCode(CODE).code(), CODE);
    }

    @Test
    public void setTeacher_Should_Set_TeacherValue(TestContext ctx) {
        ctx.assertEquals(service.setTeacher(TEACHER).teacher(), TEACHER);
    }
}

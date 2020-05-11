package fr.cgi.edt.sts.defaultValues;

import io.vertx.core.json.JsonObject;

public class DefaultTeacher {
    public static String TEACHER_ID = "ecd3caa8-2c72-44b4-af6a-9920092ce31f";
    public static String TEACHER_ID_2 = "81024a7d-c856-49e3-9a75-d64f7de67b4d";


    public static JsonObject DEFAULT_TEACHER = new JsonObject()
            .put("id", TEACHER_ID)
            .put("lastName", "DOE")
            .put("firstName", "Jane")
            .put("birthDate", "1975-02-27");

    public static JsonObject DEFAULT_TEACHER_2 = new JsonObject()
            .put("id", TEACHER_ID_2)
            .put("lastName", "DOE")
            .put("firstName", "John")
            .put("birthDate", "1958-09-17");
}

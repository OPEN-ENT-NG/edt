package fr.cgi.edt.sts.defaultValues;

import io.vertx.core.json.JsonObject;

public class DefaultSubject {
    public static String SUBJECT_ID = "2093964-1537923756872";
    public static String SUBJECT_ID_2 = "1835571-1535020657012";

    public static JsonObject DEFAULT_SUBJECT = new JsonObject()
            .put("id", SUBJECT_ID)
            .put("code", "020700")
            .put("label", "FRANCAIS");

    public static JsonObject DEFAULT_SUBJECT_2 = new JsonObject()
            .put("id", SUBJECT_ID_2)
            .put("code", "043700")
            .put("label", "HISTOIRE-GEOGRAPHIE");
}

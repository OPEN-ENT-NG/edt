package fr.cgi.edt.sts.defaultValues;

import io.vertx.core.json.JsonObject;

public class DefaultStructure {
    public static String STRUCTURE_ID = "6fee69df-9a7f-48a3-98c3-18eff01f859b";
    
    public static JsonObject DEFAULT_STRUCTURE = new JsonObject()
            .put("id", STRUCTURE_ID)
            .put("name", "CLG-LOUIS ARAGON-TORCY");
}

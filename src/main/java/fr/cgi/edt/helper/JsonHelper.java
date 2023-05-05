package fr.cgi.edt.helper;

import io.vertx.core.json.JsonArray;
import java.util.List;
import java.util.stream.Collectors;

public class JsonHelper {

    private JsonHelper() {
        throw new IllegalStateException("Utility class");
    }

    public static <T> List<T> jsonArrayToList(JsonArray jsonArray, Class<T> tClass) {
        return jsonArray.stream()
                .filter(tClass::isInstance)
                .map(tClass::cast)
                .collect(Collectors.toList());
    }
}
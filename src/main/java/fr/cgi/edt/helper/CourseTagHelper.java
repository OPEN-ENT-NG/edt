package fr.cgi.edt.helper;

import fr.cgi.edt.models.CourseTag;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import java.util.List;
import java.util.stream.Collectors;

public class CourseTagHelper {

    private CourseTagHelper() { throw new IllegalStateException("Helper class"); }

    /**
     * Convert JsonArray into course tag list
     *
     * @param courseTagArray jsonArray response
     * @return new list of course tags
     */
    public static List<CourseTag> getCourseTagListFromJsonArray(JsonArray courseTagArray) {
        return courseTagArray.stream().map(c -> new CourseTag((JsonObject) c)).collect(Collectors.toList());
    }
}

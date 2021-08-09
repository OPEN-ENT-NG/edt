package fr.cgi.edt.models.holiday;

import io.vertx.core.json.*;

public class HolidaysConfig {

    private final String publicHolidaysUrl;
    private final String schoolHolidaysUrl;

    public HolidaysConfig(JsonObject holidaysConfig) {
        this.publicHolidaysUrl = holidaysConfig.getString("public-holidays", null);
        this.schoolHolidaysUrl = holidaysConfig.getString("school-holidays", null);
    }

    public String publicHolidaysUrl() {
        return publicHolidaysUrl;
    }

    public String schoolHolidaysUrl() {
        return schoolHolidaysUrl;
    }
}

package fr.cgi.edt.models.holiday;


import fr.cgi.edt.core.constants.Field;
import io.vertx.core.json.JsonObject;

public class HolidayRecord {

    private final String description;
    private final String startAt;
    private final String endAt;
    private final String zones;
    private final String schoolYear;
    private final String location;
    private final String population;

    public HolidayRecord(JsonObject field) {
        this.description = field.getString(Field.DESCRIPTION);
        this.startAt = field.getString(Field.START_DATE);
        this.endAt = field.getString(Field.END_DATE, startAt);
        this.zones = field.getString(Field.ZONES);
        this.schoolYear = field.getString(Field.SCHOOL_YEAR_FR);
        this.location = field.getString(Field.LOCATION);
        this.population = field.getString(Field.POPULATION);
    }

    public String description() {
        return description;
    }

    public String startAt() {
        return startAt;
    }

    public String endAt() {
        return endAt;
    }

}

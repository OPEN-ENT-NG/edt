package fr.cgi.edt.models;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.core.enums.DayOfWeek;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class InitFormTimetable implements IModel<InitFormTimetable> {

    private static Logger log =  LoggerFactory.getLogger(InitFormTimetable.class);

    private JsonObject morning;
    private JsonObject afternoon;
    private List<DayOfWeek> fullDays;
    private List<DayOfWeek> halfDays;

    public InitFormTimetable() {
    }

    public InitFormTimetable(JsonObject json) {
        this.morning = json.getJsonObject(Field.MORNING);
        this.afternoon = json.getJsonObject(Field.AFTERNOON);
        this.fullDays = json.getJsonArray(Field.FULLDAYS).stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(DayOfWeek::getValue)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        this.halfDays = json.getJsonArray(Field.HALFDAYS).stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(DayOfWeek::getValue)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public JsonObject getMorning() {
        return morning;
    }

    public InitFormTimetable setMorning(JsonObject morning) {
        this.morning = morning;
        return this;
    }

    public JsonObject getAfternoon() {
        return afternoon;
    }

    public InitFormTimetable setAfternoon(JsonObject afternoon) {
        this.afternoon = afternoon;
        return this;
    }

    public List<DayOfWeek> getFullDays() {
        return fullDays;
    }

    public InitFormTimetable setFullDays(List<DayOfWeek> fullDays) {
        this.fullDays = fullDays;
        return this;
    }

    public List<DayOfWeek> getHalfDays() {
        return halfDays;
    }

    public InitFormTimetable setHalfDays(List<DayOfWeek> halfDays) {
        this.halfDays = halfDays;
        return this;
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
                .put(Field.MORNING, this.morning)
                .put(Field.AFTERNOON, this.afternoon)
                .put(Field.FULLDAYS, new JsonArray(this.fullDays.stream().map(DayOfWeek::name).collect(Collectors.toList())))
                .put(Field.HALFDAYS, new JsonArray(this.halfDays.stream().map(DayOfWeek::name).collect(Collectors.toList())));
    }
}


package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Alternation {
    private String name;
    private String label;
    private List<Week> weeks;

    public Alternation(String name) {
        this.name = name;
        this.weeks = new ArrayList<>();
    }

    public Alternation putWeek(Week week) {
        this.weeks.add(week);
        return this;
    }

    public Alternation setLabel(String label) {
        this.label = label;
        return this;
    }

    public String label() {
        return this.label;
    }

    public String name() {
        return this.name;
    }

    public List<Week> weeks() {
        return this.weeks;
    }

    public JsonObject toJSON() {
        return new JsonObject()
                .put("name", this.name())
                .put("label", this.label())
                .put("weeks", new JsonArray(this.weeks().stream().map(Week::toJSON).collect(Collectors.toList())));
    }
}

package fr.cgi.edt.models;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.helper.IModelHelper;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Audience implements IModel<Audience> {

    private String id;
    private String externalId;
    private String name;
    private List<String> labels;

    public Audience(JsonObject audience) {
        this.id = audience.getString(Field.ID, "");
        this.externalId = audience.getString(Field.EXTERNALID, "");
        this.name = audience.getString(Field.NAME, "");
        this.labels = audience.getJsonArray(Field.LABELS) != null ?
                audience.getJsonArray(Field.LABELS, new JsonArray())
                        .stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .collect(Collectors.toList()) : new ArrayList<>();
    }

    public Audience() {
        this.id = "";
        this.externalId = "";
        this.name = "";
        this.labels = new ArrayList<>();
    }

    public Audience(String audienceId) {
        this.id = audienceId;
    }

    public JsonObject toJson() {
        return IModelHelper.toJson(this, false, false);
    }

    public String getId() {
        return id;
    }

    public Audience setId(String id) {
        this.id = id;
        return this;
    }

    public String getName() {
        return name;
    }

    public Audience setName(String name) {
        this.name = name;
        return this;
    }

    public String getExternalId() {
        return externalId;
    }

    public Audience setExternalId(String externalId) {
        this.externalId = externalId;
        return this;
    }

    public List<String> getLabels() {
        return labels;
    }

    public Audience setLabels(List<String> labels) {
        this.labels = labels;
        return this;
    }
}

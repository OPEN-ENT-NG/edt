package fr.cgi.edt.models;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;

public class Audience {

    private String id;
    private String externalId;
    private String name;
    private List<String> labels;

    public Audience(JsonObject audience) {
        this.id = audience.getString("id", "");
        this.externalId = audience.getString("externalId", "");
        this.name = audience.getString("name", "");
        this.labels = audience.getJsonArray("labels") != null ?
                audience.getJsonArray("labels", new JsonArray()).getList() : new ArrayList<>();
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

    public JsonObject toJSON() {
        return new JsonObject()
                .put("id", this.id)
                .put("externalId", this.externalId)
                .put("name", this.name)
                .put("labels", this.labels);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public List<String> getLabels() {
        return labels;
    }

    public void setLabels(List<String> labels) {
        this.labels = labels;
    }
}

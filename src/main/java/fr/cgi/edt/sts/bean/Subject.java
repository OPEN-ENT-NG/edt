package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonObject;

public class Subject {
    private String code;
    private String name;

    public Subject() {
    }

    public Subject setCode(String code) {
        this.code = code.trim();
        return this;
    }

    public Subject setName(String name) {
        this.name = name.trim();
        return this;
    }

    public String code() {
        return this.code;
    }

    public String name() {
        return this.name;
    }

    public JsonObject toJSON() {
        return new JsonObject()
                .put("code", this.code())
                .put("name", this.name());
    }
}

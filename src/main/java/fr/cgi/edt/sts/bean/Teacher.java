package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonObject;

public class Teacher {
    private String id;
    private String lastName;
    private String firstName;
    private String birthDate;
    private Boolean onStsError = false;

    public Teacher() {
    }

    public Teacher setId(String id) {
        this.id = id.trim();
        return this;
    }

    public Teacher setLastName(String lastName) {
        this.lastName = lastName.trim();
        return this;
    }

    public Teacher setFirstName(String firstName) {
        this.firstName = firstName.trim();
        return this;
    }

    public Teacher setBirthDate(String birthDate) {
        this.birthDate = birthDate.trim();
        return this;
    }

    public Teacher onError() {
        this.onStsError = true;
        return this;
    }


    public String id() {
        return this.id;
    }

    public String lastName() {
        return lastName;
    }

    public String firstName() {
        return firstName;
    }

    public String birthDate() {
        return birthDate;
    }

    public boolean valid() {
        return this.id() != null
                && this.lastName() != null
                && this.firstName() != null
                && this.birthDate() != null;
    }

    public String mapId() {
        return this.lastName() + "-" + this.firstName() + "-" + this.birthDate();
    }

    public JsonObject toJSON() {
        return new JsonObject()
                .put("onError", this.onStsError)
                .put("id", this.id())
                .put("lastName", this.lastName())
                .put("firstName", this.firstName())
                .put("birthDate", this.birthDate());
    }
}

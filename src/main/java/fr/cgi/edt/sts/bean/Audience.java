package fr.cgi.edt.sts.bean;

public class Audience {
    private AudienceType type;
    private String name;

    public Audience(AudienceType type, String name) {
        this.type = type;
        this.name = name;
    }

    public AudienceType type() {
        return this.type;
    }

    public String name() {
        return this.name;
    }

}

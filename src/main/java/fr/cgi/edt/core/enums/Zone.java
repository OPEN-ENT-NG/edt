package fr.cgi.edt.core.enums;

public enum Zone {
    A("A"),
    B("B"),
    C("C");

    private final String zoneType;

    Zone(String zoneType) {
        this.zoneType = zoneType;
    }

    public String zone() {
        return this.zoneType;
    }
}

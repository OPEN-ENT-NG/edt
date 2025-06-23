package fr.cgi.edt.core.enums;

public enum Zone {
    ZONE_A("Zone A"),
    ZONE_B("Zone B"),
    ZONE_C("Zone C"),
    CORSE("Corse"),
    GUADELOUPE("Guadeloupe"),
    GUYANE("Guyane"),
    MARTINIQUE("Martinique"),
    MAYOTTE("Mayotte"),
    NOUVELLE_CALEDONIE("Nouvelle Calédonie"),
    POLYNESIE("Polynésie"),
    REUNION("Réunion"),
    SAINT_PIERRE_ET_MIQUELON("Saint Pierre et Miquelon"),
    WALLIS_ET_FUTUNA("Wallis et Futuna");

    private final String zoneType;

    Zone(String zoneType) {
        this.zoneType = zoneType;
    }

    public String zone() {
        return this.zoneType;
    }
}

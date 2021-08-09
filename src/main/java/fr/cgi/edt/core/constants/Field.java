package fr.cgi.edt.core.constants;

public class Field {

    public static final String ID = "id";
    public static final String NAME = "name";
    public static final String STRUCTURE = "structure";
    public static final String FIELDS = "fields";
    public static final String DESCRIPTION = "description";
    public static final String EXCLUSION = "EXCLUSION";
    public static final String YEAR = "YEAR";
    public static final String RECORDS = "records";
    public static final String POPULATION = "population";

    // Zones
    public static final String ZONE = "zone";
    public static final String ZONES = "zones";
    public static final String LOCATION = "location";

    // Dates
    public static final String END_DATE = "end_date";
    public static final String START_DATE = "start_date";
    public static final String SCHOOL_YEAR_FR = "annee_scolaire";

    // i18n
    public static final String LOCALE = "locale";
    public static final String DOMAIN = "domain";


    private Field() {
        throw new IllegalStateException("Utility class");
    }
}

package fr.cgi.edt.core.constants;

public class Field {

    public static final String ID = "id";
    public static final String _ID = "_id";
    public static final String NAME = "name";
    public static final String STRUCTURE = "structure";
    public static final String STRUCTURE_ID = "structure_id";
    public static final String STRUCTUREID = "structureId";
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
    public static final String STARTDATE = "startDate";
    public static final String ENDDATE = "endDate";
    public static final String CREATED_AT = "created_at";
    public static final String CREATEDAT = "createdAt";
    public static final String SCHOOL_YEAR_FR = "annee_scolaire";

    // i18n
    public static final String LOCALE = "locale";
    public static final String DOMAIN = "domain";

    // Course tags
    public static final String LABEL = "label";
    public static final String ABBREVIATION = "abbreviation";
    public static final String ISHIDDEN = "isHidden";
    public static final String IS_HIDDEN = "is_hidden";
    public static final String ISPRIMARY = "isPrimary";
    public static final String IS_PRIMARY = "is_primary";
    public static final String ISUSED = "isUsed";
    public static final String TAGS = "tags";
    public static final String TAGID = "tagId";
    public static final String TAGIDS = "tagIds";

    // Course
    public static final String RECURRENCE = "recurrence";
    public static final String DELETED = "deleted";
    public static final String COURSEIDS = "courseIds";

    private Field() {
        throw new IllegalStateException("Utility class");
    }
}

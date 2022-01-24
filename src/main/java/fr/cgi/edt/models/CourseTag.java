package fr.cgi.edt.models;

import fr.cgi.edt.core.constants.Field;
import io.vertx.core.json.JsonObject;

public class CourseTag {

    private Long id;
    private String structureId;
    private String label;
    private String abbreviation;
    private boolean isPrimary;
    private boolean allowRegister;
    private boolean isHidden;
    private boolean isUsed;
    private final String createdAt;

    public CourseTag(JsonObject courseTag) {
        this.id = courseTag.getLong(Field.ID, null);
        this.structureId = courseTag.getString(Field.STRUCTURE_ID, "");
        this.label = courseTag.getString(Field.LABEL, "");
        this.abbreviation = courseTag.getString(Field.ABBREVIATION, "");
        this.isPrimary = courseTag.getBoolean(Field.IS_PRIMARY, false);
        this.allowRegister = courseTag.getBoolean(Field.ALLOW_REGISTER, true);
        this.isHidden = courseTag.getBoolean(Field.IS_HIDDEN, false);
        this.isUsed = courseTag.getBoolean(Field.ISUSED, false);
        this.createdAt = courseTag.getString(Field.CREATED_AT, "");
    }

    public JsonObject toJSON() {
        return new JsonObject()
                .put(Field.ID, this.id)
                .put(Field.STRUCTUREID, this.structureId)
                .put(Field.LABEL, this.label)
                .put(Field.ABBREVIATION, this.abbreviation)
                .put(Field.ISPRIMARY, this.isPrimary)
                .put(Field.ALLOWREGISTER, this.allowRegister)
                .put(Field.ISHIDDEN, this.isHidden)
                .put(Field.ISUSED, this.isUsed)
                .put(Field.CREATEDAT, this.createdAt);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStructureId() {
        return structureId;
    }

    public void setStructureId(String structureId) {
        this.structureId = structureId;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getAbbreviation() {
        return abbreviation;
    }

    public void setAbbreviation(String abbreviation) {
        this.abbreviation = abbreviation;
    }

    public boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public boolean getAllowRegister() {
        return allowRegister;
    }

    public void setAllowRegister(boolean allowRegister) {
        this.allowRegister = allowRegister;
    }

    public boolean getIsHidden() {
        return isHidden;
    }

    public void setIsHidden(boolean isHidden) {
        this.isHidden = isHidden;
    }

    public boolean getIsUsed() {
        return isUsed;
    }

    public void setIsUsed(boolean isUsed) {
        this.isUsed = isUsed;
    }

    public String getCreatedAt() {
        return createdAt;
    }
}

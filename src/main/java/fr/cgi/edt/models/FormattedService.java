package fr.cgi.edt.models;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.helper.IModelHelper;
import io.vertx.core.json.JsonObject;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service objet formatted for course creation (multiple teachers by service)
 */
public class FormattedService implements IModel<FormattedService> {
    private String subjectId;
    private String audienceId;
    private List<String> teacherIds;
    private String structureId;

    public FormattedService(JsonObject service) {
        this.subjectId = service.getString(Field.SUBJECTID);
        this.audienceId = service.getString(Field.AUDIENCEID);
        this.teacherIds = service.getJsonArray(Field.TEACHERIDS)
                .stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .collect(Collectors.toList());
        this.structureId = service.getString(Field.STRUCTUREID);
    }

    public FormattedService() {
    }

    public String geSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    public String getAudienceId() {
        return audienceId;
    }

    public void setAudienceId(String audienceId) {
        this.audienceId = audienceId;
    }

    public List<String> getTeacherIds() {
        return teacherIds;
    }

    public void setTeacherIds(List<String> teacherIds) {
        this.teacherIds = teacherIds;
    }

    public String getStructureId() {
        return structureId;
    }

    public void setStructureId(String structureId) {
        this.structureId = structureId;
    }



    public JsonObject toJson() {
        return IModelHelper.toJson(this, true, true);
    }
}

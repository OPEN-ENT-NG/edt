package fr.cgi.edt.models;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.helper.IModelHelper;
import fr.cgi.edt.helper.JsonHelper;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;

public class Course implements IModel<Course> {

    private String _id;
    private String structureId;
    private String subjectId;
    private List<String> teacherIds;
    private List<String> tagIds;
    private List<String> classes;
    private List<String> classesExternalIds;
    private List<String> classesIds;
    private List<String> groups;
    private List<String> groupsExternalIds;
    private List<String> groupsIds;
    private List<String> roomLabels;
    private Integer dayOfWeek;
    private boolean manual;
    private boolean theoretical;
    private String updated;
    private String lastUser;
    private String startDate;
    private String endDate;
    private String recurrence;
    private String idStartSlot;
    private String idEndSlot;


    public Course() {

    }

    public Course(JsonObject json) {
        this._id = json.getString(Field._ID);
        this.structureId = json.getString(Field.STRUCTUREID);
        this.subjectId = json.getString(Field.SUBJECTID);
        this.teacherIds = JsonHelper.jsonArrayToList(json.getJsonArray(Field.TEACHERIDS, new JsonArray()), String.class);
        this.tagIds = JsonHelper.jsonArrayToList(json.getJsonArray(Field.TAGIDS, new JsonArray()), String.class);
        this.classes = JsonHelper.jsonArrayToList(json.getJsonArray(Field.CLASSES, new JsonArray()), String.class);
        this.classesExternalIds = JsonHelper.jsonArrayToList(json.getJsonArray(Field.CLASSESEXTERNALIDS, new JsonArray()), String.class);
        this.classesIds = JsonHelper.jsonArrayToList(json.getJsonArray(Field.CLASSESIDS, new JsonArray()), String.class);
        this.groups = JsonHelper.jsonArrayToList(json.getJsonArray(Field.GROUPS, new JsonArray()), String.class);
        this.groupsExternalIds = JsonHelper.jsonArrayToList(json.getJsonArray(Field.GROUPSEXTERNALIDS, new JsonArray()), String.class);
        this.groupsIds = JsonHelper.jsonArrayToList(json.getJsonArray(Field.GROUPSIDS, new JsonArray()), String.class);
        this.roomLabels = JsonHelper.jsonArrayToList(json.getJsonArray(Field.ROOMLABELS, new JsonArray()), String.class);
        this.dayOfWeek = json.getInteger(Field.DAYOFWEEK);
        this.manual = json.getBoolean(Field.MANUAL);
        this.theoretical = json.getBoolean(Field.THEORETICAL);
        this.updated = json.getString(Field.UPDATED);
        this.lastUser = json.getString(Field.LASTUSER);
        this.startDate = json.getString(Field.STARTDATE);
        this.endDate = json.getString(Field.ENDDATE);
        this.recurrence = json.getString(Field.RECURRENCE);
        this.idStartSlot = json.getString(Field.IDSTARTSLOT);
        this.idEndSlot = json.getString(Field.IDENDSLOT);
    }

    public String getId() {
        return _id;
    }

    public Course setId(String id) {
        this._id = id;
        return this;
    }

    public String getStructureId() {
        return structureId;
    }

    public Course setStructureId(String structureId) {
        this.structureId = structureId;
        return this;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public Course setSubjectId(String subjectId) {
        this.subjectId = subjectId;
        return this;
    }

    public List<String> getTeacherIds() {
        return teacherIds;
    }

    public Course setTeacherIds(List<String> teacherIds) {
        this.teacherIds = teacherIds;
        return this;
    }

    public List<String> getTagIds() {
        return tagIds;
    }

    public Course setTagIds(List<String> tagIds) {
        this.tagIds = tagIds;
        return this;
    }

    public List<String> getClasses() {
        return classes;
    }

    public Course setClasses(List<String> classes) {
        this.classes = classes;
        return this;
    }

    public List<String> getClassesExternalIds() {
        return classesExternalIds;
    }

    public Course setClassesExternalIds(List<String> classesExternalIds) {
        this.classesExternalIds = classesExternalIds;
        return this;
    }

    public List<String> getClassesIds() {
        return classesIds;
    }

    public Course setClassesIds(List<String> classesIds) {
        this.classesIds = classesIds;
        return this;
    }

    public List<String> getGroups() {
        return groups;
    }

    public Course setGroups(List<String> groups) {
        this.groups = groups;
        return this;
    }

    public List<String> getGroupsExternalIds() {
        return groupsExternalIds;
    }

    public Course setGroupsExternalIds(List<String> groupsExternalIds) {
        this.groupsExternalIds = groupsExternalIds;
        return this;
    }

    public List<String> getGroupsIds() {
        return groupsIds;
    }

    public Course setGroupsIds(List<String> groupsIds) {
        this.groupsIds = groupsIds;
        return this;
    }

    public List<String> getRoomLabels() {
        return roomLabels;
    }

    public Course setRoomLabels(List<String> roomLabels) {
        this.roomLabels = roomLabels;
        return this;
    }

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    public Course setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
        return this;
    }

    public boolean isManual() {
        return manual;
    }

    public Course setManual(boolean manual) {
        this.manual = manual;
        return this;
    }

    public boolean isTheoretical() {
        return theoretical;
    }

    public Course setTheoretical(boolean theoretical) {
        this.theoretical = theoretical;
        return this;
    }

    public String getUpdated() {
        return updated;
    }

    public Course setUpdated(String updated) {
        this.updated = updated;
        return this;
    }

    public String getLastUser() {
        return lastUser;
    }

    public Course setLastUser(String lastUser) {
        this.lastUser = lastUser;
        return this;
    }

    public String getStartDate() {
        return startDate;
    }

    public Course setStartDate(String startDate) {
        this.startDate = startDate;
        return this;
    }

    public String getEndDate() {
        return endDate;
    }

    public Course setEndDate(String endDate) {
        this.endDate = endDate;
        return this;
    }

    public String getRecurrence() {
        return recurrence;
    }

    public Course setRecurrence(String recurrence) {
        this.recurrence = recurrence;
        return this;
    }

    public String getIdStartSlot() {
        return idStartSlot;
    }

    public Course setIdStartSlot(String idStartSlot) {
        this.idStartSlot = idStartSlot;
        return this;
    }

    public String getIdEndSlot() {
        return idEndSlot;
    }

    public Course setIdEndSlot(String idEndSlot) {
        this.idEndSlot = idEndSlot;
        return this;
    }

    @Override
    public JsonObject toJson() {
        return IModelHelper.toJson(this, false, false);
    }
}

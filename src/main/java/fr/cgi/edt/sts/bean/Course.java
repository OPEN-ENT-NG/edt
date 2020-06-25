package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

public class Course {
    /**
     * Course bean is a fluent object. Each setter returns itself so it provide method chaining
     */
    private String structureId;
    private String subjectId;
    private JsonArray teacherIds;
    private JsonArray classes;
    private JsonArray groups;
    private JsonArray roomLabels;
    private Integer dayOfWeek;
    private String startDate;
    private String endDate;

    private String stsTeacher;
    private String tmpSubject;
    private String alternation;
    private String startTime;
    private String serviceCode;
    private String duration;

    public Course() {
        this.roomLabels = new JsonArray();
        this.classes = new JsonArray();
        this.groups = new JsonArray();
        this.teacherIds = new JsonArray();
    }

    public Course setTeacherIds(JsonArray teacherIds) {
        this.teacherIds = teacherIds;
        return this;
    }

    public Course setSubjectId(String subjectId) {
        this.subjectId = subjectId;
        return this;
    }

    public Course setStructureId(String structureId) {
        this.structureId = structureId;
        return this;
    }

    public Course setStartDate(String startDate) {
        this.startDate = startDate;
        return this;
    }

    public Course setEndDate(String endDate) {
        this.endDate = endDate;
        return this;
    }

    public Course setRoom(String room) {
        this.roomLabels.add(room);
        return this;
    }

    public Course setServiceCode(String code) {
        this.serviceCode = code;
        return this;
    }

    public String serviceCode() {
        return this.serviceCode;
    }

    public Course setStsTeacher(String teacher) {
        this.stsTeacher = teacher;
        return this;
    }

    public String stsTeacher() {
        return this.stsTeacher;
    }

    public Course setAlternation(String code) {
        this.alternation = code;
        return this;
    }

    public String alternation() {
        return this.alternation;
    }

    public Course setDayOfWeek(String dayOfWeek) throws NumberFormatException {
        this.dayOfWeek = Integer.parseInt(dayOfWeek);
        return this;
    }

    public Integer dayOfWeek() {
        return this.dayOfWeek;
    }

    public Course setDuration(String duration) {
        this.duration = duration;
        return this;
    }

    public String duration() {
        return this.duration;
    }

    public Course setStartTime(String startTime) {
        this.startTime = startTime;
        return this;
    }

    public String startTime() {
        return this.startTime;
    }

    public Course setClasses(JsonArray classes) {
        this.classes = classes;
        return this;
    }

    public Course setGroups(JsonArray groups) {
        this.groups = groups;
        return this;
    }

    public JsonObject toJSON() {
        JsonObject json = new JsonObject()
                .put("classes", this.classes)
                .put("groups", this.groups)
                .put("teacherIds", this.teacherIds)
                .put("roomLabels", this.roomLabels)
                .put("theoretical", false);

        if (this.structureId != null) json.put("structureId", this.structureId);
        if (this.subjectId != null) json.put("subjectId", this.subjectId);
        if (this.dayOfWeek != null) json.put("dayOfWeek", this.dayOfWeek);
        if (this.startDate != null) json.put("startDate", this.startDate);
        if (this.endDate != null) json.put("endDate", this.endDate);

        json.put("source", "STS");

        return json;
    }
}

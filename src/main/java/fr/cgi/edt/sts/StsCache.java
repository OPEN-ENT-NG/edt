package fr.cgi.edt.sts;

import fr.cgi.edt.sts.bean.Alternation;
import fr.cgi.edt.sts.bean.Course;
import fr.cgi.edt.sts.bean.Subject;
import fr.cgi.edt.sts.bean.Teacher;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StsCache {
    /**
     * Fluent class
     */
    private String uai;
    private List<String> audiences = new ArrayList<>();
    private List<Course> courses = new ArrayList<>();
    private Map<String, Alternation> alternations = new HashMap<>();
    private Map<String, Subject> subjects = new HashMap<>();
    private Map<String, Teacher> teachers = new HashMap<>();

    public StsCache setUai(String uai) {
        this.uai = uai.trim();
        return this;
    }

    public StsCache addCourse(Course course) {
        this.courses.add(course);
        return this;
    }

    public StsCache addAlternation(Alternation alternation) {
        this.alternations.put(alternation.name(), alternation);
        return this;
    }

    public StsCache addSubject(Subject subject) {
        this.subjects.put(subject.code(), subject);
        return this;
    }

    public StsCache addTeacher(Teacher teacher) {
        this.teachers.put(teacher.id(), teacher);
        return this;
    }

    public StsCache addAudience(String audience) {
        this.audiences.add(audience);
        return this;
    }

    public List<String> audiences() {
        return this.audiences;
    }


    public String uai() {
        return this.uai;
    }

    public List<Course> courses() {
        return this.courses;
    }

    public List<Subject> subjects() {
        return new ArrayList<>(this.subjects.values());
    }

    public List<Teacher> teachers() {
        return new ArrayList<>(this.teachers.values());
    }

    public Teacher teacher(String id) {
        return this.teachers.get(id);
    }

    public Subject subject(String code) {
        return this.subjects.get(code);
    }

    public Alternation alternation(String code) {
        return this.alternations.get(code);
    }

    public List<Alternation> alternations() {
        return new ArrayList<>(this.alternations.values());
    }
}

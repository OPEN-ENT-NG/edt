package fr.cgi.edt.sts.bean;

public class Service {
    String code;
    String teacher;

    public Service() {
    }

    public Service setCode(String code) {
        this.code = code;
        return this;
    }

    public String code() {
        return this.code;
    }

    public Service setTeacher(String teacher) {
        this.teacher = teacher;
        return this;
    }

    public String teacher() {
        return this.teacher;
    }
}

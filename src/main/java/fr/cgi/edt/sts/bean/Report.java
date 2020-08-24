package fr.cgi.edt.sts.bean;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.template.TemplateProcessor;
import fr.wseduc.webutils.template.lambdas.I18nLambda;
import fr.wseduc.webutils.template.lambdas.LocaleDateLambda;
import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.mongodb.MongoDbResult;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class Report {
    private String SOURCE = "STS";
    private String report;

    private Vertx vertx;
    private TemplateProcessor templateProcessor;
    private List<String> unknownAudiences = new ArrayList<>();
    private HashMap<String, Teacher> unknownTeachers = new HashMap<>();
    private HashMap<String, Subject> unknownSubjects = new HashMap<>();
    private List<Course> ignoredCourses = new ArrayList<>();
    private List<Course> createdCourses = new ArrayList<>();
    private List<Alternation> alternations = new ArrayList<>();
    private int count = 0;
    private int deletion = 0;
    private int teacherCount = 0;
    private Long startDate;
    private Long endDate;
    private String uai;
    private String path;

    public Report(Vertx vertx, String locale) {
        this.vertx = vertx;
        templateProcessor = new TemplateProcessor(vertx, "template").escapeHTML(false);
        templateProcessor.setLambda("i18n", new I18nLambda(locale));
        templateProcessor.setLambda("datetime", new LocaleDateLambda(locale));
    }

    public Report addUnknownTeacher(Teacher teacher) {
        if (!unknownTeachers.containsKey(teacher.id())) {
            unknownTeachers.put(teacher.id(), teacher);
        }
        return this;
    }

    public List<Teacher> unknownTeachers() {
        return new ArrayList<>(unknownTeachers.values());
    }

    public Report addUnknownSubject(Subject subject) {
        if (!unknownSubjects.containsKey(subject.code())) {
            unknownSubjects.put(subject.code(), subject);
        }
        return this;
    }

    public List<Subject> unknownSubjects() {
        return new ArrayList<>(unknownSubjects.values());
    }

    public Report addUnknownAudience(String audience) {
        if (!unknownAudiences.contains(audience)) {
            unknownAudiences.add(audience);
        }

        return this;
    }

    public List<String> unknownAudiences() {
        return this.unknownAudiences;
    }

    public Report setUAI(String uai) {
        this.uai = uai;
        return this;
    }

    public String uai() {
        return this.uai;
    }

    public Report setTeachersCount(int teacherCount) {
        this.teacherCount = teacherCount;
        return this;
    }

    public int teacherCount() {
        return this.teacherCount;
    }

    public Report setCount(int count) {
        this.count = count;
        return this;
    }

    public int count() {
        return this.count;
    }

    public Report setDeletion(int deletion) {
        this.deletion = deletion;
        return this;
    }

    public int deletion() {
        return this.deletion;
    }

    public Report start() {
        this.startDate = System.currentTimeMillis();
        return this;
    }

    public Report end() {
        this.endDate = System.currentTimeMillis();
        return this;
    }

    public Report setAlternations(List<Alternation> alternations) {
        this.alternations = alternations;
        return this;
    }

    public Report addIgnoredCourse(Course course) {
        this.ignoredCourses.add(course);
        return this;
    }

    public Report addCreatedCourse(Course course) {
        this.createdCourses.add(course);
        return this;
    }

    public JsonObject duration() {
        if (startDate == null || endDate == null) return new JsonObject();

        SimpleDateFormat sdf = new SimpleDateFormat("EEEE dd MMMM yyyy HH:mm", Locale.FRANCE);
        Long duration = endDate - startDate;
        return new JsonObject()
                .put("start", sdf.format(startDate))
                .put("end", sdf.format(endDate))
                .put("duration", duration);
    }

    private String runTime() {
        long elapsed = (this.endDate - this.startDate) / 1000;
        String seconds = Long.toString(elapsed % 60);
        String minutes = Long.toString((elapsed / 60) % 60);
        String hours = Long.toString(elapsed / 3600);

        return (hours.length() == 1 ? "0" : "") + hours + "h" +
                (minutes.length() == 1 ? "0" : "") + minutes + "m" +
                (seconds.length() == 1 ? "0" : "") + seconds + "s";
    }

    public void generate(Handler<AsyncResult<String>> handler) {
        JsonObject params = new JsonObject()
                .put("source", SOURCE)
                .put("UAI", this.uai())
                .put("date", this.startDate)
                .put("startTime", this.startDate)
                .put("endTime", this.endDate)
                .put("runTime", this.runTime())
                .put("alternations", new JsonArray(this.alternations.stream().map(Alternation::toJSON).collect(Collectors.toList())))
                .put("teachersFound", this.teacherCount() - unknownTeachers.size())
                .put("unknownTeachers", new JsonArray(this.unknownTeachers().stream().map(Teacher::toJSON).collect(Collectors.toList())))
                .put("unknownAudiences", new JsonArray(this.unknownAudiences))
                .put("coursesCreated", createdCourses.size())
                .put("courseOccurrencesCount", this.count())
                .put("coursesDeleted", this.deletion)
                .put("coursesIgnored", this.ignoredCourses.size())
                .put("unknownSubjects", new JsonArray(this.unknownSubjects().stream().map(Subject::toJSON).collect(Collectors.toList())));

        this.templateProcessor.processTemplate("sts/report/sts-report.txt", params, report -> {
            if (report == null) {
                this.report = "edt.sts.import.report.generation.failed";
                handler.handle(Future.failedFuture(this.report));
            } else {
                this.report = report;
                handler.handle(Future.succeededFuture(this.report));
            }
        });
    }

    public void save(Handler<AsyncResult<Void>> handler) {
        JsonObject document = new JsonObject()
                .put("created", MongoDb.now())
                .put("source", SOURCE)
                .put("UAI", this.uai())
                .put("report", this.report);

        MongoDb.getInstance().save("timetableImports", document, MongoDbResult.validResultHandler(res -> {
            if (res.isLeft()) handler.handle(Future.failedFuture(res.left().getValue()));
            else handler.handle(Future.succeededFuture());
        }));
    }

}

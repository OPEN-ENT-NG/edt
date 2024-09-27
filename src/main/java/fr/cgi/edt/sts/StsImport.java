package fr.cgi.edt.sts;

import fr.cgi.edt.sts.bean.*;
import fr.cgi.edt.utils.DateHelper;
import fr.wseduc.webutils.DefaultAsyncResult;
import io.vertx.core.*;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;
import org.xml.sax.helpers.XMLReaderFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;

import static org.entcore.common.utils.FileUtils.deleteImportPath;


public class StsImport {
    private static final Logger log = LoggerFactory.getLogger(StsImport.class);
    private String requestStructure;
    private final Vertx vertx;
    private final StsDAO dao;
    private final StsCache cache;
    private final Report report;
    private final SimpleDateFormat sdf = new SimpleDateFormat(DateHelper.SQL_FORMAT);

    public StsImport(Vertx vertx, StsDAO dao) {
        this.vertx = vertx;
        this.dao = dao;
        cache = new StsCache();
        report = new Report(vertx, "fr");
    }

    public void upload(final HttpServerRequest request, final String path, final Handler<AsyncResult> handler) {
        List<Promise<Void>> promises = new ArrayList<>();
        List<String> filenames = new ArrayList<>();
        Promise<Void> file1Promise = Promise.promise();
        Promise<Void> file2Promise = Promise.promise();
        promises.add(file1Promise);
        promises.add(file2Promise);
        request.pause();
        request.setExpectMultipart(true);
        request.exceptionHandler(getExceptionHandler(path, handler));
        request.uploadHandler(upload -> {
            if (!upload.filename().toLowerCase().endsWith(".xml")) {
                handler.handle(new DefaultAsyncResult(new RuntimeException(StsError.INVALID_FILE_EXTENSION.key())));
                return;
            }

            if (!filenames.contains(upload.filename())) {
                filenames.add(upload.filename());
            } else {
                handler.handle(Future.failedFuture(new RuntimeException(StsError.UPLOAD_SAME_FILE.key())));
                return;
            }

            Promise future = promises.get(filenames.indexOf(upload.filename()));
            final String filename = path + File.separator + upload.filename();
            upload.endHandler(event -> {
                log.info("File " + upload.filename() + " uploaded as " + upload.filename());
                future.complete();
            });
            upload.streamToFileSystem(filename);
        });

        vertx.fileSystem().mkdir(path, event -> {
            if (event.succeeded()) {
                request.resume();
            } else {
                handler.handle(new DefaultAsyncResult(new RuntimeException(StsError.FOLDER_CREATION_FAILED.key(), event.cause())));
            }
        });

        Future.all(file1Promise.future(), file2Promise.future()).onComplete(ar -> {
            if (ar.failed()) {
                handler.handle(new DefaultAsyncResult(new RuntimeException(StsError.UPLOAD_FAILED.key())));
            } else {
                handler.handle(ar);
            }
        });
    }


    /**
     * Get exception handler. It return a handler that catch error while the request upload the file.
     * In case of exception, the handler delete the directory.
     *
     * @param path    Temp directory path
     * @param handler Function handler
     * @return Handler<Throwable>
     */
    private Handler<Throwable> getExceptionHandler(final String path, final Handler<AsyncResult> handler) {
        return event -> {
            handler.handle(new DefaultAsyncResult(event));
            deleteImportPath(vertx, path);
        };
    }

    public void importFiles(final String path, final Handler<AsyncResult<Report>> handler) {
        report.start();
        vertx.fileSystem().readDir(path, event -> {
            if (event.succeeded() && event.result().size() == 2) {
                try {
                    String file = event.result().get(0);
                    String file2 = event.result().get(1);
                    parseXml(file);
                    parseXml(file2);
                } catch (IOException | SAXException | NullPointerException e) {
                    report.end();
                    log.error("Failed to parse STS files", e);
                    handler.handle(Future.failedFuture(new RuntimeException(StsError.PARSING_ERROR.key())));
                    return;
                }

                report.setAlternations(cache.alternations());
                report.setUAI(cache.uai());
                report.setTeachersCount(cache.teachers().size());
                process(evt -> {
                    if (evt.failed()) {
                        report.end();
                        handler.handle(Future.failedFuture(evt.cause().getMessage()));
                        return;
                    }

                    JsonArray courses = evt.result();
                    report.setCount(courses.size());
                    if (courses.isEmpty()) {
                        report.end();
                        handler.handle(Future.succeededFuture(report));
                        return;
                    }

                    dao.insertCourses(courses, insertResult -> {
                        report.end();
                        if (insertResult.failed()) {
                            log.error("Failed to insert STS courses", insertResult.cause().getMessage());
                            handler.handle(Future.failedFuture(new RuntimeException(StsError.INSERTION_ERROR.key())));
                        } else handler.handle(Future.succeededFuture(report));
                    });
                });
            } else {
                log.error("Failed to read import directory: " + path, event.cause().getMessage());
                handler.handle(Future.failedFuture(new RuntimeException(StsError.DIRECTORY_READING_ERROR.key())));
            }
        });
    }

    private void process(Handler<AsyncResult<JsonArray>> handler) {
        Promise<JsonObject> structurePromise = Promise.promise();
        Promise<JsonArray> subjectsPromise = Promise.promise();
        Promise<JsonArray> teachersPromise = Promise.promise();
        Promise<JsonArray> audiencePromise = Promise.promise();

        Future.all(structurePromise.future(), subjectsPromise.future(), teachersPromise.future()).onComplete(ar -> {
            if (ar.failed()) {
                log.error("Failed to retrieve STS infos", ar.cause());
                handler.handle(Future.failedFuture(new RuntimeException(StsError.IMPORT_SERVER_ERROR.key())));
                return;
            }

            String structure = structurePromise.future().result().getString("id", null);
            JsonArray subjects = subjectsPromise.future().result();
            JsonArray teachers = teachersPromise.future().result();
            JsonArray audiences = audiencePromise.future().result();

            if (structure == null) {
                handler.handle(Future.failedFuture(new RuntimeException(StsError.UNKNOWN_STRUCTURE_ERROR.key())));
                log.error("Structure is null for uai " + cache.uai());
                return;
            }

            if (!structure.equals(this.requestStructure)) {
                handler.handle(Future.failedFuture(StsError.UNAUTHORIZED.key()));
                return;
            }

            if (subjects == null || teachers == null || audiences == null || subjects.isEmpty() || teachers.isEmpty() || audiences.isEmpty()) {
                insufficiency(teachers, subjects, audiences, handler);
                return;
            }


            dao.dropFutureCourses(structure, dropAR -> {
                if (dropAR.failed()) {
                    log.error("Failed to delete past courses in STS import for UAI " + cache.uai());
                    handler.handle(Future.failedFuture(new RuntimeException(StsError.DELETE_FUTURE_COURSES_ERROR.key())));
                    return;
                }

                report.setDeletion(dropAR.result());
                handler.handle(Future.succeededFuture(processCourses(structure, mapTeachers(teachers), mapSubjects(subjects), mapAudiences(audiences))));
            });
        });

        dao.retrieveAudiences(cache.uai(), cache.audiences(), audiencePromise);
        dao.retrieveStructureIdentifier(cache.uai(), structurePromise);
        dao.retrieveSubjects(cache.uai(), cache.subjects(), subjectsPromise);
        dao.retrieveTeachers(cache.uai(), cache.teachers(), teachersPromise);
    }

    private void insufficiency(JsonArray teachers, JsonArray subjects, JsonArray audiences, Handler<AsyncResult<JsonArray>> handler) {
        if (teachers == null || teachers.isEmpty()) {
            log.error("Teacher list is empty. No teacher is found in the database for UAI " + cache.uai());
            cache.teachers().forEach(report::addUnknownTeacher);
        }

        if (subjects == null || subjects.isEmpty()) {
            log.error("Subject list is empty. No subject is found in the database for UAI " + cache.uai());
            cache.subjects().forEach(report::addUnknownSubject);
        }

        if (audiences == null || audiences.isEmpty()) {
            log.error("Audience list is empty. No audience is found in the database for UAI" + cache.uai());
            cache.audiences().forEach(report::addUnknownAudience);
        }

        handler.handle(Future.succeededFuture(new JsonArray()));
    }

    private JsonArray processCourses(String structure, Map<String, JsonObject> teachersMap, Map<String, JsonObject> subjectsMap, HashMap<String, String> audiences) {
        JsonArray courses = new JsonArray();
        cache.courses().forEach(course -> {
            course.setStructureId(structure);
            JsonObject teacher = teachersMap.get(cache.teacher(course.stsTeacher()).mapId());
            if (teacher == null) {
                report.addUnknownTeacher(cache.teacher(course.stsTeacher()));
                report.addIgnoredCourse(course);
                return;
            } else {
                course.setTeacherIds(new JsonArray().add(teachersMap.get(cache.teacher(course.stsTeacher()).mapId()).getString("id")));
            }

            JsonObject subject = subjectsMap.get(course.serviceCode());
            if (subject == null) {
                report.addUnknownSubject(cache.subject(course.serviceCode()));
                report.addIgnoredCourse(course);
                return;
            } else course.setSubjectId(subject.getString("id"));

            if (!course.groups().isEmpty() || !course.classes().isEmpty()) {
                JsonArray groupsExternalIds = getAudienceExternalId(course.groups(), audiences);
                JsonArray classesExternalIds = getAudienceExternalId(course.classes(), audiences);

                if (groupsExternalIds.isEmpty() && classesExternalIds.isEmpty()) {
                    report.addIgnoredCourse(course);
                    return;
                }

                course.setClassesExternalIds(classesExternalIds)
                        .setGroupsExternalIds(groupsExternalIds);
            }

            JsonArray createdCourses = formatFromWeeks(course);
            courses.addAll(createdCourses);
            if (!createdCourses.isEmpty()) report.addCreatedCourse(course);
        });

        return courses;
    }

    private JsonArray getAudienceExternalId(JsonArray audiences, HashMap<String, String> audienceMap) {
        JsonArray externalIds = new JsonArray();
        for (int i = 0; i < audiences.size(); i++) {
            String name = audiences.getString(i);
            String externalId = audienceMap.get(name);
            if (externalId != null) {
                externalIds.add(externalId);
            }
        }

        return externalIds;
    }

    private JsonArray formatFromWeeks(Course course) {
        JsonArray occurrences = new JsonArray();
        Alternation alternation = cache.alternation(course.alternation());
        // In case of alternation is null, return. Impossible case because in case of the alternation does not exists, files are not valid
        if (alternation == null) return occurrences;

        Integer startTimeHour = getTimeValue(course.startTime(), TimeValue.HOUR);
        Integer startTimeMin = getTimeValue(course.startTime(), TimeValue.MIN);
        Integer durationHour = getTimeValue(course.duration(), TimeValue.HOUR);
        Integer durationMin = getTimeValue(course.duration(), TimeValue.MIN);

        if (startTimeHour == null || startTimeMin == null || durationHour == null || durationMin == null) {
            log.error("An error occurred when parsing course.startTime() or course.duration(). One value is null");
            return occurrences;
        }

        Calendar calendar = Calendar.getInstance();
        for (Week week : alternation.weeks()) {
            Date courseDate = week.getDateOfWeek(course.dayOfWeek());
            calendar.setTime(courseDate);
            calendar.set(Calendar.HOUR_OF_DAY, startTimeHour);
            calendar.set(Calendar.MINUTE, startTimeMin);
            calendar.set(Calendar.SECOND, 0);

            if (calendar.getTimeInMillis() < System.currentTimeMillis()) continue;
            course.setStartDate(sdf.format(calendar.getTime()));

            calendar.add(Calendar.HOUR_OF_DAY, durationHour);
            calendar.add(Calendar.MINUTE, durationMin);
            course.setEndDate(sdf.format(calendar.getTime()));
            course.setRecurrence(alternation.recurrence(course));
            occurrences.add(course.toJSON());
        }

        return occurrences;
    }

    public StsImport setRequestStructure(String structure) {
        this.requestStructure = structure;
        return this;
    }

    private Integer getTimeValue(String time, TimeValue timeValue) {
        try {
            Integer start = timeValue.value() * 2;
            Integer end = start + 2;
            return Integer.parseInt(time.substring(start, end));
        } catch (NumberFormatException e) {
            return null;
        }
    }


    private Map<String, JsonObject> mapSubjects(JsonArray subjects) {
        Map<String, JsonObject> map = new HashMap<>();
        ((List<JsonObject>) subjects.getList()).forEach(subject -> map.put(subject.getString("code", ""), subject));
        return map;
    }

    private Map<String, JsonObject> mapTeachers(JsonArray teachers) {
        Map<String, JsonObject> map = new HashMap<>();
        ((List<JsonObject>) teachers.getList()).forEach(teacher -> {
            String lastName = teacher.getString("lastName", "");
            String firstName = teacher.getString("firstName", "");
            String birthDate = teacher.getString("birthDate", "");
            String key = lastName + "-" + firstName + "-" + birthDate;
            map.put(key, teacher);
        });
        return map;
    }

    private HashMap<String, String> mapAudiences(JsonArray audiences) {
        HashMap<String, String> map = new HashMap<>();
        ((List<JsonObject>) audiences.getList()).forEach(audience -> {
            String name = audience.getString("name");
            String externalId = audience.getString("externalId");
            map.put(name, externalId);
        });

        return map;
    }

    /**
     * Parse sts file (2 files)
     * and put sts info on course, alternances, tableMatieres, tableEnseignants, codeUAI (global var)
     * via public methode addCodeUAI, addCourse, addAlternanceTable, addMatieresTable, addIndividusTable, addIndividusTable
     *
     * @param path xml files path
     */
    private void parseXml(final String path/*, final Object object*/) throws IOException, SAXException {
        InputSource in = new InputSource(new FileInputStream(path));
        StsHandler sh = new StsHandler(cache);
        XMLReader xr = XMLReaderFactory.createXMLReader();
        xr.setContentHandler(sh);
        xr.parse(in);
    }
}

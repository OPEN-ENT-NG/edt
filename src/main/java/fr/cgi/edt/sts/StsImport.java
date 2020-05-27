package fr.cgi.edt.sts;

import fr.cgi.edt.sts.bean.*;
import fr.wseduc.webutils.DefaultAsyncResult;
import io.vertx.core.*;
import io.vertx.core.eventbus.EventBus;
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
    private static Logger log = LoggerFactory.getLogger(StsImport.class);
    private String requestStructure;
    private Vertx vertx;
    private EventBus eb;
    private StsDAO dao;
    private StsCache cache;
    private Report report;
    private SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");

    public StsImport(Vertx vertx, StsDAO dao) {
        this.vertx = vertx;
        this.dao = dao;
        eb = vertx.eventBus();
        cache = new StsCache();
        report = new Report(vertx, "fr");
    }

    public void upload(final HttpServerRequest request, final String path, final Handler<AsyncResult> handler) {
        List<Future> futures = new ArrayList<>();
        List<String> filenames = new ArrayList<>();
        Future file1 = Future.future();
        Future file2 = Future.future();
        futures.add(file1);
        futures.add(file2);
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
            }

            Future future = futures.get(filenames.indexOf(upload.filename()));
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

        CompositeFuture.all(futures).setHandler(ar -> {
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
        Future<JsonObject> structureFuture = Future.future();
        Future<JsonArray> subjectsFuture = Future.future();
        Future<JsonArray> teachersFuture = Future.future();

        CompositeFuture.all(structureFuture, subjectsFuture, teachersFuture).setHandler(ar -> {
            if (ar.failed()) {
                log.error("Failed to retrieve STS infos", ar.cause());
                handler.handle(Future.failedFuture(new RuntimeException(StsError.IMPORT_SERVER_ERROR.key())));
                return;
            }

            String structure = structureFuture.result().getString("id", null);
            JsonArray subjects = subjectsFuture.result();
            JsonArray teachers = teachersFuture.result();

            if (structure == null) {
                handler.handle(Future.failedFuture(new RuntimeException(StsError.UNKNOWN_STRUCTURE_ERROR.key())));
                log.error("Structure is null for uai " + cache.uai());
                return;
            }

            if (!structure.equals(this.requestStructure)) {
                handler.handle(Future.failedFuture(StsError.UNAUTHORIZED.key()));
                return;
            }

            if (subjects.isEmpty() || teachers.isEmpty()) {
                insufficiency(teachers, subjects, handler);
                return;
            }


            dao.dropFutureCourses(structure, dropAR -> {
                if (dropAR.failed()) {
                    log.error("Failed to delete past courses in STS import for UAI " + cache.uai());
                    handler.handle(Future.failedFuture(new RuntimeException(StsError.DELETE_FUTURE_COURSES_ERROR.key())));
                    return;
                }

                report.setDeletion(dropAR.result());
                handler.handle(Future.succeededFuture(processCourses(structure, mapTeachers(teachers), mapSubjects(subjects))));
            });
        });

        dao.retrieveStructureIdentifier(cache.uai(), structureFuture);
        dao.retrieveSubjects(cache.uai(), cache.subjects(), subjectsFuture);
        dao.retrieveTeachers(cache.uai(), cache.teachers(), teachersFuture);
    }

    private void insufficiency(JsonArray teachers, JsonArray subjects, Handler<AsyncResult<JsonArray>> handler) {
        if (teachers.isEmpty()) {
            log.error("Teacher list is empty. No teacher is found in the database for UAI " + cache.uai());
            cache.teachers().forEach(report::addUnknownTeacher);
        }

        if (subjects.isEmpty()) {
            log.error("Subject list is empty. No subject is found in the database for UAI " + cache.uai());
            cache.subjects().forEach(report::addUnknownSubject);
        }

        handler.handle(Future.succeededFuture(new JsonArray()));
    }

    private JsonArray processCourses(String structure, Map<String, JsonObject> teachersMap, Map<String, JsonObject> subjectsMap) {
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

            JsonArray createdCourses = formatFromWeeks(course);
            courses.addAll(createdCourses);
            if (!createdCourses.isEmpty()) report.addCreatedCourse(course);
        });

        return courses;
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

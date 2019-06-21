package fr.cgi.edt.services.impl;

import fr.cgi.edt.services.StsService;
import fr.cgi.edt.utils.DateHelper;
import fr.cgi.edt.utils.EdtMongoHelper;
import fr.wseduc.webutils.DefaultAsyncResult;
import fr.wseduc.webutils.Either;
import io.vertx.core.*;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.http.HttpServerFileUpload;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;
import org.entcore.common.user.UserUtils;
import org.xml.sax.InputSource;
import org.xml.sax.XMLReader;
import org.xml.sax.helpers.XMLReaderFactory;

import java.io.File;
import java.io.FileInputStream;
import java.text.SimpleDateFormat;
import java.util.*;

import static fr.cgi.edt.Edt.EDT_COLLECTION;
import static org.entcore.common.utils.FileUtils.deleteImportPath;

public class StsServiceImpl implements StsService {
    private final Vertx vertx;
    private final EventBus eb;
    private static Logger log;
    private EdtMongoHelper edtMongoHelper;

    private int idCours;
    private int idMatiere;
    private int idTeacher;
    private int indexTeacher;
    private String codeUAI;
    private JsonObject structure;

    private JsonObject finalCourse;
    private JsonArray roomValue;

    private Map<String, JsonObject> alternances;
    private Map<String, JsonObject> coursesTable;
    private Map<String, JsonObject> tableMatieres;
    private Map<String, JsonObject> tableEnseignants;

    private final DateHelper dateHelper = new DateHelper();

    public StsServiceImpl(Vertx vertx, EventBus eb, Logger log) {
        this.vertx = vertx;
        this.eb = eb;
        this.log = log;
        this.edtMongoHelper = new EdtMongoHelper(EDT_COLLECTION, eb);


        idCours = 0;
        idMatiere = 0;
        idTeacher = 0;
        indexTeacher = 0;
        codeUAI = null;
        structure = null;
        finalCourse = new JsonObject();
        roomValue = new JsonArray();

        alternances = new HashMap<>();
        coursesTable = new HashMap<>();
        tableMatieres = new HashMap<>();
        tableEnseignants = new HashMap<>();
    }

    private final Neo4j neo4j = Neo4j.getInstance();

    public void uploadImport(Vertx vertx, final HttpServerRequest request, final String path, final Handler<AsyncResult> handler) {
        request.pause();
        request.setExpectMultipart(true);
        request.endHandler(getEndHandler(request, path, handler));
        request.exceptionHandler(getExceptionHandler(path, handler));
        request.uploadHandler(getUploadHandler(path, handler));

        vertx.fileSystem().mkdir(path, event -> {
            if (event.succeeded()) {
                request.resume();
            } else {
                handler.handle(new DefaultAsyncResult(new RuntimeException("mkdir.error", event.cause())));
            }
        });
    }

    /**
     * Get end upload handler
     *
     * @param request Http Server Request
     * @param path    Upload directory path
     * @param handler Function handler
     * @return Handler<Void>
     */
    private Handler<Void> getEndHandler(final HttpServerRequest request, final String path,
                                        final Handler<AsyncResult> handler) {
        return v -> {
            UserUtils.getUserInfos(eb, request,
                    user -> handler.handle(new DefaultAsyncResult(null)));
        };
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

    /**
     * Get chunk upload handler
     *
     * @param path    Upload directory path
     * @param handler Function handler
     * @return Upload handler
     */
    private static Handler<HttpServerFileUpload> getUploadHandler(final String path,
                                                                  final Handler<AsyncResult> handler) {
        return upload -> {
            if (!upload.filename().toLowerCase().endsWith(".xml")) {
                handler.handle(new DefaultAsyncResult(
                        new RuntimeException("invalid.file.extension")
                ));
                return;
            }
            final String filename = path + File.separator + upload.filename();
            upload.endHandler(event -> {
                log.info("File " + upload.filename() + " uploaded as " + upload.filename());
            });
            upload.streamToFileSystem(filename);
        };
    }

    /**
     * Read xml file
     *
     * @param vertx
     * @param finalHandler
     * @param path
     */
    public void readSts(Vertx vertx, final String path, final Handler<Either<String, JsonObject>> finalHandler) {
        vertx.fileSystem().readDir(path, event -> {
            if (event.succeeded()) {
                String file = event.result().get(0);
                String file2 = event.result().get(1);
                parseXml(file /*, objetconteneur*/);
                parseXml(file2/*, objetconteneur*/);

                getStructure(struturesResults -> {
                    if (struturesResults.isRight()) {
                        JsonArray results = struturesResults.right().getValue();
                        if (results != null && !results.isEmpty() && results.size() > 0) {
                            structure = results.getJsonObject(0);
                        } else {
                            finalHandler.handle(new Either.Left<>("sts.error.notfound.structure"));
                        }

                    } else {
                        finalHandler.handle(new Either.Left<>("sts.error.notfound.structure"));
                    }

                    JsonObject periodes = createPeriodeFromAlternances(alternances);
                    if (periodes == null || periodes.isEmpty()) {
                        finalHandler.handle(new Either.Left<>("sts.error.notfound.schedules"));
                        return;
                    }

                    getSubjects(tableMatieres, subjectsResults -> {
                        if (subjectsResults == null || !subjectsResults.containsKey("found") || subjectsResults.getJsonObject("found") == null) {
                            String error = "No subjects available";

                            finalHandler.handle(new Either.Left<>(error));
                        }
                        JsonObject subjects = subjectsResults.containsKey("found") ? subjectsResults.getJsonObject("found") : null;
                        String subjectsNotFound =
                                (subjectsResults.containsKey("notFound") && subjectsResults.getJsonArray("notFound") != null) ?
                                        subjectsResults.getJsonArray("notFound").toString() : null;

                        getTeachers(tableEnseignants, teachersResults -> {
                            if (teachersResults == null || !teachersResults.containsKey("found") || teachersResults.getJsonObject("found") == null) {
                                String error = "No teachers available";
                                if (teachersResults.containsKey("notFound")) {
                                    error += ": " + teachersResults.getJsonObject("notFound").toString();
                                }
                                finalHandler.handle(new Either.Left<>(error));
                            }

                            JsonObject teachers = teachersResults.containsKey("found") ? teachersResults.getJsonObject("found") : null;
                            String teachersNotFound =
                                    (teachersResults.containsKey("notFound") && teachersResults.getJsonArray("notFound") != null) ?
                                            teachersResults.getJsonArray("notFound").toString() : null;

                            getCourses(coursesTable, structure, periodes, subjects, teachers, new Handler<JsonObject>() {
                                @Override
                                public void handle(JsonObject coursesResults) {
                                    Integer coursesWritten = coursesResults.containsKey("coursesWritten") ? coursesResults.getInteger("coursesWritten") : null;
                                    finalHandler.handle(new Either.Right<>(
                                            new JsonObject()
                                                    .put("subjectsNotFound", subjectsNotFound)
                                                    .put("teachersNotFound", teachersNotFound)
                                                    .put("coursesWritten", coursesWritten)
                                    ));

                                }
                            });
                        });
                    });

                });
            } else {
                finalHandler.handle(new Either.Left<>("Failed to readDir"));
            }
        });
    }

    /**** BEGIN **** Parse **** BEGIN *****/

    /**
     * Parse sts file (2 files)
     * and put sts info on course, alternances, tableMatieres, tableEnseignants, codeUAI (global var)
     * via public methode addCodeUAI, addCourse, addAlternanceTable, addMatieresTable, addIndividusTable, addIndividusTable
     *
     * @param path xml files path
     */
    private void parseXml(final String path/*, final Object object*/) {
        try {
            InputSource in = new InputSource(new FileInputStream(path));
            StsHandler sh = new StsHandler(this);
            XMLReader xr = XMLReaderFactory.createXMLReader();
            xr.setContentHandler(sh);
            xr.parse(in);

        } catch (Exception e) {
            log.error("[edt@StsServiceImpl]", e);
        }
    }

    /**** BEGIN **** USED by the parser on StsHandler.java **** BEGIN *****/

    void addCodeUAI(String code) {
        codeUAI = code;
    }

    void addCourse(JsonObject currentCourse) {
        idCours += 1;
        coursesTable.put(Integer.toString(idCours), currentCourse);
    }

    void addAlternanceTable(JsonObject alternancesTable) {
        final String code = alternancesTable.getString("code");
        alternances.put(code, alternancesTable);
    }

    void addMatieresTable(JsonObject matieresTable) {
        idMatiere += 1;
        tableMatieres.put(Integer.toString(idMatiere), matieresTable);
    }

    void addIndividusTable(JsonObject individusTable) {
        idTeacher += 1;
        tableEnseignants.put(Integer.toString(idTeacher), individusTable);
    }

    /**** END **** USED by the parser on StsHandler.java **** END *****/
    /**** END **** Parse **** END *****/

    /**** BEGIN **** Courses part **** BEGIN ****/


    private void getCourses(Map<String, JsonObject> coursesTable, JsonObject structure, JsonObject periodes, JsonObject subjects, JsonObject teachers, Handler<JsonObject> handler) {
        final List<Future> futureMyResponse1Lst = new ArrayList<>();
        for (int i = 0; i <= coursesTable.size(); i++) {
            Future<Integer> courseFutureComposite = Future.future();
            futureMyResponse1Lst.add(courseFutureComposite);
            JsonObject course = coursesTable.get(String.valueOf(i));
            if (course != null && !course.isEmpty()) {
                createCourse(course, structure, periodes, subjects, teachers, courseFutureComposite);
            } else {
                courseFutureComposite.complete();
            }
        }
        CompositeFuture.all(futureMyResponse1Lst).setHandler(event2 -> {
            Integer count = 0;
            for (Future<Integer> futureCourse : futureMyResponse1Lst) {
                if (futureCourse.result() != null) {
                    count += futureCourse.result();
                }
            }

            handler.handle(
                    new JsonObject()
                            .put("coursesWritten", count)
            );
        });
    }


    private void createCourse(JsonObject cours, JsonObject structure, JsonObject periodes, JsonObject subjects, JsonObject teachers, Future<Integer> courseFutureComposite) {

        //Need matching
        String uaiFromCourse = cours.getString("uai");
        String periodeFromCourse = cours.getString("codeAlternance");
        String subjectFromCourse = cours.getString("service");
        JsonArray teachersFromCourse = cours.getJsonArray("teachers");

        JsonArray classesFromCourse = cours.getJsonArray("divisions"); //final String
        JsonArray groupesFromCourse = cours.getJsonArray("groupes"); //final String
        String dayFromCourse = cours.getString("jour");// Final number
        String startTimeFromCourse = cours.getString("heure_debut");// example 1402
        String scheduleFromCourse = cours.getString("duree");// example 0100

        String startTimeFinal = startTimeFromCourse.substring(0, 2) + ":" + startTimeFromCourse.substring(2, 4) + ":00";
        String endTimeFinal = null;

        int startHour_InMinutes = (Integer.parseInt(startTimeFromCourse.substring(0, 2)) * 60) + Integer.parseInt(startTimeFromCourse.substring(2));
        int courseTime_InMinutes = (Integer.parseInt(scheduleFromCourse.substring(0, 2)) * 60) + Integer.parseInt(scheduleFromCourse.substring(2));
        int endHour_InMinutes = startHour_InMinutes + courseTime_InMinutes;
        int endHour = endHour_InMinutes / 60;
        int endTime = endHour_InMinutes % 60;
        endTimeFinal = endHour < 10 ? "0" : "";
        endTimeFinal += Integer.toString(endHour) + ":";
        if (endTime < 10) {
            endTimeFinal += "0";
        }
        endTimeFinal += Integer.toString(endTime) + ":00";

        JsonArray datesCours = new JsonArray();

        JsonArray arrayFormattedCourses = new JsonArray();

        JsonObject finalCourse = new JsonObject();
        if (structure != null && structure.containsKey("id")) {
            finalCourse.put("structureId", structure.getString("id"));
        }

        finalCourse.put("teacherIds", new JsonArray());
        // We store all the courses in an array
        for (int i = 0; i < teachersFromCourse.size(); i++) {
            try {
                String teacherStsId = teachersFromCourse.getString(i);
                finalCourse.getJsonArray("teacherIds").add(teachers.getJsonObject(teacherStsId).getString("id"));
            } catch (Exception e) {
            }
        }

        if (subjects != null && subjects.containsKey(subjectFromCourse)) {
            JsonObject subject = subjects.getJsonObject(subjectFromCourse);
            if(subject != null && subject.containsKey("id")){
                finalCourse.put("subjectId", subject.getString("id"));
            }
        }

        if (classesFromCourse != null && !classesFromCourse.isEmpty()) {
            finalCourse.put("classes", classesFromCourse);
        }
        if (groupesFromCourse != null && !groupesFromCourse.isEmpty()) {
            finalCourse.put("groups", groupesFromCourse);
        }

        if (dayFromCourse != null) {
            finalCourse.put("dayOfWeek", dayFromCourse);
        }


        if (finalCourse.containsKey("structureId") && finalCourse.containsKey("teacherIds") && !finalCourse.getJsonArray("teacherIds").isEmpty()
                && finalCourse.containsKey("subjectId")  && finalCourse.containsKey("dayOfWeek") &&
                (finalCourse.containsKey("classes") || finalCourse.containsKey("group"))) {
            if (periodes != null && periodeFromCourse != null && periodes.containsKey(periodeFromCourse)) {
                JsonArray datesFromPeriodes = periodes.getJsonArray(periodeFromCourse);
                for (int j = 0; j < datesFromPeriodes.size(); j++) {
                    try {
                        JsonObject dateSchedules = datesFromPeriodes.getJsonObject(j);
                        finalCourse.put("startDate", dateSchedules.getString("dateDebut") + "T" + startTimeFinal);
                        finalCourse.put("endDate", dateSchedules.getString("dateFin") + "T" + endTimeFinal);
                        arrayFormattedCourses.add(finalCourse);

                    } catch (Exception e) {
                    }
                }
            }
        }

        // We insert all the courses in Mongo
        if (!arrayFormattedCourses.isEmpty()) {
            edtMongoHelper.addCourses(arrayFormattedCourses, new Handler<String>() {
                @Override
                public void handle(String s) {
                    courseFutureComposite.complete(arrayFormattedCourses.size());
                }
            });
        } else {
            courseFutureComposite.complete(0);
        }
    }

    /**** END **** Courses part **** END ****/


    /**** BEGIN **** Struture part **** BEGIN ****/

    private void getStructure(Handler<Either<String, JsonArray>> handler) {
        StringBuilder query = new StringBuilder();

        query.append("MATCH (s:Structure) WHERE s.UAI = {structureUAI} RETURN s.id AS id, s.name AS name, s.academy AS academy;");

        JsonObject params = new JsonObject().put("structureUAI", codeUAI);

        neo4j.execute(query.toString(), params, Neo4jResult.validResultHandler(handler));
    }

    /**** END **** Struture part **** END ****/


    /**** BEGIN **** Periodes part **** BEGIN ****/

    /**
     * Parcours Alternances to create schedule periodes
     *
     * @param alternances Alternances from STS files
     * @return formated alternances to schedules periodes dates
     */
    private JsonObject createPeriodeFromAlternances(Map<String, JsonObject> alternances) {
        JsonObject periodes = new JsonObject();
        if (alternances == null || alternances.isEmpty()) {
            return null;
        }
        for (Map.Entry<String, JsonObject> entry : alternances.entrySet()) {
            String code = entry.getKey();
            JsonObject values = entry.getValue();
            JsonArray codePeriodes = createPeriodes(code, values);
            if (codePeriodes != null && !codePeriodes.isEmpty()) {
                periodes.put(code, codePeriodes);
            }
        }
        return periodes;
    }

    /**
     * Create date schedule (periodes with date format) from list of week (string format)
     * works by week or every two week (week A and B)
     * or if the patern is not evry 7 or 14 days, a schedule is create to each week
     * example: semaine [3-06-2018, 10-06-2018, 17-06-2018, 24-06-2018] => {dateDebut: 3-06-2018, dateFin: 30-06-2018, everyTwoWeek: false}
     * example: semaine [3-06-2018, 17-06-2018] => {dateDebut: 3-06-2018, dateFin: 23-06-2018, everyTwoWeek: true}
     *
     * @param code   Periode identifier (example: H, S1, S2, SA, SB...)
     * @param values Object contain, Code and Periodes weeks list string format (example: {code: 'H', semaine:[3-06-2018, 10-06-2018, 17-06-2018, 24-06-2018]} )
     * @return JsonArray of code periode's schedule
     */
    private JsonArray createPeriodes(String code, JsonObject values) {

        if (values == null || !values.containsKey("semaines")) {
            return null;
        }
        JsonArray weeks = values.getJsonArray("semaines");
        if (weeks == null || weeks.isEmpty()) {
            return null;
        }
        JsonArray result = new JsonArray();
        List<Date> dateList = datesStringToSoDatesSorted(weeks);

        if (dateList == null || dateList.isEmpty()) {
            return null;
        }

        if (dateList.size() > 1) {
            int step = dateHelper.daysBetween(dateList.get(0), dateList.get(1));
            step = (step == 7 || step == 14) ? step : -1;

            Date base = dateList.get(0);
            Date previous = dateList.get(0);
            for (int i = 1; i < dateList.size(); i++) {
                if (step <= 0 || dateHelper.daysBetween(previous, dateList.get(i)) != step) {
                    result = addDateWithStep(result, step, base, previous);
                    base = dateList.get(i);
                }
                previous = dateList.get(i);
                if (i == dateList.size() - 1) {
                    result = addDateWithStep(result, step, base, previous);
                }
            }
        } else {
            Date first = dateList.get(0);
            result = addDateWithStep(result, 0, first, first);
        }
        return result;
    }

    /**
     * Add schedules from end and start date
     *
     * @param dateList  JsonArray of schedules, result container
     * @param step      int who said if the it's recurrent course
     * @param startDate first day of week of week start date
     * @param endDate   first day of week of week end date
     * @return JsonArray with the schedule date added
     */
    private JsonArray addDateWithStep(JsonArray dateList, int step, Date startDate, Date endDate) {
        try {
            dateList.add(
                    new JsonObject()
                            .put("dateDebut", dateHelper.getDateString(startDate))
                            .put("dateFin", dateHelper.getDateString(dateHelper.addDays(endDate, 6)))
                            .put("everyTwoWeek", step == 14)
            );
        } catch (Exception ignored) {
        }
        return dateList;
    }

    /**
     * Transform list of semaine to list of date schedule
     *
     * @param weeks semaine list as [3-06-2018, 10-06-2018, 17-06-2018, 24-06-2018]
     * @return Sorted list of date (older dates to newer)
     */
    private List<Date> datesStringToSoDatesSorted(JsonArray weeks) {
        List<Date> dateList = new ArrayList<>();
        try {
            Iterator iteratorWeeks = weeks.iterator();

            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
            while (iteratorWeeks.hasNext()) {
                JsonObject objectWeek = (JsonObject) iteratorWeeks.next();
                String week = objectWeek.getString("semaine");
                if (week != null && week.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    dateList.add(dateHelper.getDate(week, dateHelper.SIMPLE_DATE_FORMATTER));
                }
            }
            dateList.sort((o1, o2) -> o1.compareTo(o2));
        } catch (Exception ignored) {
            dateList = null;
        }
        return dateList;
    }

    /**** END **** Periodes part **** END ****/

    /**** BEGIN **** Teachers part **** BEGIN ****/

    private void getTeacherId(String lastName, String firstName, String birthDate, Handler<Either<String, JsonArray>> handler) {
        StringBuilder query = new StringBuilder();

        query.append("MATCH (u:User) WHERE u.lastNameSearchField = {lastName} AND u.firstNameSearchField = {firstName} AND u.birthDate = {birthDate}" +
                " RETURN u.id AS id, u.lastName AS lastName, u.firstName AS firstName, u.DisplayName AS displayname;");

        JsonObject params = new JsonObject()
                .put("lastName", lastName.toLowerCase())
                .put("firstName", firstName.toLowerCase())
                .put("birthDate", birthDate);

        neo4j.execute(query.toString(), params, Neo4jResult.validResultHandler(handler));
    }

    private void getTeachers(Map<String, JsonObject> teachersMap, Handler<JsonObject> handler) {
        if (teachersMap == null || teachersMap.isEmpty()) {
        }
        Map<String, JsonObject> teachersResult = new HashMap<>();
        List<String> notFoundResult = new ArrayList<>();

        List<Future> futureList = new ArrayList<>();

        for (Map.Entry<String, JsonObject> entry : teachersMap.entrySet()) {
            JsonObject teacher = entry.getValue();
            Future<JsonObject> teacherFuture = Future.future();
            futureList.add(teacherFuture);
            if (teacher != null && teacher.containsKey("nom") && teacher.containsKey("prenom") && teacher.containsKey("date_naissance")) {
                String stsId = teacher.getString("id");
                String firstName = teacher.getString("prenom");
                String lastName = teacher.getString("nom");
                String birthDate = teacher.getString("date_naissance");

                getTeacherId(lastName, firstName, birthDate, reponse -> {
                    if (reponse.isRight()) {
                        JsonArray results = reponse.right().getValue();
                        if (results != null && !results.isEmpty() && results.size() > 0) {
                            teachersResult.put(stsId, results.getJsonObject(0));
                        } else {
                            notFoundResult.add(stsId + " " + firstName + " " + lastName + " " + birthDate);
                        }
                    }
                    teacherFuture.complete();
                });
            } else {
                teacherFuture.complete();
            }
        }
        CompositeFuture.all(futureList).setHandler(event -> {
            handler.handle(
                    new JsonObject()
                            .put("found", teachersResult.isEmpty() ? null : JsonObject.mapFrom(teachersResult))
                            .put("notFound", notFoundResult)
            );
        });
    }
    /**** END **** Teachers part **** END ****/


    /**** BEGIN **** Subjects part **** BEGIN ****/

    /**
     * @param codeSubject
     * @param handler
     */
    private void getSubjectIdFromAAF(String codeSubject, Handler<Either<String, JsonArray>> handler) {
        StringBuilder query = new StringBuilder();

        query.append("MATCH (s:Subject)-[SUBJECT]-(etab) WHERE s.code = {codeSubject} AND s.source='AAF'  AND etab.UAI = {etabUAI} RETURN s.id AS id, s.code AS code, s.label AS label;");

        JsonObject params = new JsonObject()
                .put("codeSubject", codeSubject)
                .put("etabUAI", codeUAI);

        neo4j.execute(query.toString(), params, Neo4jResult.validResultHandler(handler));
    }

    /**
     * @param subjectsMap
     * @param handler
     */
    private void getSubjects(Map<String, JsonObject> subjectsMap, Handler<JsonObject> handler) {
        if (subjectsMap == null || subjectsMap.isEmpty()) {
            handler.handle(null);
        }
        Map<String, JsonObject> subjectsResult = new HashMap<>();
        List<String> notFoundResult = new ArrayList<>();

        List<Future> futureList = new ArrayList<>();

        for (Map.Entry<String, JsonObject> entry : subjectsMap.entrySet()) {
            JsonObject subject = entry.getValue();
            Future<JsonObject> subjectFuture = Future.future();
            futureList.add(subjectFuture);
            if (subject != null && subject.containsKey("code_matiere")) {
                String codeSubject = subject.getString("code_matiere");
                getSubjectIdFromAAF(codeSubject, reponse -> {
                    if (reponse.isRight()) {
                        JsonArray results = reponse.right().getValue();
                        if (results != null && !results.isEmpty() && results.size() > 0) {
                            subjectsResult.put(codeSubject, results.getJsonObject(0));
                        } else {
                            notFoundResult.add(subject.toString());
                        }
                    }
                    subjectFuture.complete();
                });
            } else {
                subjectFuture.complete();
            }
        }
        CompositeFuture.all(futureList).setHandler(event -> {
            handler.handle(
                    new JsonObject()
                            .put("found", subjectsResult.isEmpty() ? null : JsonObject.mapFrom(subjectsResult))
                            .put("notFound", notFoundResult)
            );
        });
    }

    /**** END **** Subjects part **** END ****/
}

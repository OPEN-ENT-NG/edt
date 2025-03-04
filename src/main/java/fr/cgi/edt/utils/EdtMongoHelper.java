package fr.cgi.edt.utils;

import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import fr.wseduc.webutils.Either;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.bus.ErrorMessage;
import org.entcore.common.service.impl.MongoDbCrudService;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.utils.DateUtils;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class EdtMongoHelper extends MongoDbCrudService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);
    private static final String  STATUS = "status";
    private static final String  START_DATE = "startDate";
    private static final String  END_DATE = "endDate";
    private static final String DAY_OF_WEEK = "dayOfWeek";
    private static final String EVERY_TWO_WEEK= "everyTwoWeek";
    private final DateHelper dateHelper = new DateHelper();
    private final EventBus eb;
    public EdtMongoHelper(String collection ,EventBus eb) {
        super(collection);
        this.eb = eb;
    }

    private void checkTransactionStatus (Boolean onError, Integer valuesSize, List<String> ids, Handler<Either<String, JsonObject>> handler) {
        if (valuesSize == ids.size()) {
            if (onError) {
                handler.handle(new Either.Left<>("An error occurred when inserting data"));
            } else {
                JsonObject res = new JsonObject().put(STATUS, 200);
                handler.handle(new Either.Right<>(res));
            }
        }
    }

    public void addCourses(JsonArray arrayCourses, Handler<String> handler) {
        try {
            mongo.insert(this.collection, arrayCourses, jsonObjectMessage -> handler.handle("Executed"));
        } catch (Exception e) {
            handler.handle("mongoinsertfailed");
        }
    }

    public void manageCourses(final JsonArray values, final Handler<Either<String, JsonObject>> handler) {
        final ArrayList<String> ids = new ArrayList<>();
        final Boolean[] onError = {false};
        JsonObject obj;

        Handler<Message<JsonObject>> transactionHandler = result -> {
            if ("ok".equals(result.body().getString(STATUS))) {
                ids.add(result.body().getString("_id"));
            } else {
                onError[0] = true;
                ids.add("err");
            }
            checkTransactionStatus(onError[0], values.size(), ids, handler);
        };

        for (int i = 0; i < values.size(); i++) {
            obj = values.getJsonObject(i);
            if (!obj.containsKey("_id")) {
                mongo.save(collection, obj, transactionHandler);
            } else {
                updateCourse(obj,transactionHandler);
            }
        }
    }

    public void deleteOccurrence(String id, String dateOccurrence,  Handler<Either<String, JsonObject>> handler  ){
        final JsonObject matches = new JsonObject().put("_id", id);
        Calendar occurrenceDate = dateHelper.longToCalendar(Long.parseLong(dateOccurrence));
        mongo.findOne(this.collection, matches ,  result -> {
            if ("ok".equals(result.body().getString(STATUS))) {
                JsonObject oldCourse = result.body().getJsonObject("result");
                Boolean everyTwoWeek = (oldCourse.containsKey("everyTwoWeek"))? oldCourse.getBoolean("everyTwoWeek") : false;
                Boolean isLastOccurence = false;

                if (dateHelper.getWeekOfYear(oldCourse.getString(END_DATE)) == dateHelper.getWeekOfYear(occurrenceDate.getTime())
                        || everyTwoWeek && (dateHelper.getWeekOfYear(oldCourse.getString(END_DATE)) == dateHelper.getWeekOfYear(occurrenceDate.getTime()) + 1)) {
                    isLastOccurence = true;
                }

                if (getCourseEditOccurrenceAbility(oldCourse, dateOccurrence, everyTwoWeek)) {
                    JsonObject newCourse = new JsonObject(oldCourse.toString());
                    newCourse.remove("_id");
                    Calendar oldCourseStart = dateHelper.lastOccurrenceDate(oldCourse);
                    if((dateHelper.getCombineDate(occurrenceDate.getTime(), oldCourse.getString(START_DATE)))
                            .equals(dateHelper.getCombineDate(oldCourseStart.getTime(), oldCourse.getString(START_DATE))))
                        excludeOccurrenceFromCourse(oldCourse, newCourse, getDatesForExcludeOccurrence(oldCourse, newCourse, dateOccurrence, everyTwoWeek, isLastOccurence), isLastOccurence, true, handler);
                    else
                        excludeOccurrenceFromCourse(oldCourse, newCourse, getDatesForExcludeOccurrence(oldCourse, newCourse, dateOccurrence, everyTwoWeek, isLastOccurence), isLastOccurence, false, handler);
                }else {
                    LOGGER.error("can't update this occurrence");
                    handler.handle(new Either.Left<>("can't update this occurrence"));
                }
            }else {
                LOGGER.error("this course does not exist");
                handler.handle(new Either.Left<>("this course does not exist"));
            }
        });
    }

    private void excludeOccurrenceFromCourse(JsonObject oldCourse, JsonObject newCourse, JsonObject dates , boolean isLastOCcurence, boolean everyTwoWeek, Handler<Either<String, JsonObject>> handler  ){
        oldCourse.put(START_DATE, dates.getString("newStartTime"));
        oldCourse.put(END_DATE, dates.getString("newEndTime"));
        newCourse.put(START_DATE, dates.getString("oldStartTime"));
        newCourse.put(END_DATE, dates.getString("oldEndTime"));

//        if (everyTwoWeek == true) {
//            oldCourse.put(START_DATE, dateHelper.goToNextFirstDayOfWeek(dateHelper.addDaysToDate(oldCourse.getString(START_DATE), 14)));//go to the firt day in two week.
//            if(dateHelper.daysBetween(oldCourse.getString(START_DATE), oldCourse.getString(END_DATE)) < 0){
//                oldCourse.put(START_DATE, oldCourse.getString(END_DATE));
//            }
//        }

        Handler<Message<JsonObject>> secondInternHandler = jsonObjectMessage -> {
            if (jsonObjectMessage.isSend()) {
                handler.handle(new Either.Right<>(jsonObjectMessage.body()));
            } else {
                handler.handle(new Either.Left<>("can't delete this course Occurrence"));
            }
        };

        Handler<Message<JsonObject>> firstInternHandler = res -> {
            secondUpdate(newCourse, isLastOCcurence, handler, secondInternHandler);
        };
        if(isLastOCcurence || dateHelper.getDate(oldCourse.getString(END_DATE), dateHelper.DATE_FORMATTER).after(dateHelper.getDate(oldCourse.getString(START_DATE),dateHelper.DATE_FORMATTER))){
            JsonObject old_tmp = oldCourse;


            if(isLastOCcurence){
                old_tmp = new JsonObject(newCourse.toString());
                old_tmp.put("_id", oldCourse.getString("_id"));
            }
            updateElement(old_tmp, firstInternHandler);
        }
        else {
            secondUpdate(newCourse, isLastOCcurence, handler, secondInternHandler);
        }
    }

    private void secondUpdate(JsonObject newCourse, Boolean isLastOCcurence, Handler<Either<String, JsonObject>> handler, Handler<Message<JsonObject>> secondInternHandler) {
        if (!isLastOCcurence && dateHelper.getDate(newCourse.getString(END_DATE), dateHelper.DATE_FORMATTER)
                .after(dateHelper.getDate(newCourse.getString(START_DATE), dateHelper.DATE_FORMATTER))) {
            mongo.save(collection, newCourse, secondInternHandler);
        } else {
           handler.handle(new Either.Right<>(new JsonObject().put("_id","cc")));
        }
    }

    public void updateOccurrence(final JsonObject course, String dateOccurrence, final  Handler<Either<String, JsonObject>> handler){
        final JsonObject matches = new JsonObject().put("_id", course.getString("_id"));
        mongo.findOne(this.collection, matches ,  result -> {
            boolean isLastOCcurence = false;
            Boolean everyTwoWeek = (course.containsKey(EVERY_TWO_WEEK)) ? course.getBoolean(EVERY_TWO_WEEK) : false;

            if ("ok".equals(result.body().getString(STATUS))) {
                JsonObject oldCourse = result.body().getJsonObject("result");
                if (dateHelper.getWeekOfYear(oldCourse.getString(END_DATE)) == dateHelper.getWeekOfYear(course.getString(END_DATE))
                    || everyTwoWeek && (dateHelper.getWeekOfYear(oldCourse.getString(END_DATE)) == dateHelper.getWeekOfYear(course.getString(END_DATE)) + 1)) {
                    isLastOCcurence = true;
                }

                if (getCourseEditOccurrenceAbility(oldCourse, dateOccurrence,(course.containsKey(EVERY_TWO_WEEK))
                        ? course.getBoolean(EVERY_TWO_WEEK)
                        : false )) {
                    JsonObject newCourse = new JsonObject(oldCourse.toString());
                    newCourse.remove("_id");
                    course.remove("_id");

                    excludeOccurrenceFromCourse(oldCourse, newCourse, getDatesForExcludeOccurrence(oldCourse, newCourse, dateOccurrence, everyTwoWeek, isLastOCcurence), isLastOCcurence,
                            (course.containsKey(EVERY_TWO_WEEK))
                                    ? course.getBoolean(EVERY_TWO_WEEK)
                                    : false, stringJsonObjectEither -> mongo.save(collection, course, res -> {
                        if (res.isSend()) handler.handle(new Either.Right<>(res.body()));
                        else handler.handle(new Either.Left<>("can't create this Occurrence"));
                    }));

                }else {
                    LOGGER.error("can't find this course");
                    handler.handle(new Either.Left<>("can't find this course"));
                }
            }else {
                LOGGER.error("this course does not exist");
                handler.handle(new Either.Left<>("this course does not exist"));
            }
        });
    }

    private void updateCourse (final JsonObject course, final Handler<Message<JsonObject>> handler){
        final JsonObject matches = new JsonObject().put("_id", course.getString("_id"));
        mongo.findOne(this.collection, matches ,  result -> {
            if ("ok".equals(result.body().getString(STATUS))) {
                JsonObject oldCourse = result.body().getJsonObject("result");
                JsonObject coursePropreties = getCourseProperties(oldCourse);
                if(coursePropreties.getBoolean("inFuture")) {
                    updateElement(course, handler);
                }else if (coursePropreties.getBoolean("inPresent")) {
                    JsonObject newCourse = new JsonObject(course.toString());
                    JsonObject dates = getDatesForSplitPeriod(oldCourse,newCourse);
                    newCourse.remove("_id");
                    newCourse.put(START_DATE, dates.getString("startTime"));
                    oldCourse.put(END_DATE, dates.getString("endTime"));
                    updateElement(oldCourse, handler);

                    mongo.save(collection, newCourse, handler);
                }else {
                    String message = "can't edit this paste course";
                    LOGGER.error(message);
                    handler.handle(new ErrorMessage(message));
                }
            } else {
                LOGGER.error("this course does not exist");
                handler.handle(new ErrorMessage("this course does not exist"));
            }
        });
    }

    private void deleteElement(final JsonObject matches,  final Handler<Either<String, JsonObject>> handler )   {
        mongo.delete(collection, matches, result -> {
            if ("ok".equals(result.body().getString(STATUS))){
                handler.handle(new Either.Right<>(matches));
            }else{
                handler.handle(new Either.Left<>("An error occurred when deleting data"));
            }
        });
    }

    public void updateElement(final JsonObject element, final  Handler<Message<JsonObject>> handler  ) {
        final JsonObject matches = new JsonObject().put("_id", element.getString("_id"));
        final JsonObject updateElement = new JsonObject().put("$set", element);
        mongo.update(collection, matches, updateElement, handler);
    }

    public void delete(final String id, final Handler<Either<String, JsonObject>> handler) {

        final JsonObject matches = new JsonObject().put("_id", id);
        mongo.findOne(this.collection, matches , result -> {
            if ("ok".equals(result.body().getString(STATUS))) {
                JsonObject course = result.body().getJsonObject("result");
                JsonObject coursePropreties = getCourseProperties(course);
                if(coursePropreties.getBoolean("inFuture")) {
                    deleteElement(matches, handler);
                }else if (coursePropreties.getBoolean("inPresent")){
                    JsonObject dates =  getDatesForSplitPeriod(course, null);
                    updateElement(course.put(END_DATE,  dates.getString("endTime")), res ->{
                        if(res.isSend()){
                            handler.handle(new Either.Right<>(new JsonObject().put(STATUS,"ok")));
                        }else{
                            handler.handle(new Either.Left<>("can't edit this course"));
                        }
                    });

                }else {
                    LOGGER.error("can't delete this course");
                    handler.handle(new Either.Left<>("can't delete this course"));
                }
            } else {
                LOGGER.error("this course does not exist");
                handler.handle(new Either.Left<>("this course does not exist"));
            }
        });
    }

    private JsonObject getCourseProperties(JsonObject course) {
        JsonObject courseProperties  = new JsonObject()
                .put("inFuture", false)
                .put("inPresent", false);
        try{
            Date now = new Date() ;
            Date startDate = dateHelper.DATE_FORMATTER.parse(course.getString(START_DATE));
            Date endDate = dateHelper.DATE_FORMATTER.parse(course.getString(END_DATE));
            boolean isRecurrent = 0 != TimeUnit.DAYS.convert(
                    endDate.getTime() -startDate.getTime(), TimeUnit.MILLISECONDS);
            if (now.before(DateUtils.add(startDate, Calendar.MINUTE, -15)) ) {
                courseProperties.put("inFuture", true);
            } else if (isRecurrent && DateUtils.add(startDate, Calendar.MINUTE, -15).before(now) && endDate.after(now) ){
                courseProperties.put("inPresent", true);
            }
        } catch (ParseException e) {
            LOGGER.error("error when casting course's dates");
        }
        return courseProperties;
    }

    private boolean getCourseEditOccurrenceAbility(JsonObject course, String occurrenceDate, boolean everyTwoWeeks) {
        Date startDate ;
        Date endDate ;
        Date now = new Date() ;
        boolean courseProperties = false;
        try{
            startDate = dateHelper.DATE_FORMATTER.parse( course.getString(START_DATE) );
            endDate = dateHelper.DATE_FORMATTER.parse( course.getString(END_DATE) );
            boolean isRecurrent = 0 != TimeUnit.DAYS.convert(
                    endDate.getTime() -startDate.getTime(), TimeUnit.MILLISECONDS);

            Calendar occurrenceCalendar = dateHelper.longToCalendar(Long.parseLong(occurrenceDate)) ;

            if ((now.before(startDate) || (isRecurrent && startDate.before(now) && endDate.after(now) ) )
                    && now.before(occurrenceCalendar.getTime())
                    && (startDate.before(occurrenceCalendar.getTime()) || everyTwoWeeks)
                    && (occurrenceCalendar.get(Calendar.DAY_OF_WEEK) -1 ) == course.getInteger("dayOfWeek")) {
                courseProperties = true;
            }
        } catch (ParseException e) {
            LOGGER.error("error when casting course's dates");
        }

        return courseProperties;
    }

    private JsonObject getDatesForSplitPeriod( JsonObject oldCourse, JsonObject newCourse) {
        JsonObject splitDates = new JsonObject();
        Calendar endCalendarDate = Calendar.getInstance();
        endCalendarDate.setTime( dateHelper.getCombineDate(new Date(), oldCourse.getString(END_DATE)));
        endCalendarDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
        if(endCalendarDate.before(Calendar.getInstance())){
            endCalendarDate.add(Calendar.DAY_OF_WEEK, +7);
        }
        endCalendarDate.add(Calendar.DAY_OF_WEEK, -1);
        if( null != newCourse ) {
            Calendar startCalendarDate = Calendar.getInstance();
            startCalendarDate.setTime(dateHelper.getCombineDate(endCalendarDate.getTime(), newCourse.getString(START_DATE)));
            startCalendarDate.set(Calendar.DAY_OF_WEEK, newCourse.getInteger("dayOfWeek")+1);
            if(dateHelper.daysBetween(startCalendarDate,dateHelper.getCalendar(newCourse.getString(END_DATE), dateHelper.DATE_FORMATTER)) < 7 ){
                startCalendarDate.setTime(dateHelper.getCombineDate(dateHelper.getDate(newCourse.getString(END_DATE),dateHelper.DATE_FORMATTER), newCourse.getString(START_DATE)));
            }
            splitDates.put("startTime", dateHelper.DATE_FORMATTER.format(startCalendarDate.getTime())) ;
        }
        Calendar startOldCourseDate = dateHelper.getCalendar(oldCourse.getString(START_DATE), dateHelper.DATE_FORMATTER);
        startOldCourseDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
        if(dateHelper.daysBetween(endCalendarDate, startOldCourseDate ) <= 7){
            Calendar startOldCalendarDate = dateHelper.getCalendar(oldCourse.getString(START_DATE), dateHelper.DATE_FORMATTER);
            startOldCalendarDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
            endCalendarDate.setTime(dateHelper.getCombineDate(startOldCalendarDate.getTime(), oldCourse.getString(END_DATE)));
        }
        splitDates.put("endTime", dateHelper.DATE_FORMATTER.format( endCalendarDate.getTime()));
        return splitDates;
    }
    private JsonObject getDatesForExcludeOccurrence(JsonObject oldCourse,JsonObject newCourse, String date, Boolean everyTwoWeek, Boolean isLastOCcurence) {
        JsonObject splitDates = new JsonObject();
        Calendar occurrenceDate  = dateHelper.longToCalendar(Long.parseLong(date));
        Calendar oldCourseEnd = Calendar.getInstance();
        Calendar oldCourseStart = dateHelper.firstOccurrenceDate(oldCourse);
        Calendar newCourseStart = Calendar.getInstance();
        Calendar newCourseEnd = dateHelper.lastOccurrenceDate(newCourse);
        oldCourseEnd.setTime(dateHelper.getCombineDate(occurrenceDate.getTime(), oldCourse.getString(END_DATE)));
        newCourseStart.setTime(dateHelper.getCombineDate(occurrenceDate.getTime(), oldCourse.getString(START_DATE)));

        if (everyTwoWeek && !isLastOCcurence) {
            oldCourseEnd.add(Calendar.DAY_OF_WEEK, -14);
        } else {
            oldCourseEnd.add(Calendar.DAY_OF_WEEK, -7);
        }
        if (everyTwoWeek && !isLastOCcurence) {
            newCourseStart.add(Calendar.DAY_OF_WEEK, +14);
        } else {
            newCourseStart.add(Calendar.DAY_OF_WEEK, +7);
        }
        splitDates.put("oldEndTime", dateHelper.DATE_FORMATTER.format( oldCourseEnd.getTime()));
        splitDates.put("oldStartTime", dateHelper.DATE_FORMATTER.format( oldCourseStart.getTime()));
        splitDates.put("newEndTime",dateHelper.DATE_FORMATTER.format( newCourseEnd.getTime()));
        splitDates.put("newStartTime", dateHelper.DATE_FORMATTER.format( newCourseStart.getTime()));
        return splitDates;
    }
}

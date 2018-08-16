package fr.cgi.edt.utils;


import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import fr.wseduc.webutils.Either;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.bus.ErrorMessage;
import org.entcore.common.service.impl.MongoDbCrudService;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;


public class EdtMongoHelper extends MongoDbCrudService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);
    private  final SimpleDateFormat SIMPLE_DATE_FORMATTER = new SimpleDateFormat("yyyy-MM-dd");
    private  final SimpleDateFormat DATE_FORMATTER= new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
    private  final SimpleDateFormat TIME_FORMATTER = new SimpleDateFormat("HH:mm:ss");
    private static final String  STATUS = "status";
    private static final String  START_DATE = "startDate";
    private static final String  END_DATE = "endDate";
    private static final String  DAY_OF_WEEK = "dayOfWeek";
    public EdtMongoHelper(String collection) {
        super(collection);
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
        mongo.findOne(this.collection, matches ,  result -> {
            if ("ok".equals(result.body().getString(STATUS))) {
                JsonObject oldCourse = result.body().getJsonObject("result");
                if (getCourseEditOccurrenceAbility(oldCourse, dateOccurrence)) {
                    JsonObject newCourse = new JsonObject(oldCourse.toString());
                    newCourse.remove("_id");
                    excludeOccurrenceFromCourse(oldCourse,newCourse,getDatesForExcludeOccurrence(oldCourse, newCourse ,dateOccurrence), handler);
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
    private void excludeOccurrenceFromCourse(JsonObject oldCourse, JsonObject newCourse, JsonObject dates , Handler<Either<String, JsonObject>> handler  ){
        Handler<Message<JsonObject>> internHandler = res ->{
            if(res.isSend())  handler.handle(new Either.Right<>(res.body()));
            else handler.handle(new Either.Left<>("can't delete this course Occurrence"));
        };
        newCourse.put(START_DATE, dates.getString("newStartTime"));
        newCourse.put(END_DATE, dates.getString("newEndTime"));
        oldCourse.put(END_DATE, dates.getString("oldEndTime"));
        oldCourse.put(START_DATE, dates.getString("oldStartTime"));
        if(getDate(oldCourse.getString(END_DATE)).after(getDate(oldCourse.getString(START_DATE)))) updateElement(oldCourse,internHandler);
        if(getDate(newCourse.getString(END_DATE)).after(getDate(newCourse.getString(START_DATE)))) mongo.save(collection, newCourse,internHandler);
    }

    public void updateOccurrence(final JsonObject course, String dateOccurrence, final  Handler<Either<String, JsonObject>> handler){
        final JsonObject matches = new JsonObject().put("_id", course.getString("_id"));
        mongo.findOne(this.collection, matches ,  result -> {
            if ("ok".equals(result.body().getString(STATUS))) {
                JsonObject oldCourse = result.body().getJsonObject("result");
                if (getCourseEditOccurrenceAbility(oldCourse, dateOccurrence)) {
                    JsonObject newCourse = new JsonObject(oldCourse.toString());
                    newCourse.remove("_id");
                    course.remove("_id");
                    excludeOccurrenceFromCourse(oldCourse,newCourse,getDatesForExcludeOccurrence(oldCourse, newCourse ,dateOccurrence), handler);
                    mongo.save(collection, course, res ->{
                        if(res.isSend())  handler.handle(new Either.Right<>(res.body()));
                        else handler.handle(new Either.Left<>("can't create this Occurrence")); });
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
        mongo.update(collection, matches, element, handler);
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
        Date startDate ;
        Date endDate ;
        Date now = new Date() ;
        JsonObject courseProperties  = new JsonObject()
                .put("inFuture", false)
                .put("inPresent", false);
        try{
            startDate = DATE_FORMATTER.parse( course.getString(START_DATE));
            endDate = DATE_FORMATTER.parse( course.getString(END_DATE));
            boolean isRecurrent = 0 != TimeUnit.DAYS.convert(
                    endDate.getTime() -startDate.getTime(), TimeUnit.MILLISECONDS);
            if (now.before(startDate) ) {
                courseProperties.put("inFuture", true);
            }else if(isRecurrent && startDate.before(now) && endDate.after(now) ){
                courseProperties.put("inPresent", true);
            }
        } catch (ParseException e) {
            LOGGER.error("error when casting course's dates");
        }
        return courseProperties;
    }

    private boolean getCourseEditOccurrenceAbility(JsonObject course, String occurrenceDate) {
        Date startDate ;
        Date endDate ;
        Date now = new Date() ;
        boolean courseProperties = false;
        try{
            startDate = DATE_FORMATTER.parse( course.getString(START_DATE) );
            endDate = DATE_FORMATTER.parse( course.getString(END_DATE) );
            boolean isRecurrent = 0 != TimeUnit.DAYS.convert(
                    endDate.getTime() -startDate.getTime(), TimeUnit.MILLISECONDS);

            Calendar occurrenceCalendar = longToCalendar(Long.parseLong(occurrenceDate)) ;

            if ((now.before(startDate) || (isRecurrent && startDate.before(now) && endDate.after(now) ) )
                    && now.before(occurrenceCalendar.getTime())
                    && startDate.before(occurrenceCalendar.getTime())
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
        endCalendarDate.setTime( getCombineDate(new Date(), oldCourse.getString(END_DATE)));
        endCalendarDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
        if(endCalendarDate.before(Calendar.getInstance())){
            endCalendarDate.add(Calendar.DAY_OF_WEEK, +7);
        }
        endCalendarDate.add(Calendar.DAY_OF_WEEK, -1);
        if( null != newCourse ) {
            Calendar startCalendarDate = Calendar.getInstance();
            startCalendarDate.setTime(getCombineDate(endCalendarDate.getTime(), newCourse.getString(START_DATE)));
            startCalendarDate.set(Calendar.DAY_OF_WEEK, newCourse.getInteger("dayOfWeek")+1);
            if(daysBetween(startCalendarDate,getCalendar(newCourse.getString(END_DATE))) < 7 ){
                startCalendarDate.setTime(getCombineDate(getDate(newCourse.getString(END_DATE)), newCourse.getString(START_DATE)));
            }
            splitDates.put("startTime", DATE_FORMATTER.format(startCalendarDate.getTime())) ;
        }
        Calendar startOldCourseDate = getCalendar(oldCourse.getString(START_DATE));
        startOldCourseDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
        if(daysBetween(endCalendarDate, startOldCourseDate ) <= 7){
            Calendar startOldCalendarDate = getCalendar(oldCourse.getString(START_DATE));
            startOldCalendarDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
            endCalendarDate.setTime(getCombineDate(startOldCalendarDate.getTime(), oldCourse.getString(END_DATE)));
        }
        splitDates.put("endTime", DATE_FORMATTER.format( endCalendarDate.getTime()));
        return splitDates;
    }
    private JsonObject getDatesForExcludeOccurrence( JsonObject oldCourse,JsonObject newCourse, String date) {
        JsonObject splitDates = new JsonObject();
        Calendar occurrenceDate  = longToCalendar(Long.parseLong(date));
        Calendar oldCourseEnd = Calendar.getInstance();
        Calendar oldCourseStart = firstOccurrenceDate(oldCourse);
        Calendar newCourseStart = Calendar.getInstance();
        Calendar newCourseEnd = lastOccurrenceDate(newCourse);
        oldCourseEnd.setTime(getCombineDate(occurrenceDate.getTime(), oldCourse.getString(END_DATE)));
        newCourseStart.setTime(getCombineDate(occurrenceDate.getTime(), oldCourse.getString(START_DATE)));
        oldCourseEnd.add(Calendar.DAY_OF_WEEK, -7);
        newCourseStart.add(Calendar.DAY_OF_WEEK, +7);

        splitDates.put("oldEndTime", DATE_FORMATTER.format( oldCourseEnd.getTime()));
        splitDates.put("oldStartTime", DATE_FORMATTER.format( oldCourseStart.getTime()));
        splitDates.put("newEndTime", DATE_FORMATTER.format( newCourseEnd.getTime()));
        splitDates.put("newStartTime", DATE_FORMATTER.format( newCourseStart.getTime()));
        return splitDates;
    }
    Calendar firstOccurrenceDate(JsonObject course){
        Calendar start = getCalendar(course.getString(START_DATE));
        start.set(Calendar.DAY_OF_WEEK, course.getInteger("dayOfWeek")+1);
        if(start.before(getCalendar(course.getString(START_DATE)))){
            start.add(Calendar.WEEK_OF_YEAR, 1);
        }
        return start;
    }
    Calendar lastOccurrenceDate(JsonObject course){
        Calendar end = getCalendar(course.getString(END_DATE));
        end.set(Calendar.DAY_OF_WEEK, course.getInteger("dayOfWeek")+1);
        if(end.after(getCalendar(course.getString(END_DATE)))){
            end.add(Calendar.WEEK_OF_YEAR, -1);
        }
        return end;
    }
    Calendar longToCalendar(Long  date){
        Calendar calendarOccurrence = Calendar.getInstance();
        calendarOccurrence.setTimeInMillis(date);
        calendarOccurrence.add(Calendar.DAY_OF_WEEK, 1);
        return calendarOccurrence;
    }
    int daysBetween(Calendar startDate, Calendar endDate) {
        long end = endDate.getTimeInMillis();
        long start = startDate.getTimeInMillis();
        return (int) TimeUnit.MILLISECONDS.toDays(Math.abs(end - start));
    }
    Date getDate(String dateString){
        Date date= new Date();
        try{
            date =  DATE_FORMATTER.parse(dateString);
        } catch (ParseException e) {
            LOGGER.error("error when casting date: ", e);
        }
        return date ;
    }
    Calendar getCalendar(String dateString){
        Calendar date= Calendar.getInstance();
        try{
            date.setTime(DATE_FORMATTER.parse(dateString))  ;
        } catch (ParseException e) {
            LOGGER.error("error when casting date: ", e);
        }
        return date ;
    }
    Date getCombineDate(Date part1,String part2){
        Date date= new Date();
        try{
            date =  DATE_FORMATTER.parse(
                    SIMPLE_DATE_FORMATTER.format(part1)
                            +'T'
                            + TIME_FORMATTER.format(getDate(part2)));
        } catch (ParseException e) {
            LOGGER.error("error when casting date: ", e);
        }
        return date ;
    }
}

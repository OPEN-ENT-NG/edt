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

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;




public class EdtMongoHelper extends MongoDbCrudService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);
    private static final SimpleDateFormat SIMPLE_DATE_FORMATTER = new SimpleDateFormat("YYYY-MM-dd" +
            "");
    private static final SimpleDateFormat DATE_FORMATTER= new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
    private static final SimpleDateFormat TIME_FORMATTER = new SimpleDateFormat("HH:mm:ss");
    public EdtMongoHelper(String collection) {
        super(collection);
    }

    private void checkTransactionStatus (Boolean onError, Integer valuesSize, List<String> ids, Handler<Either<String, JsonObject>> handler) {
        if (valuesSize == ids.size()) {
            if (onError) {
                handler.handle(new Either.Left<>("An error occurred when inserting data"));
            } else {
                JsonObject res = new JsonObject().put("status", 200);
                handler.handle(new Either.Right<>(res));
            }
        }
    }


    public void manageCourses(final JsonArray values, final Handler<Either<String, JsonObject>> handler) {
        final ArrayList<String> ids = new ArrayList<>();
        final Boolean[] onError = {false};
        JsonObject obj;

        Handler<Message<JsonObject>> transactionHandler = result -> {
            if ("ok".equals(result.body().getString("status"))) {
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

    public void updateCourse (final JsonObject course, final Handler<Message<JsonObject>> handler){
        final JsonObject matches = new JsonObject().put("_id", course.getString("_id"));
        mongo.findOne(this.collection, matches ,  result -> {
            if ("ok".equals(result.body().getString("status"))) {
                JsonObject oldCourse = result.body().getJsonObject("result");
                JsonObject coursePropreties = getCourseProperties(oldCourse);
                if(coursePropreties.getBoolean("inFuture")) {
                    updateElement(course, handler);
                }else if (coursePropreties.getBoolean("inPresent")) {
                    JsonObject newCourse = new JsonObject(course.toString());
                    JsonObject dates = getDatesForSplitPeriod(oldCourse,newCourse);
                    newCourse.remove("_id");
                    newCourse.put("startDate", dates.getString("startTime"));
                    oldCourse.put("endDate", dates.getString("endTime"));
                    updateElement(oldCourse, handler);

                    mongo.save(collection, newCourse, handler);
                }else {
                    LOGGER.error("can't edit this course");
                    handler.handle(new ErrorMessage("can't edit this course"));
                }
            } else {
                LOGGER.error("this course does not exist");
                handler.handle(new ErrorMessage("this course does not exist"));
            }
        });
    }

    public void deleteElement(final JsonObject matches,  final Handler<Either<String, JsonObject>> handler )   {
        mongo.delete(collection, matches, result -> {
            if ("ok".equals(result.body().getString("status"))){
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
            if ("ok".equals(result.body().getString("status"))) {
                JsonObject course = result.body().getJsonObject("result");
                JsonObject coursePropreties = getCourseProperties(course);
                if(coursePropreties.getBoolean("inFuture")) {
                    deleteElement(matches, handler);
                }else if (coursePropreties.getBoolean("inPresent")){
                    JsonObject dates =  getDatesForSplitPeriod(course, null);
                    updateElement(course.put("endDate",  dates.getString("endTime")), (res)->{
                        if(res.isSend()){
                            handler.handle(new Either.Right<>(new JsonObject().put("status","ok")));
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
            startDate = DATE_FORMATTER.parse( course.getString("startDate") );
            endDate = DATE_FORMATTER.parse( course.getString("endDate") );
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
    private JsonObject getDatesForSplitPeriod( JsonObject oldCourse , JsonObject newCourse ) {
        JsonObject splitDates = new JsonObject();
        Calendar endCalendarDate = Calendar.getInstance();
        endCalendarDate.setTime( getCombineDate(new Date(), oldCourse.getString("endDate")));
        endCalendarDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
        if(endCalendarDate.before(Calendar.getInstance())){
            endCalendarDate.add(Calendar.DAY_OF_WEEK, +7);
        }
        endCalendarDate.add(Calendar.DAY_OF_WEEK, -1);
        if( null != newCourse ) {
            Calendar startCalendarDate = Calendar.getInstance();
            startCalendarDate.setTime(getCombineDate(endCalendarDate.getTime(), newCourse.getString("startDate")));
            startCalendarDate.set(Calendar.DAY_OF_WEEK, newCourse.getInteger("dayOfWeek")+1);
            if(daysBetween(startCalendarDate,getCalendar(newCourse.getString("endDate"))) < 7){
                startCalendarDate.setTime(getCombineDate(getDate(newCourse.getString("endDate")), newCourse.getString("startDate")));
            }
            splitDates.put("startTime", DATE_FORMATTER.format(startCalendarDate.getTime())) ;
        }
        Calendar startOldCourseDate = getCalendar(oldCourse.getString("startDate"));
        startOldCourseDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
        if(daysBetween(endCalendarDate, startOldCourseDate ) <= 7){
            Calendar startOldCalendarDate = getCalendar(oldCourse.getString("startDate"));
            startOldCalendarDate.set(Calendar.DAY_OF_WEEK, oldCourse.getInteger("dayOfWeek")+1);
            endCalendarDate.setTime(getCombineDate(startOldCalendarDate.getTime(), oldCourse.getString("endDate")));
        }
        splitDates.put("endTime", DATE_FORMATTER.format( endCalendarDate.getTime()));
        return splitDates;
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

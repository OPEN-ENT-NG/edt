package fr.cgi.edt.utils;

import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.TimeUnit;

public class DateHelper {
    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);
    public  final SimpleDateFormat SIMPLE_DATE_FORMATTER = new SimpleDateFormat("yyyy-MM-dd");
    public  final SimpleDateFormat DATE_FORMATTER= new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
    public  final SimpleDateFormat TIME_FORMATTER = new SimpleDateFormat("HH:mm:ss");
    private static final String  START_DATE = "startDate";
    private static final String  END_DATE = "endDate";
    private static final String  DAY_OF_WEEK = "dayOfWeek";
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

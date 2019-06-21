package fr.cgi.edt.utils;

import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.joda.time.DateTime;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.TimeUnit;

public class DateHelper {
    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);
    public  final SimpleDateFormat SIMPLE_DATE_FORMATTER = new SimpleDateFormat("yyyy-MM-dd");
    public  final SimpleDateFormat DATE_FORMATTER= new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
    public  final SimpleDateFormat DATE_FORMATTER_SQL= new SimpleDateFormat("yyyy-MM-dd' 'HH:mm:ss");
    public  final SimpleDateFormat TIME_FORMATTER = new SimpleDateFormat("HH:mm:ss");
    private static final String  START_DATE = "startDate";
    private static final String  END_DATE = "endDate";
    private static final String  DAY_OF_WEEK = "dayOfWeek";
    Calendar firstOccurrenceDate(JsonObject course){
        Calendar start = getCalendar(course.getString(START_DATE), DATE_FORMATTER);
        start.set(Calendar.DAY_OF_WEEK, course.getInteger("dayOfWeek")+1);
        if(start.before(getCalendar(course.getString(START_DATE),DATE_FORMATTER))){
            start.add(Calendar.WEEK_OF_YEAR, 1);
        }
        return start;
    }
    Calendar lastOccurrenceDate(JsonObject course){
        Calendar end = getCalendar(course.getString(END_DATE), DATE_FORMATTER);
        end.set(Calendar.DAY_OF_WEEK, course.getInteger("dayOfWeek")+1);
        if(end.after(getCalendar(course.getString(END_DATE), DATE_FORMATTER))){
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
    public Date addDays (Date dt, int days){
        Calendar c = Calendar.getInstance();
        c.setTime(dt);
        c.add(Calendar.DATE, days);
        return c.getTime();
    }

    int daysBetween(Calendar startDate, Calendar endDate) {
        long end = endDate.getTimeInMillis();
        long start = startDate.getTimeInMillis();
        return (int) TimeUnit.MILLISECONDS.toDays(Math.abs(end - start));
    }

    public int daysBetween(Date startDate, Date endDate) {
        long end = endDate.getTime();
        long start = startDate.getTime();
        return (int) TimeUnit.MILLISECONDS.toDays(Math.abs(end - start));
    }

    int daysBetween(String startDate, String endDate) {
        Calendar start = this.getCalendar(startDate, this.DATE_FORMATTER);
        Calendar end = this.getCalendar(endDate, this.DATE_FORMATTER);
        return this.daysBetween(start, end);
    }

    public Date getDate(String dateString, SimpleDateFormat dateFormat ){
        Date date= new Date();
        try{
            date =  dateFormat.parse(dateString);
        } catch (ParseException e) {
            LOGGER.error("error when casting date: ", e);
        }
        return date ;
    }
    Calendar getCalendar(String dateString, SimpleDateFormat dateFormat){
        Calendar date= Calendar.getInstance();
        try{
            date.setTime(dateFormat.parse(dateString))  ;
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
                            + TIME_FORMATTER.format(getDate(part2,DATE_FORMATTER)));
        } catch (ParseException e) {
            LOGGER.error("error when casting date: ", e);
        }
        return date ;
    }

    int getWeekOfYear(Date date) {
        Calendar c = Calendar.getInstance();
        c.setTime(date);
        return c.get(Calendar.WEEK_OF_YEAR);
    }

    int getWeekOfYear(String datetring) {
        Date date = this.getDate(datetring, this.SIMPLE_DATE_FORMATTER);
        return this.getWeekOfYear(date);
    }

    int getDayOfWeek(Date date) {
        Calendar c = Calendar.getInstance();
        c.setTime(date);
        return c.get(Calendar.DAY_OF_WEEK);
    }



    String addDaysToDate(String dateString, int days) {
        Calendar date = this.getCalendar(dateString, this.DATE_FORMATTER);
        date.add(Calendar.DATE, days);
        return DATE_FORMATTER.format(date.getTime());
    }


    String goToNextFirstDayOfWeek(String dateString) {
        Calendar date = this.getCalendar(dateString, this.DATE_FORMATTER);
        int daysNeeded = 7 - getDayOfWeek(date.getTime());
        date.add(Calendar.DATE, daysNeeded);
        return DATE_FORMATTER.format(date.getTime());
    }

    public String getDateString(Date date) {
        String result = null;
        try {
            result = SIMPLE_DATE_FORMATTER.format(date);
        } catch (Exception e) {
            LOGGER.error("error when casting date: ", e);
        }
        return result;
    }
}

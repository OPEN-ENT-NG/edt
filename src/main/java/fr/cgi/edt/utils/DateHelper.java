package fr.cgi.edt.utils;

import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class DateHelper {
    private static final Logger LOGGER = LoggerFactory.getLogger(EdtServiceMongoImpl.class);
    public final SimpleDateFormat SIMPLE_DATE_FORMATTER = new SimpleDateFormat("yyyy-MM-dd");
    public final SimpleDateFormat DATE_FORMATTER= new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
    public final SimpleDateFormat DATE_FORMATTER_SQL= new SimpleDateFormat("yyyy-MM-dd' 'HH:mm:ss");
    public final SimpleDateFormat TIME_FORMATTER = new SimpleDateFormat("HH:mm:ss");
    private static final String  START_DATE = "startDate";
    private static final String  END_DATE = "endDate";
    private static final String  DAY_OF_WEEK = "dayOfWeek";

    public static final String SQL_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
    public static final String MONGO_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String SQL_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss.SSSSSSZ";
    public static final String YEAR_MONTH_DAY_HOUR_MINUTES_SECONDS = "yyyy/MM/dd HH:mm:ss";
    public static final String YEAR_MONTH_DAY = "yyyy-MM-dd";
    public static final String YEAR = "yyyy";


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

    public int msBetween(String startDate, String endDate) {
        long start = this.getCalendar(startDate, this.DATE_FORMATTER).getTimeInMillis();
        long end = this.getCalendar(endDate, this.DATE_FORMATTER).getTimeInMillis();
        return (int) TimeUnit.MILLISECONDS.toMillis(end - start);
    }

    public String now() {
        return new DateHelper().DATE_FORMATTER.format(new Date());
    }

    public Date now(SimpleDateFormat dateFormat) {
        return getDate(now(), dateFormat);
    }

    public int isBefore(String a, String b) {
        Date dateA = getDate(a, DATE_FORMATTER);
        Date dateB = getDate(b, DATE_FORMATTER);
        return dateA.before(dateB) ? 1 : -1;
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
        return date;
    }

    /**
     * Add to the date the number of specified value
     *
     * @param date   date you want to update
     * @param value  value. Use Calendar types
     * @param number number you want to "add"
     * @return new date updated with the new value
     */
    public static Date add(Date date, int value, int number) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.add(value, number);
        return cal.getTime();
    }

    public int getHour(Date date) {
        Calendar calendar = Calendar.getInstance(Locale.FRANCE);
        calendar.setTime(date);
        return calendar.get(Calendar.HOUR_OF_DAY);
    }

    public int getMinutes(Date date) {
        Calendar calendar = Calendar.getInstance(Locale.FRANCE);
        calendar.setTime(date);
        return calendar.get(Calendar.MINUTE);
    }

    public int getSecond(Date date) {
        Calendar calendar = Calendar.getInstance(Locale.FRANCE);
        calendar.setTime(date);
        return calendar.get(Calendar.SECOND);
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

    /**
     * Get Day of Week
     *
     * @param date date chosen to get the day of week
     * @return day of week (e.g 2019-10-26 would return 6)
     */
    int getDayOfWeek(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        if ((calendar.get(Calendar.DAY_OF_WEEK) - 1) == 0) {
            return 7;
        }
        return calendar.get(Calendar.DAY_OF_WEEK) - 1;
    }

    public int getDayOfWeek(int weekNumber) {
        if (weekNumber + 1 == 8) {
            return 1;
        }
        return weekNumber + 1;
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

    /**
     * Get Simple date as string, use in case your date format is not standard
     *
     * @param date         date to format
     * @param format       the source format
     * @param wishedFormat the format wished
     * @return Simple date format as string
     */
    public static String getDateString(String date, String format, String wishedFormat) {
        try {
            Date parsedDate = parse(date, format);
            return new SimpleDateFormat(wishedFormat).format(parsedDate);
        } catch (ParseException err) {
            LOGGER.error("[Edt@DateHelper::getDateString] Failed to parse date " + date, err);
            return date;
        }
    }

    public static Date parse(String date, String format) throws ParseException {
        SimpleDateFormat sdf = new SimpleDateFormat(format);
        return sdf.parse(date);
    }

    public static boolean isDateBefore(String targetDate, String comparedDate) {
        LocalDate dateTarget = LocalDate.parse(targetDate);
        LocalDate date = LocalDate.parse(comparedDate);

        return dateTarget.isBefore(date);
    }

    public static boolean isDateAfter(String targetDate, String comparedDate) {
        LocalDate dateTarget = LocalDate.parse(targetDate);
        LocalDate date = LocalDate.parse(comparedDate);

        return dateTarget.isAfter(date);
    }
}

package fr.cgi.edt.utils;

import fr.cgi.edt.core.enums.DayOfWeek;
import fr.cgi.edt.services.impl.EdtServiceMongoImpl;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
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
    public static final String HOUR_MINUTES = "HH:mm";
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
    public static Date addDays (Date dt, int days){
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

    public static Date getDate(String dateString, String dateFormat){
        Date date = new Date();
        try{
            SimpleDateFormat format = new SimpleDateFormat(dateFormat);
            date =  format.parse(dateString);
        } catch (ParseException e) {
            LOGGER.error("[Edt@DateHelper::getDate] error when casting date: " + dateString + ". " + e);
        }
        return date;
    }

    Calendar getCalendar(String dateString, SimpleDateFormat dateFormat){
        Calendar date= Calendar.getInstance();
        try{
            date.setTime(dateFormat.parse(dateString))  ;
        } catch (ParseException e) {
            LOGGER.error("[Edt@DateHelper::getCalendar] error when casting date: " + dateString + ". " + e);
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
            LOGGER.error("[Edt@DateHelper::getCombineDate] error when casting dates. " + e);
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
    public static Date setTimeFromString(Date date, String time, String timeFormat) {
        try {
            SimpleDateFormat tf = new SimpleDateFormat(timeFormat);
            Date timeDate = tf.parse(time);
            LocalDateTime dateTime = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            LocalDateTime timeDateTime = timeDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            dateTime = dateTime.withHour(timeDateTime.getHour()).withMinute(timeDateTime.getMinute());
            return Date.from(dateTime.atZone(ZoneId.systemDefault()).toInstant());
        } catch (ParseException e) {
            LOGGER.error("[Edt@DateHelper::setTimeFromString] error when casting time: " + time + ". " + e.getMessage());
        }
        return date;
    }

    public static String getStringFromDateWithTime(Date date, String time, String timeFormat) {
        return getDateString(setTimeFromString(date, time, timeFormat), SQL_FORMAT);
    }

    public static String getDateString(Date date, String format) {
        SimpleDateFormat sdf = new SimpleDateFormat(format);
        return sdf.format(date);
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

    public static int toDayOfWeek(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        if ((calendar.get(Calendar.DAY_OF_WEEK) - 1) == 0) {
            return Calendar.SATURDAY; // sunday = calendar.SATURDAY value
        }
        return calendar.get(Calendar.DAY_OF_WEEK) - 1;
    }

    public static boolean isDateDayOfWeek(Date date, int calendarDayOfWeek) {
        return toDayOfWeek(date) == toDayOfWeek(calendarDayOfWeek);
    }

    public int getDayOfWeek(int weekNumber) {
        if (weekNumber + 1 == 8) {
            return 1;
        }
        return weekNumber + 1;
    }

    public static int toDayOfWeek(int weekNumber) {
        return weekNumber + 1 == Calendar.SATURDAY + 1 ? 1 : weekNumber + 1;
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

    public static Date goToNextDayOfWeek(Date date, DayOfWeek dayOfWeek){
        LocalDate localDate = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate nextDayOfWeek = localDate.with(TemporalAdjusters.next(java.time.DayOfWeek.of(dayOfWeek.ordinal() + 1)));
        return Date.from(nextDayOfWeek.atStartOfDay(ZoneId.systemDefault()).toInstant());
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
            LOGGER.error("[Edt@DateHelper::getDateString] Failed to parse date " + date + ". " + err);
            return date;
        }
    }

    public static Date parse(String date, String format) throws ParseException {
        SimpleDateFormat sdf = new SimpleDateFormat(format);
        return sdf.parse(date);
    }

    /**
     * Get Simple format date as PostgreSQL timestamp without timezone format
     *
     * @return Simple date format
     */
    public static SimpleDateFormat getPsqlSimpleDateFormat() {
        return new SimpleDateFormat(SQL_FORMAT);
    }

    /**
     * Get Simple format date as PostgreSQL date format
     *
     * @return Simple date format
     */
    public static SimpleDateFormat getPsqlDateSimpleDateFormat() {
        return new SimpleDateFormat(SQL_DATE_FORMAT);
    }

    public static SimpleDateFormat getMongoSimpleDateFormat() {
        return new SimpleDateFormat(MONGO_FORMAT);
    }

    public static Date parse(String date) throws ParseException {
        SimpleDateFormat ssdf = DateHelper.getPsqlSimpleDateFormat();
        SimpleDateFormat msdf = DateHelper.getMongoSimpleDateFormat();
        return date.contains("T") ? ssdf.parse(date) : msdf.parse(date);
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

    /**
     * Check if the first date is after or equals the second date
     *
     * @param date1 First date
     * @param date2 Second date
     * @return Boolean that match if the first date is after the second date
     */
    public static boolean isAfterOrEquals(String date1, String date2) {
        Date firstDate = new Date();
        Date secondDate = new Date();
        try {
            firstDate = parse(date1);
            secondDate = parse(date2);
        } catch (ParseException e) {
            LOGGER.error("[EDT@DateHelper::isAfterOrEquals] Error when casting date: ", e);
        }


        return firstDate.after(secondDate) || firstDate.equals(secondDate);
    }

    /**
     * Check if the first date is after the second date
     *
     * @param date1 First date
     * @param date2 Second date
     * @return Boolean that match if the first date is after the second date
     */
    public static boolean isAfter(String date1, String date2) {
        Date firstDate = new Date();
        Date secondDate = new Date();
        try {
            firstDate = parse(date1);
            secondDate = parse(date2);
        } catch (ParseException e) {
            LOGGER.error("[EDT@DateHelper::isAfter] Error when casting date: ", e);
        }


        return firstDate.after(secondDate);
    }
}

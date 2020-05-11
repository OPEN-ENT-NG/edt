package fr.cgi.edt.sts.bean;

import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.Locale;

public class Week {
    private Logger log = LoggerFactory.getLogger(Week.class);

    private String ZONE_ID = "Europe/Berlin";
    private DateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.FRANCE);
    private String start;
    private Date startDate;
    private int firstDayOfWeek = Calendar.MONDAY;
    private Calendar calendar;

    public Week(String start) throws ParseException {
        calendar = GregorianCalendar.getInstance(Locale.FRANCE);
        calendar.setFirstDayOfWeek(firstDayOfWeek);
        this.start = start;
        this.startDate = toDate(start);

        int dayOfWeek = getDayOfWeek(this.startDate);

        // If the date day of week is nos the first day of the week, set the start date to the first day of the week
        if (dayOfWeek > firstDayOfWeek) {
            this.startDate = minusDays(this.startDate, dayOfWeek - firstDayOfWeek);
        }
    }

    private Date toDate(String date) throws ParseException {
        return this.sdf.parse(date);
    }

    private int getDayOfWeek(Date date) {
        calendar.setTime(date);
        return calendar.get(Calendar.DAY_OF_WEEK);
    }

    private LocalDateTime dateToLocalDateTime(Date date) {
        return LocalDateTime.ofInstant(date.toInstant(), ZoneId.of(ZONE_ID));
    }

    private Date localeDateTimeToDate(LocalDateTime lDate) {
        return Date.from(lDate.atZone(ZoneId.of(ZONE_ID)).toInstant());
    }

    private Date minusDays(Date date, int minus) {
        return localeDateTimeToDate(dateToLocalDateTime(date).minusDays(minus));
    }

    private Date plusDays(Date date, int plus) {
        return localeDateTimeToDate(dateToLocalDateTime(date).plusDays(plus));
    }

    public Date startDate() {
        return this.startDate;
    }

    public Date getDateOfWeek(int dayOfWeek) {
        return plusDays(this.startDate, dayOfWeek - 1);
    }

    public Boolean isFutureOrCurrentWeek() {
        calendar.setTime(new Date());
        int nowWeekNumber = calendar.get(Calendar.WEEK_OF_YEAR);
        int nowYearNumber = calendar.get(Calendar.YEAR);

        calendar.setTime(startDate);
        int startDateWeekNumber = calendar.get(Calendar.WEEK_OF_YEAR);
        int startDateYearNumber = calendar.get(Calendar.YEAR);

        return ((startDateWeekNumber >= nowWeekNumber) && (nowYearNumber == startDateYearNumber)) || (nowYearNumber < startDateYearNumber);
    }

    public JsonObject toJSON() {
        return new JsonObject()
                .put("start", this.start);
    }
}

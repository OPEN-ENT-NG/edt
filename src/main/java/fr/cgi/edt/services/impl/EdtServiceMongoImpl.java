package fr.cgi.edt.services.impl;

import fr.cgi.edt.utils.EdtMongoHelper;
import fr.cgi.edt.services.EdtService;
import fr.wseduc.webutils.Either;
import io.vertx.core.eventbus.EventBus;
import org.entcore.common.service.impl.MongoDbCrudService;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.entcore.common.sql.Sql;
import org.entcore.common.sql.SqlResult;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.entcore.common.http.response.DefaultResponseHandler.notEmptyResponseHandler;


/**
 * MongoDB implementation of the REST service.
 * Methods are usually self-explanatory.
 */
public class EdtServiceMongoImpl extends MongoDbCrudService implements EdtService {

    private final String collection;
    private final EventBus eb;

    public EdtServiceMongoImpl(final String collection, EventBus eb) {
        super(collection);
        this.collection = collection;
        this.eb = eb;
    }

    @Override
    public void create(JsonArray courses, Handler<Either<String, JsonObject>> handler) {
        this.courseIsFullyOverlapingExclusionPeriod(courses, result -> {
            if (result.isRight() && !result.right().getValue()) {
                // If the course doesn't touch fully exclusion periods, so we can create the course
                new EdtMongoHelper(this.collection, eb).manageCourses(courses, handler);
            } else {
                handler.handle(new Either.Left<>("Error: create course"));
            }
        });
    }

    private List<LocalDateTime> getOccurenceDateInCourse(JsonObject course){
        // Transform a course into an array of occurence with the date format to ISO-8601 without timezone

        // The courses comes with the ISO-8601 without timezone format so we can create LocalDateTime object directly
        LocalDateTime courseStartDate = LocalDateTime.parse(course.getString("startDate"));
        LocalDateTime courseEndDate = LocalDateTime.parse(course.getString("endDate"));

        // Gets all the date on the same day of week, between the period
        List<LocalDateTime> occurenceDates = new ArrayList<>();
        while (!courseStartDate.isAfter(courseEndDate)) {
            occurenceDates.add(courseStartDate);
            courseStartDate = courseStartDate.plusDays(7);
        }

        return occurenceDates;
    }

    private void courseIsFullyOverlapingExclusionPeriod(JsonArray courses, Handler<Either<String, Boolean>> handler) {
        JsonArray values = new JsonArray();
        StringBuilder query = new StringBuilder();

        List<LocalDateTime> occurenceDates = new ArrayList<>();
        for (int i = 0; i < courses.size(); i++) {
            occurenceDates.addAll(getOccurenceDateInCourse(courses.getJsonObject(i)));
        }

        query.append(" SELECT *");
        query.append(" FROM edt.period_exclusion");
        for(LocalDateTime occurenceDate : occurenceDates) {
            query.append(" OR (?::DATE) BETWEEN start_date AND end_date");
            values.add(occurenceDate.toString());
        }

        Sql.getInstance().prepared(query.toString().replaceFirst("OR", "WHERE"), values, SqlResult.validResultHandler(result -> {
            if(result.isRight()){
                JsonArray exclusionPeriods = result.right().getValue();
                // If all occurences touch an exclusion period we return true
                handler.handle(new Either.Right<>(exclusionPeriods.size() == occurenceDates.size()));
            }
        }));
    }

    @Override
    public void update(JsonArray courses, Handler<Either<String, JsonObject>> handler) {
        this.courseIsFullyOverlapingExclusionPeriod(courses, result -> {
            if (result.isRight() && !result.right().getValue()) {
                // If the course doesn't touch fully exclusion periods, so we can create the course
                new EdtMongoHelper(this.collection, eb).manageCourses(courses, handler);
            } else {
                handler.handle(new Either.Left<>("Error: create course"));
            }
        });
    }

    @Override
    public void delete(final String id, final Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).delete(id, handler);
    }


    @Override
    public void updateOccurrence(JsonObject course, String dateOccurrence, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).updateOccurrence(course, dateOccurrence, handler);
    }

    @Override
    public void deleteOccurrence(String id, String dateOccurrence, Handler<Either<String, JsonObject>> handler) {
        new EdtMongoHelper(this.collection, eb).deleteOccurrence(id, dateOccurrence, handler);
    }
}

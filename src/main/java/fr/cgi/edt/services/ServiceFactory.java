package fr.cgi.edt.services;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.models.holiday.HolidaysConfig;
import fr.cgi.edt.services.impl.DefaultCourseService;
import fr.cgi.edt.services.impl.DefaultInitImpl;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.sql.Sql;

public class ServiceFactory {
    private final Vertx vertx;

    private final Sql sql;
    private final Neo4j neo4j;
    private final MongoDb mongoDb;

    private final HolidaysConfig holidaysConfig;

    private final InitService initService;

    private final CourseService courseService;

    public ServiceFactory(Vertx vertx, JsonObject config, Sql sql, Neo4j neo4j, MongoDb mongoDb) {
        this.vertx = vertx;
        this.sql = sql;
        this.neo4j = neo4j;
        this.mongoDb = mongoDb;
        this.holidaysConfig = new HolidaysConfig(config.getJsonObject(Field.HOLIDAYS));
        this.initService = new DefaultInitImpl("edt", vertx, holidaysConfig);
        this.courseService = new DefaultCourseService(this);
    }

    public HolidaysConfig holidaysConfig() {
        return holidaysConfig;
    }

    public InitService initService() {
        return initService;
    }

    public CourseService courseService() {
        return courseService;
    }
    public EventBus eventBus() {
        return this.vertx.eventBus();
    }

    public Vertx vertx() {
        return this.vertx;
    }

    public Sql sql() {
        return sql;
    }

    public MongoDb mongoDb() {
        return mongoDb;
    }

    public Neo4j neo4j() {
        return neo4j;
    }
}

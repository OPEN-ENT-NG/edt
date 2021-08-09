package fr.cgi.edt;

import fr.cgi.edt.controllers.ConfigController;
import fr.cgi.edt.controllers.InitController;
import fr.cgi.edt.controllers.SearchController;
import fr.cgi.edt.models.holiday.HolidaysConfig;
import fr.cgi.edt.services.ServiceFactory;
import fr.cgi.edt.services.impl.DefaultInitImpl;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.eventbus.EventBus;
import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;

import fr.cgi.edt.controllers.EdtController;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.sql.Sql;

public class Edt extends BaseServer {

    public static final String EDT_COLLECTION = "courses";
    public static final String EDT_SCHEMA = "edt";
    public static final String EXCLUSION_TYPE_TABLE = "exclusion_type";
    public static final String EXCLUSION_JSON_SCHEMA = "exclusion";
    public static final String SEARCH = "edt.search";

    static EventBus eb;

    @Override
    public void start() throws Exception {
        super.start();
        eb = getEventBus(vertx);

        EventStore eventStore = EventStoreFactory.getFactory().getEventStore(Edt.class.getSimpleName());
        ServiceFactory serviceFactory = new ServiceFactory(vertx, Neo4j.getInstance(), Sql.getInstance(), MongoDb.getInstance());
        HolidaysConfig holidaysConfig = new HolidaysConfig(config.getJsonObject("holidays"));


        addController(new EdtController(EDT_COLLECTION, eb, eventStore));
        addController(new InitController(new DefaultInitImpl("edt", serviceFactory, holidaysConfig), vertx));
        addController(new SearchController(eb));
        addController(new ConfigController());

        MongoDbConf.getInstance().setCollection(EDT_COLLECTION);
        setDefaultResourceFilter(new ShareAndOwner());
    }
}

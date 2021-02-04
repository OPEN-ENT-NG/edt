package fr.cgi.edt;

import fr.cgi.edt.controllers.InitController;
import fr.cgi.edt.controllers.SearchController;
import fr.cgi.edt.services.impl.DefaultInitImpl;
import io.vertx.core.eventbus.EventBus;
import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;

import fr.cgi.edt.controllers.EdtController;

public class Edt extends BaseServer {

    public final static String EDT_COLLECTION = "courses";
    public final static String EDT_SCHEMA = "edt";
    public final static String EXCLUSION_TYPE_TABLE = "exclusion_type";
    public static final String SEARCH = "edt.search";
    static EventBus eb;
    public final static String EXCLUSION_JSON_SCHEMA = "exclusion";

    @Override
    public void start() throws Exception {
        super.start();
        eb = getEventBus(vertx);

        EventStore eventStore = EventStoreFactory.getFactory().getEventStore(Edt.class.getSimpleName());

        addController(new EdtController(EDT_COLLECTION, eb, eventStore));
        addController(new InitController(new DefaultInitImpl("edt"), vertx));
        addController(new SearchController(eb));

        MongoDbConf.getInstance().setCollection(EDT_COLLECTION);
        setDefaultResourceFilter(new ShareAndOwner());
    }
}

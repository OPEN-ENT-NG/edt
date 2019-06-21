package fr.cgi.edt;

import fr.cgi.edt.controllers.InitController;
import fr.cgi.edt.services.impl.DefaultInitImpl;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.shareddata.LocalMap;
import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;

import fr.cgi.edt.controllers.EdtController;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;

public class Edt extends BaseServer {

    public final static String EDT_COLLECTION = "courses";
    public final static String EDT_SCHEMA = "edt";
    public final static String EXCLUSION_TYPE_TABLE = "exclusion_type";
    static EventBus eb;
    public final static String EXCLUSION_JSON_SCHEMA = "exclusion";

    @Override
    public void start() throws Exception {
        super.start();
        eb = getEventBus(vertx);
        addController(new EdtController(EDT_COLLECTION, eb));
        addController(new InitController(new DefaultInitImpl("edt",eb)));

        MongoDbConf.getInstance().setCollection(EDT_COLLECTION);
        setDefaultResourceFilter(new ShareAndOwner());

        vertx.setTimer(1000, new Handler<Long>() {
            @Override
            public void handle(Long aLong) {
                if (!validDependencies()) {
                    LocalMap<String, String> deploymentsIdMap = vertx.sharedData().getLocalMap("deploymentsId");
                    vertx.undeploy(deploymentsIdMap.get("fr.cgi.edt"));
                }
            }
        });
    }

    private boolean validDependencies () {
        Boolean isValid = true;
        if ("prod".equals(config.getString("mode"))) {
            JsonObject dependencies = config.getJsonObject("dependencies");
            final LocalMap<Object, Object> versionMap = vertx.sharedData().getLocalMap("versions");
            for (String mod : dependencies.fieldNames()) {
                if (!isMajor(versionMap.get(mod).toString(), dependencies.getString(mod))) {
                    log.error(mod + " minor version. Please upgrade " + mod + " version to " + dependencies.getString(mod) + " and upper");
                    isValid = false;
                }
            }
        }
        return isValid;
    }

    private boolean isMajor (String currentVersion, String expectedVersion) {
        Boolean isMajor = true;
        String[] splittedCurrentVersion = currentVersion.split("[\\.|-]");
        String[] splittedExpectedVersion = expectedVersion.split("[\\.|-]");
        for (int i = 0; i < splittedCurrentVersion.length; i++) {
            if ("SNAPSHOT".equals(splittedCurrentVersion[i])) { splittedCurrentVersion[i] = "0"; }
            isMajor = (isMajor && (Integer.parseInt(splittedCurrentVersion[i]) >= Integer.parseInt(splittedExpectedVersion[i])));
        }
        return isMajor;
    }

}

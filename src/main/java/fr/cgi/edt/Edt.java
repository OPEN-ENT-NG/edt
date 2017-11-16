package fr.cgi.edt;

import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;

import fr.cgi.edt.controllers.EdtController;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.shareddata.ConcurrentSharedMap;

public class Edt extends BaseServer {

    private final static String EDT_COLLECTION = "courses";
    public final static String EDT_SCHEMA = "edt";
    public final static String EXCLUSION_TABLE = "period_exclusion";
    public final static String EXCLUSION_TYPE_TABLE = "exclusion_type";

    public final static String EXCLUSION_JSON_SCHEMA = "exclusion";

    @Override
    public void start() {
        super.start();

        addController(new EdtController(EDT_COLLECTION));
        MongoDbConf.getInstance().setCollection(EDT_COLLECTION);
        setDefaultResourceFilter(new ShareAndOwner());

        vertx.setTimer(1000, new Handler<Long>() {
            @Override
            public void handle(Long aLong) {
                if (!validDependencies()) {
                    ConcurrentSharedMap<String, String> deploymentsIdMap = vertx.sharedData().getMap("deploymentsId");
                    container.undeployModule(deploymentsIdMap.get("fr.cgi.edt"));
                }
            }
        });
    }

    private boolean validDependencies () {
        Boolean isValid = true;
        if ("prod".equals(config.getString("mode"))) {
            JsonObject dependencies = config.getObject("dependencies");
            final ConcurrentSharedMap<Object, Object> versionMap = vertx.sharedData().getMap("versions");
            for (String mod : dependencies.getFieldNames()) {
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

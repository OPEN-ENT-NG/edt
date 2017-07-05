package fr.cgi.edt;

import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;

import fr.cgi.edt.controllers.EdtController;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.shareddata.ConcurrentSharedMap;

public class Edt extends BaseServer {

	public final static String EDT_COLLECTION = "edt";

	@Override
	public void start() {
		super.start();
		addController(new EdtController(EDT_COLLECTION));
		MongoDbConf.getInstance().setCollection(EDT_COLLECTION);
		setDefaultResourceFilter(new ShareAndOwner());
		checkDependencies();
	}

	private void checkDependencies () {
		JsonObject dependencies = config.getObject("dependencies");
		final ConcurrentSharedMap<Object, Object> versionMap = vertx.sharedData().getMap("versions");
		for (String mod: dependencies.getFieldNames()) {
			if (!isMajor(versionMap.get(mod).toString(), dependencies.getString(mod))) {
				log.error(mod + " minor version. Please upgrade " + mod + "version to " + dependencies.getString(mod) + " and upper");
			}
		}
		String vscoVersion = versionMap.get("fr.openent.viescolaire").toString();
	}

	private boolean isMajor (String currentVersion, String desireVersion) {
		return false;
	}

}

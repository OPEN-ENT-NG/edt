package fr.cgi.edt;

import org.entcore.common.http.BaseServer;
import org.entcore.common.http.filter.ShareAndOwner;
import org.entcore.common.mongodb.MongoDbConf;

import fr.cgi.edt.controllers.EdtController;

public class Edt extends BaseServer {

	public final static String EDT_COLLECTION = "edt";

	@Override
	public void start() {
		super.start();
		addController(new EdtController(EDT_COLLECTION));
		MongoDbConf.getInstance().setCollection(EDT_COLLECTION);
		setDefaultResourceFilter(new ShareAndOwner());
	}

}

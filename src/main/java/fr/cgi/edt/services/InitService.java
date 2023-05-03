package fr.cgi.edt.services;

import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;

public interface InitService {

    /**
     * Script method to initialize all dates to viescolaire table setting period
     *
     * @param structure         structure identifier
     * @param zone              school's zone (A, B or C accepted)
     * @param initSchoolYear    true if we want to initialize school year
     * @return                  future with json object
     */
    Future<JsonObject> init(String structure, String zone, boolean initSchoolYear);
}

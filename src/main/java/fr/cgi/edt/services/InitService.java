package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;

public interface InitService {

    /**
     * Script method to initialize all dates to viescolaire table setting period
     *
     * @param structure     structure identifier
     * @param zone          school's zone (A, B or C accepted)
     * @param handler       handler method will reply {@link JsonObject}
     */
    void init(String structure, String zone, Handler<Either<String, JsonObject>> handler);
}

package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;

public interface StsService {

    void reports(String uai, Handler<Either<String, JsonArray>> handler);
}

package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;

public interface InitService {
    void init(String structure, Handler<Either<String, JsonObject>> handler);
}

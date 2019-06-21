package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;

public interface StsService {

    void uploadImport(Vertx vertx, final HttpServerRequest request, final String path, final Handler<AsyncResult> handler);

    void readSts(Vertx vertx, final String path, Handler<Either<String, JsonObject>> handler);

}

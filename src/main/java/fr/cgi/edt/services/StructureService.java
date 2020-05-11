package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;

public interface StructureService {

    void retrieveUAI(String id, Handler<Either<String, String>> handler);
}

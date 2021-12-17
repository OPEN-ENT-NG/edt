package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;

import java.util.List;

public interface StructureService {

    void retrieveUAI(String id, Handler<Either<String, String>> handler);


    /**
     * fetch structures info
     *
     * @param structuresId   list of structure identifier
     * @param handler       handler
     */
    void fetchStructuresInfos(List<String> structuresId, Handler<Either<String, JsonArray>> handler);

}

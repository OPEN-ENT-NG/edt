package fr.cgi.edt.services;

import fr.wseduc.webutils.Either;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.json.impl.Json;

public interface SettingsService {

    /**
     * List all period eclusions in database based on structure id
     *
     * @param structureId structure id
     * @param handler handler returning query result
     */
    void listExclusion(String structureId, Handler<Either<String, JsonArray>> handler);

    /**
     * Create exclusion
     * @param exclusion  exclusion to create
     * @param handler handler returning result
     */
    void createExclusion(JsonObject exclusion, Handler<Either<String, JsonArray>> handler);

    /**
     * Delete provided exclusion
     * @param exclusionId exclusion to delete
     * @param result handler returning result
     */
    void deleteExclusion(Integer exclusionId, Handler<Either<String, JsonArray>> result);

    /**
     * Update an exclusion based on id
     * @param id exclusion id to update
     * @param exclusion exclustion to update
     * @param result handler returning result
     */
    void updateExclusion (Integer id, JsonObject exclusion, Handler<Either<String, JsonArray>> result);
}

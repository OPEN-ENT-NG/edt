package fr.cgi.edt.services.impl;

import fr.cgi.edt.Edt;
import fr.cgi.edt.services.SettingsService;
import fr.wseduc.webutils.Either;
import org.entcore.common.service.impl.SqlCrudService;
import org.entcore.common.sql.Sql;
import org.entcore.common.sql.SqlResult;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

public class SettingsServicePostgresImpl extends SqlCrudService implements SettingsService {
    protected static final Logger log = LoggerFactory.getLogger(SettingsServicePostgresImpl.class);

    public SettingsServicePostgresImpl(String schema, String table) {
        super(schema, table);
    }

    @Override
    public void listExclusion(String structureId, Handler<Either<String, JsonArray>> handler) {
        String query = "SELECT * FROM " + Edt.EDT_SCHEMA + "." + Edt.EXCLUSION_TABLE +
            " WHERE " + Edt.EXCLUSION_TABLE + ".id_structure = ?;";
        JsonArray params = new JsonArray().addString(structureId);

        Sql.getInstance().prepared(query, params, SqlResult.validResultHandler(handler));
    }

    @Override
    public void createExclusion(JsonObject exclusion, Handler<Either<String, JsonArray>> handler) {
        String query = "INSERT INTO " + Edt.EDT_SCHEMA + "." + Edt.EXCLUSION_TABLE + "(" +
                "start_date, end_date, description, id_structure) " +
                "VALUES (to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), ?, ?) RETURNING *;";
        JsonArray params = new JsonArray()
                .addString(exclusion.getString("start_date"))
                .addString(exclusion.getString("end_date"))
                .addString(exclusion.getString("description"))
                .addString(exclusion.getString("id_structure"));

        Sql.getInstance().prepared(query, params, SqlResult.validResultHandler(handler));
    }

    @Override
    public void deleteExclusion(Integer exclusionId, Handler<Either<String, JsonArray>> result) {
        String query = "DELETE FROM " + Edt.EDT_SCHEMA + "." + Edt.EXCLUSION_TABLE +
                " WHERE id = ?;";
        JsonArray params = new JsonArray().addNumber(exclusionId);

        Sql.getInstance().prepared(query, params, SqlResult.validResultHandler(result));
    }

    @Override
    public void updateExclusion(Integer id, JsonObject exclusion, Handler<Either<String, JsonArray>> result) {
        String query = "UPDATE "+ Edt.EDT_SCHEMA + "." + Edt.EXCLUSION_TABLE +
                " SET start_date= to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), end_date= to_timestamp(?, 'YYYY-MM-DD HH24:MI:SS'), description= ?, id_structure= ?" +
                " WHERE id = ? RETURNING *;";

        JsonArray params = new JsonArray()
                .addString(exclusion.getString("start_date"))
                .addString(exclusion.getString("end_date"))
                .addString(exclusion.getString("description"))
                .addString(exclusion.getString("id_structure"))
                .addNumber(id);

        Sql.getInstance().prepared(query, params, SqlResult.validResultHandler(result));
    }
}

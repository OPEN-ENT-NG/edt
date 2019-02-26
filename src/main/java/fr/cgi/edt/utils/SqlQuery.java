package fr.cgi.edt.utils;


import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

public class SqlQuery {
    private String query;
    private JsonArray paramsUpdate;
    private JsonObject paramsInsert;
    private String table;
    private Type type;

    public JsonArray getParamsUpdate() {
        return paramsUpdate;
    }

    public JsonObject getParamsInsert() {
        return paramsInsert;
    }

    public String getTable() {
        return table;
    }

    public Type getType() {
        return type;
    }

    public enum Type { INSERT,UDATE}
    public String getQuery() {
        return query;
    }


    public SqlQuery(String query, JsonArray paramsUpdate){
        this.query=query;
        this.paramsUpdate=paramsUpdate;
        this.type = Type.UDATE;
    }

    public SqlQuery(String table, JsonObject paramsInsert){
        this.table=table;
        this.paramsInsert=paramsInsert;
        this.type = Type.INSERT;
    }
}

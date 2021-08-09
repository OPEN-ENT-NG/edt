package fr.cgi.edt.helper;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.models.holiday.HolidayRecord;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;
import java.util.stream.Collectors;

public class HolidayHelper {

    private HolidayHelper() { throw new IllegalStateException("Helper class"); }

    public static List<HolidayRecord> holidaysRecords(JsonArray records) {
        return records.stream().map(r -> new HolidayRecord(((JsonObject) r).getJsonObject(Field.FIELDS))).collect(Collectors.toList());
    }
}

package fr.cgi.edt.services;

import fr.cgi.edt.core.constants.Field;
import fr.cgi.edt.models.holiday.HolidaysConfig;
import fr.cgi.edt.services.impl.DefaultInitImpl;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;

public class ServiceFactory {
    private final Vertx vertx;

    private final HolidaysConfig holidaysConfig;

    private final InitService initService;

    public ServiceFactory(Vertx vertx, JsonObject config) {
        this.vertx = vertx;
        this.holidaysConfig = new HolidaysConfig(config.getJsonObject(Field.HOLIDAYS));
        this.initService = new DefaultInitImpl("edt", vertx, holidaysConfig);
    }

    public HolidaysConfig holidaysConfig() {
        return holidaysConfig;
    }

    public InitService initService() {
        return initService;
    }

    public EventBus eventBus() {
        return this.vertx.eventBus();
    }

    public Vertx vertx() {
        return this.vertx;
    }
}

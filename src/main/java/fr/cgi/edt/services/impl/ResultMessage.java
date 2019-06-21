package fr.cgi.edt.services.impl;

import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.core.MultiMap;
import io.vertx.core.eventbus.DeliveryOptions;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonObject;

public class ResultMessage implements Message<JsonObject> {

    private final JsonObject body = new JsonObject().put("status", "ok");
    private final Handler<JsonObject> handler;

    public ResultMessage() {
        handler = null;
    }

    public ResultMessage(Handler<JsonObject> handler) {
        this.handler = handler;
    }

    public ResultMessage put(String attr, Object o) {
        body.put(attr, o);
        return this;
    }

    public ResultMessage error(String message) {
        body.put("status", "error");
        body.put("message", message);
        return this;
    }

    @Override
    public String address() {
        return null;
    }

    @Override
    public MultiMap headers() {
        return null;
    }

    @Override
    public JsonObject body() {
        return body;
    }

    @Override
    public String replyAddress() {
        return null;
    }

    @Override
    public boolean isSend() {
        return false;
    }

    @Override
    public void reply(Object message) {
        if (handler != null) {
            handler.handle((JsonObject) message);
        }
    }

    @Override
    public <R> void reply(Object message, Handler<AsyncResult<Message<R>>> replyHandler) {

    }

    @Override
    public void reply(Object message, DeliveryOptions options) {

    }

    @Override
    public <R> void reply(Object message, DeliveryOptions options, Handler<AsyncResult<Message<R>>> replyHandler) {

    }

    @Override
    public void fail(int failureCode, String message) {

    }

}

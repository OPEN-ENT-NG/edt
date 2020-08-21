package fr.cgi.edt.helper;

import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.http.HttpClient;
import io.vertx.core.http.HttpClientOptions;
import io.vertx.core.http.HttpClientRequest;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.controller.ControllerHelper;

import java.net.URI;
import java.net.URISyntaxException;

public class HttpClientHelper extends ControllerHelper {
    private static final Logger log = LoggerFactory.getLogger(HttpClientHelper.class);
    private HttpClient httpClient;
    private final Vertx vertx;

    public HttpClientHelper(Vertx vertx) {
        super();
        this.vertx = vertx;
    }

    public void setHost(Vertx vertx) {
        HttpClientOptions options = new HttpClientOptions()
                .setSsl(true)
                .setKeepAlive(true)
                .setVerifyHost(false)
                .setTrustAll(true);

        this.httpClient = vertx.createHttpClient(options);
    }

    public void get(String url, Handler<AsyncResult<Buffer>> handler) {
        this.setHost(this.vertx);
        URI uri;
        try {
            uri = new URI(url);
        } catch (URISyntaxException e) {
            e.printStackTrace();
            return;
        }
        Future<Buffer> future = Future.future();
        future.setHandler(handler);

        HttpClientRequest request = httpClient.getAbs(uri.toString(), response -> {
            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final Buffer buff = Buffer.buffer();
                response.bodyHandler(buff::appendBuffer);
                response.handler(event -> {
                    buff.appendBuffer(event);
                    httpClient.close();
                });
                response.endHandler(end -> handler.handle(Future.succeededFuture(buff)));
            } else {
                String error = "[EDT@HttpClientHelper::get] An error has occurred while fetching URL ";
                log.error(error + response.statusCode() + " " + response.statusMessage());
                response.bodyHandler(event -> {
                });
            }
        });

        request.exceptionHandler(event -> {
            String error = "[EDT@HttpClientHelper::get] An exception has occurred while fetching request process ";
            log.error(error + event.getCause());
        });

        request.setChunked(true);
        request.putHeader("Content-type", "application/json");
        request.end();
    }
}

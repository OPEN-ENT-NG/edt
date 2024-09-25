package fr.cgi.edt.helper;

import fr.wseduc.webutils.Either;
import io.vertx.core.*;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import java.util.List;

public class FutureHelper {

    private static final Logger LOGGER = LoggerFactory.getLogger(fr.cgi.edt.helper.FutureHelper.class);

    private FutureHelper() {
    }



    public static <L, R> Handler<Either<L, R>> handlerEitherPromise(Promise<R> promise, String logs) {
        return event -> {
            if (event.isRight()) {
                promise.complete(event.right().getValue());
            } else {
                LOGGER.error(String.format("%s %s ", logs, event.left().getValue()));
                promise.fail(event.left().getValue().toString());
            }
        };
    }





    public static <T> CompositeFuture all(List<Future<T>> futures) {
        return Future.all(futures);
    }
}

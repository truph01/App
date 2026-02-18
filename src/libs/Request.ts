import type {Span} from '@sentry/core';
import * as Sentry from '@sentry/react-native';
import type {OnyxKey} from 'react-native-onyx';
import CONST from '@src/CONST';
import type Request from '@src/types/onyx/Request';
import type Response from '@src/types/onyx/Response';
import HttpUtils from './HttpUtils';
import type Middleware from './Middleware/types';
import enhanceParameters from './Network/enhanceParameters';
import {hasReadRequiredDataFromStorage} from './Network/NetworkStore';
import {getProcessSpan} from './Network/SequentialQueue';

type NamedMiddleware = {
    middleware: Middleware;
    name: string;
};

let middlewares: NamedMiddleware[] = [];

let currentProcessMiddlewaresSpan: Span | undefined;

function getProcessMiddlewaresSpan(): Span | undefined {
    return currentProcessMiddlewaresSpan;
}

function makeXHR<TKey extends OnyxKey>(request: Request<TKey>, parentSpan: Span | undefined): Promise<Response<TKey> | void> {
    const span = Sentry.startInactiveSpan({
        name: CONST.TELEMETRY.SPAN_HTTP_XHR,
        op: CONST.TELEMETRY.SPAN_HTTP_XHR,
        parentSpan,
        attributes: {
            [CONST.TELEMETRY.ATTRIBUTE_COMMAND]: request.command,
        },
    });

    const finalParameters = enhanceParameters(request.command, request?.data ?? {});
    return hasReadRequiredDataFromStorage()
        .then((): Promise<Response<TKey> | void> => {
            return HttpUtils.xhr(request.command, finalParameters, request.type, request.shouldUseSecure, request.initiatedOffline);
        })
        .then((response) => {
            span.setStatus({code: 1});
            span.end();
            return response;
        })
        .catch((error: unknown) => {
            span.setStatus({code: 2, message: error instanceof Error ? error.message : undefined});
            span.end();
            throw error;
        });
}

function processWithMiddleware<TKey extends OnyxKey>(request: Request<TKey>, isFromSequentialQueue = false): Promise<Response<TKey> | void> {
    const processSpan = getProcessSpan();
    const outerSpan = Sentry.startInactiveSpan({
        name: CONST.TELEMETRY.SPAN_PROCESS_WITH_MIDDLEWARE,
        op: CONST.TELEMETRY.SPAN_PROCESS_WITH_MIDDLEWARE,
        parentSpan: processSpan,
        attributes: {
            [CONST.TELEMETRY.ATTRIBUTE_COMMAND]: request.command,
            [CONST.TELEMETRY.ATTRIBUTE_IS_FROM_SEQUENTIAL_QUEUE]: isFromSequentialQueue,
        },
    });

    currentProcessMiddlewaresSpan = Sentry.startInactiveSpan({
        name: CONST.TELEMETRY.SPAN_PROCESS_MIDDLEWARES,
        op: CONST.TELEMETRY.SPAN_PROCESS_MIDDLEWARES,
        parentSpan: outerSpan,
        attributes: {
            [CONST.TELEMETRY.ATTRIBUTE_COMMAND]: request.command,
        },
    });

    const xhrPromise = makeXHR(request, outerSpan);
    return middlewares
        .reduce<Promise<Response<TKey> | void>>((last, {middleware}) => middleware(last, request, isFromSequentialQueue), xhrPromise)
        .then((response) => {
            currentProcessMiddlewaresSpan?.setStatus({code: 1});
            currentProcessMiddlewaresSpan?.end();
            currentProcessMiddlewaresSpan = undefined;
            outerSpan.setStatus({code: 1});
            outerSpan.end();
            return response;
        })
        .catch((error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : undefined;
            currentProcessMiddlewaresSpan?.setStatus({code: 2, message: errorMessage});
            currentProcessMiddlewaresSpan?.end();
            currentProcessMiddlewaresSpan = undefined;
            outerSpan.setStatus({code: 2, message: errorMessage});
            outerSpan.end();
            throw error;
        });
}

function addMiddleware(middleware: Middleware, name: string) {
    middlewares.push({middleware, name});
}

function clearMiddlewares() {
    middlewares = [];
}

export {clearMiddlewares, processWithMiddleware, addMiddleware, getProcessMiddlewaresSpan};
export type {Middleware};

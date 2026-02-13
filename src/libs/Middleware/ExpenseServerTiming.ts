import {WRITE_COMMANDS} from '@libs/API/types';
import {cancelSpan, endSpan, getSpan, startSpan} from '@libs/telemetry/activeSpans';
import CONST from '@src/CONST';
import type Middleware from './types';

/**
 * Set of write commands related to expense creation.
 * Only these commands will be instrumented with server round-trip timing.
 */
const EXPENSE_COMMANDS = new Set<string>([
    WRITE_COMMANDS.REQUEST_MONEY,
    WRITE_COMMANDS.CREATE_PER_DIEM_REQUEST,
    WRITE_COMMANDS.SPLIT_BILL,
    WRITE_COMMANDS.SPLIT_BILL_AND_OPEN_REPORT,
    WRITE_COMMANDS.START_SPLIT_BILL,
    WRITE_COMMANDS.CREATE_DISTANCE_REQUEST,
    WRITE_COMMANDS.TRACK_EXPENSE,
    WRITE_COMMANDS.SEND_INVOICE,
]);

/**
 * Middleware that tracks server round-trip time for expense creation commands via Sentry spans.
 * For non-expense commands, this is a no-op pass-through.
 */
const ExpenseServerTiming: Middleware = (response, request) => {
    if (!EXPENSE_COMMANDS.has(request.command)) {
        return response;
    }

    const spanId = `${CONST.TELEMETRY.SPAN_EXPENSE_SERVER_RESPONSE}_${request.requestID}`;
    startSpan(spanId, {
        name: 'expense-server-response',
        op: CONST.TELEMETRY.SPAN_EXPENSE_SERVER_RESPONSE,
        attributes: {
            [CONST.TELEMETRY.ATTRIBUTE_COMMAND]: request.command,
        },
    });

    return response
        .then((data) => {
            const span = getSpan(spanId);
            span?.setAttributes({
                [CONST.TELEMETRY.ATTRIBUTE_JSON_CODE]: data?.jsonCode,
            });
            endSpan(spanId);
            return data;
        })
        .catch((error) => {
            cancelSpan(spanId);
            throw error;
        });
};

export default ExpenseServerTiming;

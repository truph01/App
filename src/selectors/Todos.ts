import type {OnyxEntry} from 'react-native-onyx';
import CONST from '@src/CONST';
import type {TodosDerivedValue} from '@src/types/onyx';

const todosReportCountsSelector = (todos: OnyxEntry<TodosDerivedValue>) => {
    if (!todos) {
        return CONST.EMPTY_TODOS_REPORT_COUNTS;
    }

    return {
        [CONST.SEARCH.SEARCH_KEYS.SUBMIT]: todos.reportsToSubmit.length,
        [CONST.SEARCH.SEARCH_KEYS.APPROVE]: todos.reportsToApprove.length,
        [CONST.SEARCH.SEARCH_KEYS.PAY]: todos.reportsToPay.length,
        [CONST.SEARCH.SEARCH_KEYS.EXPORT]: todos.reportsToExport.length,
    };
};

const todosSingleReportIDsSelector = (todos: OnyxEntry<TodosDerivedValue>) => {
    if (!todos) {
        return CONST.EMPTY_TODOS_SINGLE_REPORT_IDS;
    }

    const submitReportID = todos.reportsToSubmit.length === 1 ? todos.reportsToSubmit.at(0)?.reportID : undefined;
    const approveReportID = todos.reportsToApprove.length === 1 ? todos.reportsToApprove.at(0)?.reportID : undefined;
    const payReportID = todos.reportsToPay.length === 1 ? todos.reportsToPay.at(0)?.reportID : undefined;
    const exportReportID = todos.reportsToExport.length === 1 ? todos.reportsToExport.at(0)?.reportID : undefined;

    if (!submitReportID && !approveReportID && !payReportID && !exportReportID) {
        return CONST.EMPTY_TODOS_SINGLE_REPORT_IDS;
    }

    return {
        [CONST.SEARCH.SEARCH_KEYS.SUBMIT]: submitReportID,
        [CONST.SEARCH.SEARCH_KEYS.APPROVE]: approveReportID,
        [CONST.SEARCH.SEARCH_KEYS.PAY]: payReportID,
        [CONST.SEARCH.SEARCH_KEYS.EXPORT]: exportReportID,
    };
};

export default todosReportCountsSelector;
export {todosSingleReportIDsSelector};

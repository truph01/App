import ONYXKEYS from '@src/ONYXKEYS';
import useOnyx from './useOnyx';

function useReportAttributes() {
    const [reportAttributes] = useOnyx(ONYXKEYS.DERIVED.REPORT_ATTRIBUTES, {
        canBeMissing: true,
    });
    return reportAttributes?.reports;
}

export default useReportAttributes;

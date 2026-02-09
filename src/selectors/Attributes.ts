import type {OnyxEntry} from 'react-native-onyx';
import type {ReportAttributesDerivedValue} from '@src/types/onyx';

const reportsSelector = (attributes: OnyxEntry<ReportAttributesDerivedValue>) => attributes?.reports;

const reportAttributesByReportIDSelector = (reportID: string) => (attributes: OnyxEntry<ReportAttributesDerivedValue>) => attributes?.reports?.[reportID];

export {reportAttributesByReportIDSelector};
export default reportsSelector;

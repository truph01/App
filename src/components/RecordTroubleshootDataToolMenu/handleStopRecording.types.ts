import type JSZip from 'jszip';
import type {RefObject} from 'react';
import type {ProfilingData} from '@libs/actions/Troubleshoot';

type StopRecordingParams = {
    profilingData: ProfilingData;
    infoFileName: string;
    profileFileName: string;
    appInfo: string;
    logsWithParsedMessages: Array<Record<string, unknown>>;
    onDisableLogging: (logs: Array<Record<string, unknown>>) => Promise<void>;
    cleanupAfterDisable: () => void;
    zipRef: RefObject<InstanceType<typeof JSZip>>;
    pathToBeUsed: string;
    onDownloadZip?: () => void;
    setProfileTracePath?: (path: string) => void;
};

export default StopRecordingParams;

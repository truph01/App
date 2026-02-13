import type StopRecordingParams from './handleStopRecording.types';

type FinalizeStopRecordingParams = Pick<StopRecordingParams, 'infoFileName' | 'appInfo' | 'onCompleteRecording' | 'cleanupAfterDisable' | 'zipRef' | 'onDownloadZip'>;

export default async function finalizeStopRecording({infoFileName, appInfo, onCompleteRecording, cleanupAfterDisable, zipRef, onDownloadZip}: FinalizeStopRecordingParams): Promise<void> {
    zipRef.current?.file(infoFileName, appInfo);

    await onCompleteRecording();
    cleanupAfterDisable();
    onDownloadZip?.();
}

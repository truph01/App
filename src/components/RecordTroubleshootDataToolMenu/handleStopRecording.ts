import finalizeStopRecording from './finalizeStopRecording';
import type StopRecordingParams from './handleStopRecording.types';

type HandleStopRecording = (params: StopRecordingParams) => Promise<void>;

const handleStopRecording: HandleStopRecording = ({infoFileName, appInfo, onCompleteRecording, cleanupAfterDisable, zipRef, onDownloadZip}) =>
    finalizeStopRecording({
        infoFileName,
        appInfo,
        onCompleteRecording,
        cleanupAfterDisable,
        zipRef,
        onDownloadZip,
    });

export default handleStopRecording;

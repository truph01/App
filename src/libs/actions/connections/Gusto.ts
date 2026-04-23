import type {OnyxUpdate} from 'react-native-onyx';
import Onyx from 'react-native-onyx';
import * as API from '@libs/API';
import type {ConnectPolicyToGustoParams} from '@libs/API/parameters';
import {READ_COMMANDS} from '@libs/API/types';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';

function getGustoSyncProgressOnyxData(policyID: string) {
    const optimisticData: Array<OnyxUpdate<typeof ONYXKEYS.COLLECTION.POLICY_CONNECTION_SYNC_PROGRESS>> = [
        {
            onyxMethod: Onyx.METHOD.MERGE,
            key: `${ONYXKEYS.COLLECTION.POLICY_CONNECTION_SYNC_PROGRESS}${policyID}`,
            value: {
                stageInProgress: CONST.POLICY.CONNECTIONS.SYNC_STAGE_NAME.STARTING_IMPORT_GUSTO,
                connectionName: CONST.POLICY.CONNECTIONS.NAME.GUSTO,
                timestamp: new Date().toISOString(),
            },
        },
    ];

    const failureData: Array<OnyxUpdate<typeof ONYXKEYS.COLLECTION.POLICY_CONNECTION_SYNC_PROGRESS>> = [
        {
            onyxMethod: Onyx.METHOD.SET,
            key: `${ONYXKEYS.COLLECTION.POLICY_CONNECTION_SYNC_PROGRESS}${policyID}`,
            value: null,
        },
    ];

    return {optimisticData, failureData};
}
function connectPolicyToGusto(policyID: string) {
    const parameters: ConnectPolicyToGustoParams = {policyID};
    API.read(READ_COMMANDS.CONNECT_POLICY_TO_GUSTO, parameters, getGustoSyncProgressOnyxData(policyID));
}

export default connectPolicyToGusto;

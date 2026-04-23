import type {ConnectPolicyToGustoParams} from '@libs/API/parameters';
import {READ_COMMANDS} from '@libs/API/types';
import {getCommandURL} from '@libs/ApiUtils';
import {openLink} from '@userActions/Link';

function getGustoSetupLink(policyID: string) {
    const params: ConnectPolicyToGustoParams = {policyID};
    const commandURL = getCommandURL({
        command: READ_COMMANDS.CONNECT_POLICY_TO_GUSTO,
        shouldSkipWebProxy: true,
    });
    return commandURL + new URLSearchParams(params).toString();
}

function connectPolicyToGusto(policyID: string, environmentURL: string) {
    openLink(getGustoSetupLink(policyID), environmentURL);
}

export {getGustoSetupLink};
export default connectPolicyToGusto;

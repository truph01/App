import {useEffect} from 'react';
import useEnvironment from '@hooks/useEnvironment';
import getGustoSetupLink from '@libs/actions/connections/Gusto';
import {openLink} from '@userActions/Link';
import type ConnectToGustoFlowProps from './types';

function ConnectToGustoFlow({policyID}: ConnectToGustoFlowProps) {
    const {environmentURL} = useEnvironment();

    useEffect(() => {
        openLink(getGustoSetupLink(policyID), environmentURL);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- This flow should only open the external Gusto setup link once when it mounts.
    }, []);

    return null;
}

export default ConnectToGustoFlow;

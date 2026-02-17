import '@testing-library/react-native';
import Onyx from 'react-native-onyx';
import OnyxUtils from 'react-native-onyx/dist/OnyxUtils';
import ONYXKEYS from '@src/ONYXKEYS';

jest.useRealTimers();

beforeAll(() => {
    if (OnyxUtils.getDeferredInitTask().isResolved) {
        return;
    }
    Onyx.init({keys: ONYXKEYS});
});

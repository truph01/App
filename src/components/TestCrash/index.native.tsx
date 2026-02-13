import React from 'react';
import {View} from 'react-native';
import Button from '@components/Button';
import TestToolRow from '@components/TestToolRow';
import useLocalize from '@hooks/useLocalize';
import testCrash from '@libs/testCrash';

/**
 * Adds a button in native dev builds to test the Sentry crash reporting integration.
 */
function TestCrash() {
    const {translate} = useLocalize();

    const toolRowTitle = translate('initialSettingsPage.troubleshoot.testCrash');

    return (
        <View>
            {!__DEV__ ? (
                <TestToolRow title={toolRowTitle}>
                    <Button
                        small
                        text={toolRowTitle}
                        onPress={testCrash}
                    />
                </TestToolRow>
            ) : null}
        </View>
    );
}

export default TestCrash;

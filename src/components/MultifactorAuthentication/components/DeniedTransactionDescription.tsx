import React from 'react';
import Text from '@components/Text';
import TextLink from '@components/TextLink';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import {navigateToConciergeChat} from '@userActions/Report';
import ONYXKEYS from '@src/ONYXKEYS';

const baseTranslationPath = 'multifactorAuthentication.reviewTransaction.transactionCouldNotBeCompletedReachOut' as const;

const translationPaths = {
    start: `${baseTranslationPath}.start`,
    link: `${baseTranslationPath}.link`,
    end: `${baseTranslationPath}.end`,
} as const;

function DeniedTransactionDescription() {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const [conciergeReportID] = useOnyx(ONYXKEYS.CONCIERGE_REPORT_ID, {canBeMissing: true});

    return (
        <Text style={[styles.textAlignCenter, styles.textSupporting]}>
            {translate(translationPaths.start)}
            <TextLink onPress={() => navigateToConciergeChat(conciergeReportID, false)}>{translate(translationPaths.link)}</TextLink>
            {translate(translationPaths.end)}
        </Text>
    );
}

DeniedTransactionDescription.displayName = 'DeniedTransactionDescription';

export default DeniedTransactionDescription;

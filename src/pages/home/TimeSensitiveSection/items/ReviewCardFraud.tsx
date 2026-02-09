import React, {useMemo} from 'react';
import ExpensifyCardIcon from '@assets/images/expensify-card-icon.svg';
import BaseWidgetItem from '@components/BaseWidgetItem';
import useLocalize from '@hooks/useLocalize';
import {convertToDisplayString} from '@libs/CurrencyUtils';
import Navigation from '@libs/Navigation/Navigation';
import colors from '@styles/theme/colors';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';
import type {PossibleFraudData} from '@src/types/onyx/Card';

const DEFAULT_CURRENCY = CONST.CURRENCY.USD;

type ReviewCardFraudProps = {
    /** Possible fraud data from the card */
    possibleFraud: PossibleFraudData;
};

function ReviewCardFraud({possibleFraud}: ReviewCardFraudProps) {
    const {translate} = useLocalize();

    const fraudAlertReportID = possibleFraud.fraudAlertReportID;
    const triggerAmount = possibleFraud.triggerAmount;
    const triggerMerchant = possibleFraud.triggerMerchant;
    const triggerCurrency = possibleFraud.triggerCurrency;

    // Generate the title with amount and merchant if available
    const title = useMemo(() => {
        if (triggerAmount !== undefined && triggerMerchant) {
            const formattedAmount = convertToDisplayString(triggerAmount, triggerCurrency ?? DEFAULT_CURRENCY);
            return translate('homePage.timeSensitiveSection.reviewCardFraud.titleWithDetails', {
                amount: formattedAmount,
                merchant: triggerMerchant,
            });
        }
        return translate('homePage.timeSensitiveSection.reviewCardFraud.title');
    }, [triggerAmount, triggerMerchant, triggerCurrency, translate]);

    // Don't render the widget if there's no fraud alert report to navigate to
    if (!fraudAlertReportID) {
        return null;
    }

    const handleReviewPress = () => {
        // Navigate to the report containing the fraud alert action
        Navigation.navigate(ROUTES.REPORT_WITH_ID.getRoute(String(fraudAlertReportID)));
    };

    return (
        <BaseWidgetItem
            icon={ExpensifyCardIcon}
            iconBackgroundColor={colors.tangerine100}
            iconFill={colors.tangerine700}
            title={title}
            subtitle={translate('homePage.timeSensitiveSection.reviewCardFraud.subtitle')}
            ctaText={translate('homePage.timeSensitiveSection.reviewCardFraud.cta')}
            onCtaPress={handleReviewPress}
            buttonProps={{danger: true}}
        />
    );
}

export default ReviewCardFraud;

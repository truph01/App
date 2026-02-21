import type {GetSubscriptionPlanBenefitA11yPropsParams, SubscriptionPlanBenefitA11yProps} from './types';

function getSubscriptionPlanBenefitA11yProps({benefitText, index, totalBenefits, ofLabel}: GetSubscriptionPlanBenefitA11yPropsParams): SubscriptionPlanBenefitA11yProps {
    return {
        accessible: true,
        accessibilityLabel: `${benefitText}, ${index + 1} ${ofLabel} ${totalBenefits}`,
    };
}

export default getSubscriptionPlanBenefitA11yProps;

type GetSubscriptionPlanBenefitA11yPropsParams = {
    benefitText: string;
    index: number;
    totalBenefits: number;
    ofLabel: string;
};

type SubscriptionPlanBenefitA11yProps = {
    accessible?: boolean;
    accessibilityLabel?: string;
};

export type {GetSubscriptionPlanBenefitA11yPropsParams, SubscriptionPlanBenefitA11yProps};

import type * as OnyxCommon from './OnyxCommon';

/**
 * General pending action structure for domain admins.
 * Pending actions structure is dictated by how `domain_` updates are handled in the app to prevent them from resetting unintentionally.
 */
type GeneralDomainPendingAction = {
    /**
     * Base pending actions
     */
    pendingAction: OnyxCommon.PendingAction;

    /**
     *
     */
    twoFactorAuthExemptEmails: OnyxCommon.PendingAction;
};

/**
 * Pending actions triggered by user operations on the domain
 */
type DomainPendingAction = {
    /**
     * Pending actions for specific administrators, keyed by their accountID
     */
    admin?: Record<number, GeneralDomainPendingAction>;

    /**
     *
     */
    member?: Record<number, GeneralDomainPendingAction>;

    /**
     * Pending action for the technical contact email
     */
    technicalContactEmail?: OnyxCommon.PendingAction;

    /**
     * Pending action for the "use technical contact billing card" setting
     */
    useTechnicalContactBillingCard?: OnyxCommon.PendingAction;

    /**
     * Pending action for the 2FA toggle
     */
    twoFactorAuthRequired?: OnyxCommon.PendingAction;

    /**
     * Pending action for the domain itself
     */
    pendingAction?: OnyxCommon.PendingAction;
};

export default DomainPendingAction;

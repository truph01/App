/** How the user attempted to respond to the 3DS challenge */
type Transaction3DSChallengeOutcome = 'Authorize' | 'Deny';

/**
 * Record of 3DS challenges we have already responded to, indexed by transaction IDs.
 */
type Blocklisted3DSTransactionChallenges = Record<string, Transaction3DSChallengeOutcome>;

export default Blocklisted3DSTransactionChallenges;

import type {Log} from './types';

/** Firebase Crashlytics has been removed; logging is now handled by Sentry */
const log: Log = () => {};

export default {
    log,
};

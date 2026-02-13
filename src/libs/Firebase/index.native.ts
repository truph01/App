import * as Sentry from '@sentry/react-native';
import type {Log} from './types';

const log: Log = (action: string) => {
    Sentry.addBreadcrumb({message: action, category: 'firebase'});
};

export default {
    log,
};

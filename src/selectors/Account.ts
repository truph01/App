import type {OnyxEntry} from 'react-native-onyx';
import AccountUtils from '@libs/AccountUtils';
import type {Account} from '@src/types/onyx';

const isActingAsDelegateSelector = (account: OnyxEntry<Account>) => !!account?.delegatedAccess?.delegate;

const isDelegateAccessRestrictedSelector = (account: OnyxEntry<Account>) => !!account?.delegatedAccess?.delegate && AccountUtils.isDelegateOnlySubmitter(account);

const isUserValidatedSelector = (account: OnyxEntry<Account>) => account?.validated;

const primaryLoginSelector = (account: OnyxEntry<Account>) => account?.primaryLogin;

const delegatesSelector = (account: OnyxEntry<Account>) => account?.delegatedAccess?.delegates;

const hasBiometricsRegisteredSelector = (data: OnyxEntry<Account>) => data?.multifactorAuthenticationPublicKeyIDs && data.multifactorAuthenticationPublicKeyIDs.length > 0;

export {isActingAsDelegateSelector, isDelegateAccessRestrictedSelector, isUserValidatedSelector, primaryLoginSelector, delegatesSelector, hasBiometricsRegisteredSelector};

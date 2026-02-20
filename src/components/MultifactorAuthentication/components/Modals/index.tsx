import createCancelConfirmModal from './createCancelConfirmModal';

const DefaultCancelConfirmModal = createCancelConfirmModal('DefaultCancelConfirmModal', {
    title: 'common.areYouSure',
    description: 'multifactorAuthentication.biometricsTest.areYouSureToReject',
    confirmButtonText: 'multifactorAuthentication.biometricsTest.rejectAuthentication',
    cancelButtonText: 'common.cancel',
});

const AuthorizeTransactionCancelConfirmModal = createCancelConfirmModal('AuthorizeTransactionCancelConfirmModal', {
    title: 'common.areYouSure',
    description: 'multifactorAuthentication.reviewTransaction.areYouSureToDeny',
    confirmButtonText: 'multifactorAuthentication.reviewTransaction.denyTransaction',
    cancelButtonText: 'common.cancel',
});

export {DefaultCancelConfirmModal, AuthorizeTransactionCancelConfirmModal};

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

export const DOM = {
    Common: {
        backButtons: $$('.back-button'),
        loadingOverlay: $('#loadingOverlay'),
    },
    start: {
        createWalletBtn: $('#createWalletBtn'),
        importWalletBtn: $('#importWalletBtn'),
    },
    password: {
        newPasswordInput: $('#newPassword'),
        confirmPasswordInput: $('#confirmPassword'),
    },
    unlock: {
        unlockPasswordInput: $('#unlockPasswordInput'), // Input mật khẩu mở khóa
    },
    importMnemonic: {
        resetMnemonicBtn: $('#resetMnemonicBtn'),
        completeImportBtn: $('#completeImportBtn'),
    },
    createMnemonic: {
        copySeedBtn: $('#copySeedBtn'),
        seedPhraseSavedBtn: $('#seedPhraseSavedBtn'),
    },
    MnemonicGridDisplay: {
        CreateSeedPhraseDisplay: $('#CreateSeedPhraseDisplay'),
        ImportSeedPhraseDisplay: $('#ImportSeedPhraseDisplay'),
    },
    home: {
        HOMEPAGE: $('#HOMEPAGE'),
        NetworkName: $('#NetworkName'),
        WalletAddressDisplay: $('#WalletAddressDisplay'),
        CopyAddressBtn: $$('.copyAddress-button'),
        WalletBalanceAmount: $('#WalletBalanceAmount'),
        SendTxBtn: $('#SendTxBtn'),
        ReceiveTxBtn: $('#ReceiveTxBtn'),
        LockWalletManually: $('#LockWalletManually'),
        // ...
    },
};

export async function sendMessage(action, payload = {}) {
    return chrome.runtime.sendMessage({ action, payload });
}
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
        HOMEPAGE: document.getElementById('HOMEPAGE'),
        NetworkName: document.getElementById('NetworkName'),
        WalletAddressDisplay: document.getElementById('WalletAddressDisplay'),
        CopyAddressBtn: document.getElementById('CopyAddressBtn'),
        WalletBalanceAmount: document.getElementById('WalletBalanceAmount'),
        SendTxBtn: document.getElementById('SendTxBtn'),
        ReceiveTxBtn: document.getElementById('ReceiveTxBtn'),
        LockWalletManually: document.getElementById('LockWalletManually'),
        // ...
    },
};

export async function sendMessage(action, payload = {}) {
    return chrome.runtime.sendMessage({ action, payload });
}
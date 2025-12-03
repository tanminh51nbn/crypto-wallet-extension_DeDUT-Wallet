import { DOM, sendMessage } from '../utils/dom-selectors.js';
import { Show } from '../utils/ui-router.js';
import { PasswordManager } from '../components/password-manager.js';
import { MnemonicController } from '../components/mnemonic-controller.js';
import { HomePageController } from '../components/home-controller.js';

class AppController {
    constructor() {
        this.show = new Show();
        this.currentAction = null; 
        this.unlockedWallet = null;

        this.mnemonicController = new MnemonicController(
            DOM,
            this.show
        );
        this.passwordManager = new PasswordManager(
            DOM.password,
            DOM.unlock,
            this.show,
            this.handlePasswordSuccess.bind(this),
            this.handleUnlock.bind(this)
        );
        this.homepageController = new HomePageController(
            DOM,
            this.show
        );
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === 'walletLocked') {
                this.handleWalletLocked();
            }
        });
    }
    handleWalletLocked() {
        this.show.Screen('unlockPasswordScreen');
    }

    handlePasswordSuccess(password) {
        if (!password) { 
             return;
        }
        if (this.currentAction === 'create') {
            this.mnemonicController.handleCreateWalletSetup(password);
            this.show.Screen('showSeedCreatedScreen');
        } else if (this.currentAction === 'import') {
            this.mnemonicController.handleImportWalletSetup(password); 
            this.show.Screen('importMnemonicScreen'); 
        }
    }
    async handleUnlock(password) {
        this.show.LoadingOverlay(true);
        const response = await sendMessage('unlockWallet', { password });
        this.show.LoadingOverlay(false);
        if (response.status === 'success') {
            this.unlockedWallet = { address: response.address }; 
            this.homepageController.setWallet(this.unlockedWallet);
            this.show.Screen('HOMEPAGE'); 
        } else {
            this.show.Notify('incorrectPasswordNotification', 1500);
        }
    }

    setupMainListeners() {
        DOM.start.createWalletBtn?.addEventListener('click', () => {
            this.currentAction = 'create';
            this.show.Screen('createPasswordScreen');
        });
        DOM.start.importWalletBtn?.addEventListener('click', () => {
            this.currentAction = 'import';
            this.show.Screen('createPasswordScreen');
        });
        
        DOM.Common.backButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.getAttribute('data-target') === 'welcomeScreen') {
                     this.currentAction = null; 
                }
                this.show.Screen(button.getAttribute('data-target') || 'welcomeScreen');
            });
        });
    }

    async init() {
        const unlockStatusResponse = await sendMessage('getUnlockStatus');
        if (unlockStatusResponse.status === 'success' && unlockStatusResponse.isLocked === false) {
            const walletInfoResponse = await sendMessage('getWalletInfo'); 
            if (walletInfoResponse.status === 'success') {
                this.unlockedWallet = { address: walletInfoResponse.address };
                this.homepageController.setWallet(this.unlockedWallet);
                this.show.Screen('HOMEPAGE');
            } else {
                 this.show.Screen('unlockPasswordScreen');
            }
        } else {
            const statusResponse = await sendMessage('checkWalletStatus');
            if (statusResponse.status === 'success' && statusResponse.exists) {
                this.show.Screen('unlockPasswordScreen');
            } else {
                this.show.Screen('welcomeScreen');
            }
        }
        this.setupMainListeners();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();
});
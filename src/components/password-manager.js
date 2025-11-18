export class PasswordManager {
    constructor(domElements, domUnlock, showInstance, handlePasswordSuccess, handleUnlockSuccess) {
        this.dom = domElements;
        this.show = showInstance;
        this.handlePasswordSuccess = handlePasswordSuccess;

        this.newPassInput = domElements.newPasswordInput;
        this.confirmPassInput = domElements.confirmPasswordInput;

        this.unlockPassInput = domUnlock.unlockPasswordInput;
        this.handleUnlockSuccess = handleUnlockSuccess;

        this.setupCreationListeners();
        this.setupUnlockListeners();
    }

    setupCreationListeners() {
        if (this.newPassInput && this.confirmPassInput) {
            this.newPassInput.addEventListener('keypress', (event) => {
                this.handleEnterSubmit(event, () => this.confirmPassInput.focus());
            });
            this.confirmPassInput.addEventListener('keypress', (event) => {
                this.handleEnterSubmit(event, () => this.checkPassword());
            });
        }
    }
    setupUnlockListeners() {
        if (this.unlockPassInput) {
            this.unlockPassInput.addEventListener('keypress', (event) => {
                // Khi nhấn Enter, gọi handleUnlock
                this.handleEnterSubmit(event, () => this.handleUnlock());
            });
        }
    }
    handleUnlock() {
        const password = this.unlockPassInput.value;
        
        if (!password) {
            this.show.Notify('passwordRequiredNotification', 1500); 
            return;
        }
        
        this.handleUnlockSuccess(password);
        
        this.unlockPassInput.value = ''; 
    }
    
    checkPassword() {
        const newPass = this.newPassInput.value;
        const confirmPass = this.confirmPassInput.value;

        if (newPass === confirmPass && newPass.length >= 8) {            
            this.clearInputs();
            this.handlePasswordSuccess(confirmPass);
        } else {
            this.clearInputs();
            this.newPassInput.focus();
            this.show.Notify('ErrorCreatingPasswordNotification', 1500);
        }
    }
    handleEnterSubmit(event, callback) {
        if (event.key === 'Enter') {
            event.preventDefault();
            callback();
        }
    }
    clearInputs() {
        this.newPassInput.value = '';
        this.confirmPassInput.value = '';
    }
}
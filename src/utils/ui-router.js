export class Show {
    constructor() {
        this.majorScreens = document.querySelectorAll('.screen');
        this.toastTimeoutHandle = null;
        this.loadingOverlay = document.getElementById('loadingOverlay');

        this.toastElement = document.getElementById('NotificationToast');
        this.toastMessage = document.getElementById('toastMessage');
        this.type = null;

        this.dialogElement = document.getElementById('NotificationDialog');
        this.dialogTitle = document.getElementById('dialog-title');
        this.dialogMessage = document.getElementById('DialogMessage');
        this.dialogCloseBtn = document.getElementById('dialogCloseBtn');
    }
    _Switch(IDscreen) {
        if (this.toastTimeoutHandle) {
             clearTimeout(this.toastTimeoutHandle);
             this.toastTimeoutHandle = null;
        }
        
        if (this.toastElement) {
            this.toastElement.classList.remove('active');
            this.toastElement.classList.add('hidden');
            this.toastElement.classList.remove(this.type);
        }
        this.majorScreens.forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        const targetScreen = document.getElementById(IDscreen);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            targetScreen.classList.add('active');
        }
    }
    Screen(IDscreen) {
        this._Switch(IDscreen);
    }

    LoadingOverlay(isVisible) {
        if (!this.loadingOverlay) return;

        if (isVisible) {
            this.loadingOverlay.classList.remove('hidden');
            this.loadingOverlay.classList.add('active');
        } else {
            this.loadingOverlay.classList.remove('active');
            this.loadingOverlay.classList.add('hidden');
        }
    }
    MakeAlert (type, message, durationMs) {
        this.type = type;
        if (this.toastTimeoutHandle) {
            clearTimeout(this.toastTimeoutHandle);
            this.toastTimeoutHandle = null;
        }
        this.toastMessage.innerHTML = message;
        this.toastElement.classList.add(type);

        this.toastElement.classList.remove('hidden');
        this.toastElement.classList.add('active');

        this.toastTimeoutHandle = setTimeout(() => {
            this.toastElement.classList.remove('active');
            this.toastElement.classList.add('hidden');
            this.toastTimeoutHandle = null; 
            this.toastElement.classList.remove(type);
        }, durationMs);
    }
}
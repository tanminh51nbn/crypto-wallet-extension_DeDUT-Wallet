export class Show {
    constructor() {
        this.majorScreens = document.querySelectorAll('.screen');
        this.toastTimeoutHandle = null;
        this.allNotifications = document.querySelectorAll('.notification-toast');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }
    _Switch(IDscreen) {
        if (this.toastTimeoutHandle) {
             clearTimeout(this.toastTimeoutHandle);
             this.toastTimeoutHandle = null;
        }
        if (this.allNotifications) {
            this.allNotifications.forEach(notification => {
                notification.classList.remove('active');
                notification.classList.add('hidden');
            });
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
            // *LƯU Ý: Đảm bảo CSS của #loadingOverlay có z-index cao và pointer-events: auto để ngăn chặn click*
        } else {
            this.loadingOverlay.classList.remove('active');
            this.loadingOverlay.classList.add('hidden');
        }
    }
    Notify(IDscreen, durationMs = 1500) {
        const targetNotification = document.getElementById(IDscreen);
        if (this.toastTimeoutHandle) {
            clearTimeout(this.toastTimeoutHandle);
        }
        targetNotification.classList.remove('hidden');
        targetNotification.classList.add('active');
        this.toastTimeoutHandle = setTimeout(() => {
            targetNotification.classList.remove('active');
            setTimeout(() => {
                targetNotification.classList.add('hidden');
                this.toastTimeoutHandle = null; 
            }, 500); 
        }, durationMs);
    }
}
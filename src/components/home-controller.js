
import { sendMessage } from '../utils/dom-selectors.js';
import QRious from 'qrious';
// Giả sử bạn có một utils để format số dư
// import { formatBalance } from '../utils/formatter.js'; 

export class HomePageController {
    constructor(domElements, showInstance) {
        this.dom = domElements;
        this.show = showInstance;
        this.currentWallet = null; 
        
        this.setupListeners();
    }

    setWallet(walletInfo) {
        // Nhận thông tin ví đã mở khóa từ AppController
        this.currentWallet = walletInfo;
        this.updateUI(); 
    }

    setupListeners() {
        this.dom.home.LockWalletManually?.addEventListener('click', () => this.lockWallet());
        this.dom.home.CopyAddressBtn.forEach(button => {
            button.addEventListener('click', () => this.copyAddress());
        });
        this.dom.home.SendTxBtn?.addEventListener('click', () => this.show.Screen('SENDPAGE'));
        this.dom.home.ReceiveTxBtn?.addEventListener('click', () => {
            if (this.currentWallet && this.currentWallet.address) {
                this.show.Screen('RECEIVEPAGE');
                const address = this.currentWallet.address;
                
                // Hiển thị địa chỉ ví trong input
                walletAddressInput.value = address;

                // Tạo và hiển thị QR code
                new QRious({
                    element: qrCanvas,
                    value: address,
                    size: 200,
                    level: 'H'
                });
            } else {
                //để màn hình báo lỗi
            }
        });

        this.dom.Common.backButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.getAttribute('data-target') === 'HOMEPAGE') {
                     this.currentAction = null; 
                }
                this.show.Screen(button.getAttribute('data-target') || 'HOMEPAGE');
            });
        });
    }

    async updateUI() {
        if (!this.currentWallet) return;

        // 1. Hiển thị Địa chỉ Ví (được rút gọn)
        const address = this.currentWallet.address;
        const shortenedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
        this.dom.home.WalletAddressDisplay.textContent = shortenedAddress;
        
        // 2. Lấy và hiển thị Số Dư
        this.dom.home.WalletBalanceAmount.textContent = 'Loading...'; 
        
        try {
            const response = await sendMessage('getWalletBalance', { address: address });
            
            if (response.status === 'success') {
                // Giả sử service-worker trả về balance đã được format
                this.dom.home.WalletBalanceAmount.textContent = response.balance; 
            } else {
                this.dom.home.WalletBalanceAmount.textContent = 'Error';
            }
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            this.dom.home.WalletBalanceAmount.textContent = 'Error';
        }
    }
    
    async copyAddress() {
        if (!this.currentWallet) return;
        
        try {
            await navigator.clipboard.writeText(this.currentWallet.address);
            this.show.Notify('copySuccessNotification', 1500);
        } catch (err) {
            console.error('Could not copy text: ', err);
        }
    }

    async lockWallet() {
        this.show.LoadingOverlay(true);
        // Gửi lệnh khóa ví thủ công tới Service Worker
        await sendMessage('lockWalletManually');
        this.currentWallet = null;
        this.show.LoadingOverlay(false);
        this.show.Screen('unlockPasswordScreen'); 
    }
}
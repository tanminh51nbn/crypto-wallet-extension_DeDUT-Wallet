
import { sendMessage } from '../utils/dom-selectors.js';
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
        // Lắng nghe sự kiện click cho các nút trên màn hình Home
        this.dom.LockWalletManually?.addEventListener('click', () => this.lockWallet());
        this.dom.CopyAddressBtn?.addEventListener('click', () => this.copyAddress());
        // Thêm listeners cho Send/Receive ở đây...
    }

    async updateUI() {
        if (!this.currentWallet) return;

        // 1. Hiển thị Địa chỉ Ví (được rút gọn)
        const address = this.currentWallet.address;
        const shortenedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        this.dom.WalletAddressDisplay.textContent = shortenedAddress;
        
        // 2. Lấy và hiển thị Số Dư
        this.dom.WalletBalanceAmount.textContent = 'Loading...'; 
        
        try {
            const response = await sendMessage('getWalletBalance', { address: address });
            
            if (response.status === 'success') {
                // Giả sử service-worker trả về balance đã được format
                this.dom.WalletBalanceAmount.textContent = response.balance; 
            } else {
                this.dom.WalletBalanceAmount.textContent = 'Error';
            }
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            this.dom.WalletBalanceAmount.textContent = 'Error';
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
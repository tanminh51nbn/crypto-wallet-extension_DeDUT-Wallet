
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
        this.dom.send.ConfirmSendBtn?.addEventListener('click', () => this.ConfirmSend());
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
    async ConfirmSend(){
        if (!this.currentWallet) return;
        const recipient = this.dom.send.RecipientInput.value.trim();
        const amountInEther = this.dom.send.AmountInput.value.trim();

        if (!recipient || !amountInEther || isNaN(parseFloat(amountInEther)) || parseFloat(amountInEther) <= 0) {
            this.show.MakeAlert('error', 'Please enter a valid recipient and amount.', 3000);
            return;
        }

        try{
            this.show.LoadingOverlay(true);
            const response = await sendMessage('sendEthTransaction', { recipient, amountInEther });
            if (response.status === 'success') {
                const txHash = response.txHash;
                const EXPLORER_URL_BASE = 'https://sepolia.etherscan.io/tx/'; 
                const txLink = EXPLORER_URL_BASE + txHash;
                this.show.MakeAlert('success', 'Check Hash on Etherscan: <br><a id = "hashLink"' + 'href="'+ txLink + '" target="_blank" rel="noopener noreferrer">Check on Etherscan</a>', 10000);
                
                // Xóa input sau khi gửi thành công
                this.dom.send.RecipientInput.value = '';
                this.dom.send.AmountInput.value = '';
                
                // Quay lại màn hình chính và cập nhật UI
                this.updateUI();

            } else {
                // this.show.MakeAlert(`Giao dịch thất bại: ${response.message}`, 8000);
                console.error("Transaction Error:", response.message);
            }
        }catch{
            console.error("sendMessage failed:", error);
        } finally {
            this.show.LoadingOverlay(false); 
        }
    }

    async updateUI() {
        if (!this.currentWallet) return;

        // 1. Hiển thị Địa chỉ Ví (được rút gọn)
        const address = this.currentWallet.address;
        const shortenedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
        this.dom.home.WalletAddressDisplay.textContent = shortenedAddress;
        
        // 2. Lấy và hiển thị Số Dư
        this.dom.home.WalletBalanceAmount.forEach(el => {
            el.textContent = 'Loading...';
        });
        
        try {
            const response = await sendMessage('getWalletBalance', { address: address });
            
            if (response.status === 'success') {
                this.dom.home.WalletBalanceAmount.forEach(el => {
                    el.textContent = response.balance;
                }); 
            } else {
                this.dom.home.WalletBalanceAmount.forEach(el => {
                    el.textContent = "ERROR...";
                });
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
            this.show.MakeAlert('success', 'Copied!', 3000);
        } catch (err) {
            console.error('Could not copy text: ', err);
        }
    }

    async lockWallet() {
        this.show.LoadingOverlay(true);
        await sendMessage('lockWalletManually');
        this.currentWallet = null;
        this.show.LoadingOverlay(false);
        this.show.Screen('unlockPasswordScreen'); 
    }
}
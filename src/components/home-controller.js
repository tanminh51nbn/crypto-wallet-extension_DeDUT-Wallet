
import { sendMessage } from '../utils/dom-selectors.js';
import QRious from 'qrious';
// Giả sử bạn có một utils để format số dư
// import { formatBalance } from '../utils/formatter.js'; 

export class HomePageController {
    constructor(domElements, showInstance) {
        this.dom = domElements;
        this.show = showInstance;
        this.currentWallet = null; 
        this.txPollingInterval = null;
        this.setupListeners();
    }

    setWallet(walletInfo) {
        // Nhận thông tin ví đã mở khóa từ AppController
        this.currentWallet = walletInfo;
        this.updateUI();
        this.startTxPolling(10000);
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
        this.stopTxPolling();
        this.show.LoadingOverlay(false);
        this.show.Screen('unlockPasswordScreen');
    }

    async loadTransactionHistory() {
        if (!this.currentWallet || !this.currentWallet.address) return;

        const container = this.dom.home.TransactionList;
        if (!container) return;
        console.log("TransactionList DOM:", this.dom.home.TransactionList);

        const response = await sendMessage("getTxHistory", {
            address: this.currentWallet.address
        });

        const list = response?.history || [];
        container.innerHTML = "";

        if (list.length === 0) {
            container.innerHTML = `<p class="no-tx-message">No transactions</p>`;
            return;
        }
        
        console.log("Start list.ForEach()");
        list.forEach(tx => {
            const shortHash = tx.hash.slice(0, 10) + "..." + tx.hash.slice(-10);
            const time = new Date(tx.timeStamp).toLocaleString();
            const scanUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;

            const item = document.createElement("div");
            item.className = "tx-item";

            item.innerHTML = `
                <div class="tx-row">
                    <div class="tx-left">
                        <a class="tx-hash" href="${scanUrl}" target="_blank">${shortHash}</a>
                        <div class="tx-time">${time}</div>
                    </div>

                    <div class="tx-right">
                        <div class="tx-type-line">
                            <span class="tx-type ${tx.type.toLowerCase()}">
                                ${tx.type}
                            </span>
                            <span class="tx-amount">${formatSmallEthSubscript(tx.value)} ETH</span>
                        </div>

                        <span class="tx-status ${tx.status}">${tx.status}</span>
                    </div>
                </div>
            `;

            container.appendChild(item);
        });
        console.log("loadTransactionHistory completed.");
    }
    startTxPolling(intervalMs = 10000) {
        if (this.txPollingInterval) {
            clearInterval(this.txPollingInterval);
        }
        console.log("Start loading transaction history");
        this.loadTransactionHistory();
        console.log("END loading transaction history");
        this.txPollingInterval = setInterval(() => {
            this.loadTransactionHistory();
        }, intervalMs);
    }

    stopTxPolling() {
        if (this.txPollingInterval) {
            clearInterval(this.txPollingInterval);
            this.txPollingInterval = null;
        }
    }
}
function formatSmallEthSubscript(valueEth) {
    if (!valueEth) return valueEth;

    const num = Number(valueEth);

    // 1) Không phải số nhỏ -> hiển thị 4 chữ thập phân + ...
    if (num >= 0.001) {
        const [intPart, decPart = ""] = valueEth.split(".");
        if (decPart.length > 4)
            return `${intPart}.${decPart.slice(0, 4)}...`;

        return valueEth;
    }

    // 2) Số rất nhỏ -> BẮT BUỘC ép về exponential
    const expStr = num.toExponential();         // luôn dạng "x.xxxxxxen"
    const [mantissa, expPart] = expStr.split("e-");

    const zeroCount = parseInt(expPart, 10);
    const cleanedMantissa = mantissa.replace('.', '');

    // 3) Nếu <= 3 số 0: hiển thị bình thường
    if (zeroCount <= 3) {
        return `0.${"0".repeat(zeroCount)}${cleanedMantissa}`;
    }

    // 4) Nếu mantissa > 5 ký tự -> cắt còn 3 ký tự + ...
    const lastDigit =
        mantissa.length > 5
            ? cleanedMantissa.slice(0, 3) + "..."
            : cleanedMantissa;

    // 5) Dạng subscript hoàn chỉnh
    return `0.0<sub>${zeroCount}</sub>${lastDigit}`;
}
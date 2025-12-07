import { checkWalletStatus, createNewWallet, ReadMnemonic, unlockWallet, sendEthTransaction } from './wallet.js';
import { ethers } from 'ethers';

const SEPOLIA_RPC_URL = `https://eth-sepolia.g.alchemy.com/v2/0PT4zYKK66VEZQGe89uX78NLXIqQ-fX7`;
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const { action, payload } = request;
        let isResponseAsync = true; 

        switch (action) {
            case 'getUnlockStatus': {
                const isLocked = unlockedWallet === null;
                sendResponse({ status: 'success', isLocked: isLocked });
                
                if (!isLocked) {
                    resetLockTimer(); 
                }
                isResponseAsync = false; 
                break;
            }

            case 'checkWalletStatus':
                checkWalletStatus()
                    .then(exists => sendResponse({ status: 'success', exists: exists }))
                    .catch(error => sendResponse({ status: 'error', message: error.message }));
                break; 

            case 'createWallet':
                createNewWallet(payload.password)
                    .then(mnemonic => sendResponse({ status: 'success', mnemonic: mnemonic }))
                    .catch(error => sendResponse({ status: 'error', message: error.message }));
                break;

            case 'importWallet':
                ReadMnemonic(payload.seedPhrase, payload.password)
                    .then(() => sendResponse({ status: 'success' }))
                    .catch(error => sendResponse({ status: 'error', message: error.message }));
                break;

            case 'unlockWallet':
                unlockWallet(payload.password)
                    .then(wallet => {
                        unlockedWallet = wallet;
                        resetLockTimer();
                        sendResponse({ status: 'success', address: wallet.address });
                    })
                    .catch(error => sendResponse({ status: 'error', message: error.message }));
                break;

            case 'getWalletInfo':
                if (unlockedWallet) {
                    sendResponse({ status: 'success', address: unlockedWallet.address });
                } else {
                    sendResponse({ status: 'error', message: 'Wallet is locked' });
                }
                isResponseAsync = false;
                break;
            
            case 'getWalletBalance': { // Dùng khối {} để giữ phạm vi biến
                const { address } = payload;
                
                provider.getBalance(address)
                    .then(balance => {
                        const balanceInEther = ethers.formatEther(balance); 
                        let formattedBalance;
                        const decimalIndex = balanceInEther.indexOf('.');

                        if (decimalIndex === -1) {
                            formattedBalance = balanceInEther;
                        } else {
                            const limit = decimalIndex + 8;
                            let slicedBalance = balanceInEther.substring(0, limit);
                            formattedBalance = slicedBalance.replace(/\.?0+$/, '');

                            if (formattedBalance.endsWith('.')) {
                                formattedBalance = formattedBalance.substring(0, formattedBalance.length - 1);
                            }
                        }
                        sendResponse({ status: 'success', balance: formattedBalance });
                    })
                    .catch(error => sendResponse({ status: 'error', message: error.message }));
                break;
            }
            
            case 'sendEthTransaction':
                if (!unlockedWallet) {
                    sendResponse({ status: 'error', message: 'Wallet is locked' });
                    isResponseAsync = false;
                    return isResponseAsync; // Quan trọng: Exit ngay lập tức
                }
                const { recipient, amountInEther } = payload;
                
                sendEthTransaction(unlockedWallet, provider, recipient, amountInEther)
                    .then(txResponse => {
                        resetLockTimer();
                        sendResponse({ status: 'success', txHash: txResponse.hash });
                    })
                    .catch(error => {
                        sendResponse({ status: 'error', message: error.message });
                    });
                break;

            case "getTxHistory":
                fetchTxHistoryFromAlchemy(payload.address)
                    .then(history => sendResponse({ status: "success", history }))
                    .catch(err => sendResponse({ status: "error", message: err.message }));
                break;

            case 'lockWalletManually':
                 lockWallet();
                 sendResponse({ status: 'success' });
                 isResponseAsync = false;
                 break;
                 
            default:
                isResponseAsync = false;
                break;
        }
        
        return isResponseAsync;
    }
);

let unlockedWallet = null;
let lockTimer = null;
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;

function lockWallet() {
    console.log("Wallet locked due to inactivity.");
    unlockedWallet = null;
    if (lockTimer) {
        clearTimeout(lockTimer);
        lockTimer = null;
    }
    chrome.runtime.sendMessage({ action: 'walletLocked' }).catch(() => {});
}

function resetLockTimer() {
    if (unlockedWallet === null) return;

    if (lockTimer) {
        clearTimeout(lockTimer);
    }
    lockTimer = setTimeout(lockWallet, LOCK_TIMEOUT_MS);
}

async function fetchTxHistoryFromAlchemy(address) {

    // 1. Fetch SEND — ví là người gửi
    const bodySent = {
        id: 1,
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [{
            fromBlock: "0x0",
            toBlock: "latest",
            withMetadata: true,
            category: ["external"],
            fromAddress: address,
        }]
    };

    // 2. Fetch RECEIVE — ví là người nhận
    const bodyReceived = {
        id: 2,
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [{
            fromBlock: "0x0",
            toBlock: "latest",
            withMetadata: true,
            category: ["external"],
            toAddress: address,
        }]
    };

    // 3. Gửi song song
    const [sent, received] = await Promise.all([
        fetch(SEPOLIA_RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodySent)
        }).then(r => r.json()),

        fetch(SEPOLIA_RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyReceived)
        }).then(r => r.json())
    ]);

    const sentList = sent?.result?.transfers || [];
    const receivedList = received?.result?.transfers || [];

    // 4. Gộp RAW data
    const all = [...sentList, ...receivedList];

    // 5. Map thành format chuẩn
    const mapped = all.map(tx => {
        const blockNum = tx.blockNum
        ? parseInt(tx.blockNum, 16)
        : 0;

        const timestamp = tx?.metadata?.blockTimestamp
            ? new Date(tx.metadata.blockTimestamp).getTime()
            : Date.now();

        const type = tx.from?.toLowerCase() === address.toLowerCase()
            ? "SEND"
            : "RECEIVE";

        return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value?.toString() || "0",
            blockNum,
            timeStamp: timestamp,
            type,
            status: "success",
        };
    });

    // 6. Sort mới nhất trước
    mapped.sort((a, b) => b.blockNum - a.blockNum);
    return mapped.slice(0, 10);
}
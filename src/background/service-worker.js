import { checkWalletStatus, createNewWallet, ReadMnemonic, unlockWallet } from './wallet.js';
import { ethers } from 'ethers';

const SEPOLIA_RPC_URL = `https://eth-sepolia.g.alchemy.com/v2/0PT4zYKK66VEZQGe89uX78NLXIqQ-fX7`;
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        const { action, payload } = request;
        let isResponseAsync = true; 

        if (action === 'getUnlockStatus') {
            const isLocked = unlockedWallet === null;
            sendResponse({ status: 'success', isLocked: isLocked });
            
            if (!isLocked) {
                resetLockTimer(); 
            }
            isResponseAsync = false; 
            
        } else if (action === 'checkWalletStatus') {
            checkWalletStatus()
                .then(exists => sendResponse({ status: 'success', exists: exists }))
                .catch(error => sendResponse({ status: 'error', message: error.message }));

        } else if (action === 'createWallet') {
            createNewWallet(payload.password)
                .then(mnemonic => sendResponse({ status: 'success', mnemonic: mnemonic }))
                .catch(error => sendResponse({ status: 'error', message: error.message }));

        } else if (action === 'importWallet') {
            ReadMnemonic(payload.seedPhrase, payload.password)
                .then(() => sendResponse({ status: 'success' }))
                .catch(error => sendResponse({ status: 'error', message: error.message }));
        } else  if (action === 'unlockWallet') {
            unlockWallet(payload.password)
                .then(wallet => {
                    unlockedWallet = wallet;
                    resetLockTimer();
                    sendResponse({ status: 'success', address: wallet.address });
                })
                .catch(error => sendResponse({ status: 'error', message: error.message }));
        } else if (action === 'getWalletInfo') {
            if (unlockedWallet) {
                sendResponse({ status: 'success', address: unlockedWallet.address });
            } else {
                sendResponse({ status: 'error', message: 'Wallet is locked' });
            }
            isResponseAsync = false;
        
        } else if (action === 'getWalletBalance') {
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
        } else if (action === 'sendEthTransaction') {
            if (!unlockedWallet) {
                sendResponse({ status: 'error', message: 'Wallet is locked' });
                isResponseAsync = false;
                return isResponseAsync;
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
        } else if (action === 'lockWalletManually') {
             lockWallet();
             sendResponse({ status: 'success' });
             isResponseAsync = false;
        } else{
            isResponseAsync = false;
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
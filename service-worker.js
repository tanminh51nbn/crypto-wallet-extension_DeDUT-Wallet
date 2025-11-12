// walletService.js
import { ethers } from 'ethers';
// import { encryptData, decryptData } from './cryptoUtils.js';


//Lấy ví đã lưu (nếu có) khi extension khởi động

async function checkWalletStatus() {
    const result = await chrome.storage.local.get(['customEncryptedWallet']);
    return !!result.customEncryptedWallet; // Trả về true nếu ví tồn tại
}
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        const { action, payload } = request;
        let isResponseAsync = true; 

        if (action === 'checkWalletStatus') {
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
        } else {
            isResponseAsync = false;
        }
        
        return isResponseAsync;
    }
);
async function storeEncryptedWallet(wallet, password) {
    try {
        const privateKeyHex = wallet.privateKey;
        
        // const encryptedData = await encryptData(privateKeyHex, password); 
        
        await chrome.storage.local.set({ 
            'customEncryptedWallet': {
                // ...encryptedData,
                pw: password, // Lưu mật khẩu thô tạm thời cho mục đích demo
                pk: privateKeyHex, // Lưu Private Key thô tạm thời cho mục đích demo
                address: wallet.address // Lưu địa chỉ để hiển thị trên UI mà không cần giải mã
            } 
        });
    } catch (err) {
        throw new Error(`Import & Store Failed: ${err.message}`);
    }
}

async function createNewWallet(password) {
    try {
        const wallet = ethers.Wallet.createRandom();
        
        await storeEncryptedWallet(wallet, password);
        
        return wallet.mnemonic.phrase.split(' ');
    } catch (error) {
            throw new Error("Create & Store Failed.");
    }
}

async function ReadMnemonic(seedPhrase, password) {
    try {
        const wallet = ethers.Wallet.fromPhrase(seedPhrase);
        
        await storeEncryptedWallet(wallet, password);
        
        return true;
    } catch (error) {
        throw new Error("Invalid Seed Phrase.");
    }
}

// async function unlockWallet(password) {
//     const result = await chrome.storage.local.get(['customEncryptedWallet']);
//     const encryptedData = result.customEncryptedWallet;

//     if (!encryptedData) {
//         throw new Error("Không tìm thấy ví được lưu. Vui lòng tạo hoặc khôi phục ví.");
//     }

//     try {
//         const privateKeyHex = await decryptData(encryptedData, password); 
        
//         const wallet = new Wallet(privateKeyHex);
//         return wallet;
//     } catch (err) {
//         throw new Error("Mật khẩu không chính xác hoặc tệp ví bị lỗi.");
//     }
// }
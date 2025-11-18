import { ethers } from 'ethers';
import { encryptData, decryptData } from './crypto.js';

export async function checkWalletStatus() {
    const result = await chrome.storage.local.get(['customEncryptedWallet']);
    return !!result.customEncryptedWallet;
}

export async function storeEncryptedWallet(wallet, password) {
    try {
        const privateKeyHex = wallet.privateKey;
        const encryptedData = await encryptData(privateKeyHex, password);
        await chrome.storage.local.set({
            'customEncryptedWallet': {
                ...encryptedData,
                address: wallet.address
            } 
        });
    } catch (err) {
        throw new Error(`Import & Store Failed: ${err.message}`);
    }
}

export async function createNewWallet(password) {
    try {
        const wallet = ethers.Wallet.createRandom();
        await storeEncryptedWallet(wallet, password);
        return wallet.mnemonic.phrase.split(' ');
    } catch (error) {
            throw new Error("Create & Store Failed.");
    }
}

export async function ReadMnemonic(seedPhrase, password) {
    try {
        const wallet = ethers.Wallet.fromPhrase(seedPhrase);
        
        await storeEncryptedWallet(wallet, password);
        
        return true;
    } catch (error) {
        throw new Error("Invalid Seed Phrase.");
    }
}

export async function unlockWallet(password) {
    const result = await chrome.storage.local.get(['customEncryptedWallet']);
    const encryptedData = result.customEncryptedWallet;

    if (!encryptedData) {
        throw new Error("Không tìm thấy ví được lưu. Vui lòng tạo hoặc khôi phục ví.");
    }

    try {
        const privateKeyHex = await decryptData(encryptedData, password);
        
        const wallet = new ethers.Wallet(privateKeyHex);
        return wallet;
    } catch (err) {
        throw new Error("Mật khẩu không chính xác hoặc tệp ví bị lỗi.");
    }
}
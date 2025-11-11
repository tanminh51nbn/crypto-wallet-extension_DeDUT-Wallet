// walletService.js
import { ethers } from 'ethers';
import { encryptData, decryptData } from './cryptoUtils.js';


// Lấy ví đã lưu (nếu có) khi extension khởi động
// chrome.storage.local.get(['customEncryptedWallet'], (result) => {
//   if (result.customEncryptedWallet) {
//     // Chỉ lưu trữ thông tin ví đã mã hóa, ví chưa được giải mã
//   }
// });
// async function storeEncryptedWallet(wallet, password) {
//     try {
//         const privateKeyHex = wallet.privateKey;
        
//         const encryptedData = await encryptData(privateKeyHex, password); 
        
//         await chrome.storage.local.set({ 
//             'customEncryptedWallet': {
//                 ...encryptedData,
//                 address: wallet.address // Lưu địa chỉ để hiển thị trên UI mà không cần giải mã
//             } 
//         });
//     } catch (err) {
//         throw new Error(`Lưu trữ mã hóa thất bại: ${err.message}`);
//     }
// }

async function createNewWallet(password) {
    try {
        const wallet = ethers.Wallet.createRandom();
        
        // await storeEncryptedWallet(wallet, password);
        
        return wallet.mnemonic.phrase.split(' ');
    } catch (error) {
            throw new Error("Lỗi hệ thống khi tạo và lưu ví.");
    }
}

async function ReadMnemonic(seedPhrase, password) {
    try {
        const wallet = ethers.Wallet.fromPhrase(seedPhrase);
        
        // await storeEncryptedWallet(wallet, password);
        
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

export { 
    createNewWallet, 
    ReadMnemonic,
    // unlockWallet
};
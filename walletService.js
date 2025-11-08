import { ethers } from 'ethers';

export async function ReadMnemonic(seedPhrase) {   
    try {
        const wallet = ethers.Wallet.fromPhrase(seedPhrase);
            return {
                address: wallet.address,
                seedPhrase: wallet.mnemonic.phrase
            };
    } catch (error) {
        console.error("Lỗi khi nhập Seed Phrase:", error);
        throw new Error("Seed Phrase không hợp lệ.");
    }
}
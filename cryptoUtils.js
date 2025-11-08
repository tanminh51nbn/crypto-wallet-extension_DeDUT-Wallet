import { hash } from 'argon2-browser';

const ARGON2_PARAMS = {
    name: 'argon2',
    type: 2,

    salt: new Uint8Array(16), 
    iterations: 4,      //i=4
    memory: 128 * 1024, // m=128MB
    parallelism: 1,     // p=1

    hashLength: 32, 
    version: 0x13
};

// Hàm dẫn xuất khóa (Key Derivation) từ mật khẩu bằng Argon2
async function deriveArgon2Key(password, salt) {
    const passwordBuffer = (new TextEncoder()).encode(password);
    
    // 1. Sử dụng argon2-browser để băm
    const result = await hash({
        ...ARGON2_PARAMS, 
        pass: passwordBuffer, // Thư viện Argon2 cần mật khẩu ở đây
        salt: salt,
        // Tham số outputType cần để nhận được Uint8Array
        outputType: 'uint8' 
    });

    const rawHash = result.hash; // Đây là output 32-byte từ Argon2

    // 2. Import mã băm này vào Web Crypto API để làm khóa AES
    const aesKey = await crypto.subtle.importKey(
        'raw',
        rawHash, // Dùng output của Argon2 làm Khóa AES (Key)
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );

    return aesKey;
}

// Hàm mã hóa Private Key
async function encryptData(privateKeyHex, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16)); 
    const iv = crypto.getRandomValues(new Uint8Array(12)); 

    const aesKey = await deriveArgon2Key(password, salt);

    const encoder = new TextEncoder();
    const privateKeyBuffer = encoder.encode(privateKeyHex);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        aesKey,
        privateKeyBuffer
    );
    
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
        params: ARGON2_PARAMS,
    };
}

// Hàm giải mã Private Key
async function decryptData(encryptedData, password) {
    // atob (Base64 decode) để chuyển chuỗi thành byte array
    const salt = new Uint8Array(atob(encryptedData.salt).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(encryptedData.ciphertext).split('').map(c => c.charCodeAt(0)));

    const aesKey = await deriveArgon2Key(password, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        aesKey,
        ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer); // Trả về Private Key ở dạng HEX
}

export { encryptData, decryptData };
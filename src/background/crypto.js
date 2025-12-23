import { argon2id } from '@noble/hashes/argon2.js';

// === CẤU HÌNH ARGON2 (có thể tùy chỉnh) ===
const ARGON2_CONFIG = {
    t: 10,           // time cost (iterations)
    m: 16*8 * 1024,   // memory cost in KiB → 128MB
    p: 16,           // parallelism
    dkLen: 32       // output length: 32 bytes
};

// Hàm dẫn xuất khóa từ mật khẩu + salt → AES key
async function deriveArgon2Key(password, salt) {
    // Chuyển password và salt thành Uint8Array
    const pass = new TextEncoder().encode(password);
    const saltBytes = salt instanceof Uint8Array ? salt : new Uint8Array(salt);

    // Dùng @noble/hashes/argon2id 
    const hash = argon2id(pass, saltBytes, ARGON2_CONFIG);

    // Import hash → Web Crypto AES key
    const aesKey = await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false, // không exportable
        ['encrypt', 'decrypt']
    );

    // Zeroing sensitive data (tốt nhất có thể rầu)
    pass.fill(0);
    hash.fill(0);
    if (Array.isArray(salt)) salt.fill(0);

    return aesKey;
}

// === UTILS: Base64 <-> ArrayBuffer ===
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

// === MÃ HÓA PRIVATE KEY ===
export async function encryptData(privateKeyHex, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const aesKey = await deriveArgon2Key(password, salt);
    const data = new TextEncoder().encode(privateKeyHex);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        data
    );
    // data.fill(0);
    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
        // Lưu config để decrypt (không bắt buộc nếu cố định)
        // config: ARGON2_CONFIG
    };
}

// === GIẢI MÃ PRIVATE KEY ===
export async function decryptData(encryptedData, password) {
    const salt = base64ToArrayBuffer(encryptedData.salt);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);

    const aesKey = await deriveArgon2Key(password, salt);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext
    );
    // aesKey.fill(0);

    return new TextDecoder().decode(decrypted);
}
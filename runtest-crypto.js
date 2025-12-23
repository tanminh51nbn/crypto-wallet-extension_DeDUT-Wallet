import { argon2id } from '@noble/hashes/argon2.js';

// === CẤU HÌNH ARGON2 (có thể tùy chỉnh) ===
const ARGON2_CONFIG = {
    t: 4,           // time cost (iterations)
    m: 128 * 1024,   // memory cost in KiB → 64MB
    p: 8,           // parallelism
    dkLen: 32       // output length: 32 bytes
};

// Hàm dẫn xuất khóa từ mật khẩu + salt → AES key
async function deriveArgon2Key(password, salt) {
    // Chuyển mật khẩu sang Uint8Array, dạng byte để Argon2id xử lý
    const pass = new TextEncoder().encode(password);
    console.log(`|--|--|--> [PASSWORD - BYTE]: ${pass}`);

    // Đảm bảo salt là Uint8Array
    const saltBytes = salt instanceof Uint8Array ? salt : new Uint8Array(salt);
    console.log(`|--|--|--> [SALT ARGON2ID - BYTE]: ${saltBytes}`);

    // Dùng @noble/hashes/argon2id (thuần JS, không WASM, không eval)
    console.log("Bắt đầu băm...");
    const hash = argon2id(pass, saltBytes, ARGON2_CONFIG);
    console.log("Băm thành công!");
    console.log(`|--|--|--> [HASH ARGON2ID]: ${hash}`);
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
async function encryptData(privateKeyHex, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    console.log(`|--|--> [SALT ARGON2ID]: ${salt}`);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    console.log(`|--|--> [IV AES-GCM]: ${iv}`);
    console.log("Bắt đầu dẫn xuất khóa AES-GCM từ PASSWORD + SALT bằng Argon2id...");
    const aesKey = await deriveArgon2Key(password, salt);
    console.log("Dẫn xuất khóa thành công!");
    
    console.log(`Sử dụng aesKey và data (Private Key) để  mã hóa tạo ra ciphertext`);
    console.log(`|--|--> [AESKEY AES-GCM]: ${aesKey}`);
    const data = new TextEncoder().encode(privateKeyHex);
    console.log(`|--|--> [PRIVATE KEY - BYTE]: ${data}`);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        data
    );
    data.fill(0);
    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
    };
}

// === GIẢI MÃ PRIVATE KEY ===
async function decryptData(encryptedData, password) {
    const salt = base64ToArrayBuffer(encryptedData.salt);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);

    const aesKey = await deriveArgon2Key(password, salt);

    let decryptedText;
    
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            ciphertext
        );
        decryptedText = new TextDecoder().decode(decrypted);
        
    } catch (e) {
        if (e.name === 'OperationError' || e.name === 'DataError') {
            console.log(`[ERROR] Giải mã thất bại: Khóa không khớp hoặc dữ liệu bị giả mạo.`);
            decryptedText = null;
        } else {
            throw e; 
        }
    }
    return decryptedText;
}

async function runTest() {
    const testPassword_TRUE = 'yeuem3000';
    const testPassword_FALSE = 'yeuem3001';
    const testPrivateKey = '0x2fb792fafbd302b4378135dadbb07f8e70ee820eb97d51acc0ab347ba48610cd';
    
    console.log('====================================================');
    console.log(`[1] Chạy encryptData(PrivateKey, Password)`);
    console.log(`|--> [PASSWORD - TEXT - Gốc]: ${testPassword_TRUE}`);
    console.log(`|--> [Private Key - HEX - Gốc]: ${testPrivateKey}`);
    console.log(`|--> [INPUT ARGON2ID]:\n \t m = ${ARGON2_CONFIG.m / 1024} MB RAM,\n \t i = ${ARGON2_CONFIG.t},\n \t p = : ${ARGON2_CONFIG.p},\n \t dkLen = ${ARGON2_CONFIG.dkLen} bytes`);
    console.log('----------------------------------------------------');
    // === MÃ HÓA ===
    const encryptedData = await encryptData(testPrivateKey, testPassword_TRUE);
    console.log('----------------------------------------------------');

    console.log('\n====================================================');
    console.log(`[2]DỮ LIỆU MÃ HÓA dạng Base64:`);
    console.log(encryptedData);
    console.log('----------------------------------------------------');

    const testPassword_Verify = testPassword_FALSE;
    console.log('\n====================================================');
    console.log(`[3]Tiến hành xác minh & giải mã`);
    console.log(`|--> [PASSWORD - TEXT - Xác minh]: ${testPassword_Verify}`);
    console.log(`|--> [Private Key - HEX - Xác minh]: ${testPrivateKey}`);
    console.log(`|--> [INPUT ARGON2ID]:\n \t m = ${ARGON2_CONFIG.m / 1024} MB RAM,\n \t i = ${ARGON2_CONFIG.t},\n \t p = : ${ARGON2_CONFIG.p},\n \t dkLen = ${ARGON2_CONFIG.dkLen} bytes`);
    console.log('----------------------------------------------------');
    // === GIẢI MÃ ===
    const decryptedKey = await decryptData(encryptedData, testPassword_Verify);
    console.log('----------------------------------------------------');

    console.log('\n====================================================');
    console.log(`KẾT QUẢ CUỐI CÙNG`);
    console.log(`\n Dữ liệu giải mã có khớp với dữ liệu gốc không?\n => ${decryptedKey === testPrivateKey ? 'CÓ' : 'KHÔNG'}`);
    console.log('====================================================');;
}

runTest();
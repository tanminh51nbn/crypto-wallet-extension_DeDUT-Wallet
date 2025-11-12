import * as argon2 from 'argon2-browser';

const ARGON2_PARAMS = {
    name: 'argon2',
    type: argon2.ArgonType.Argon2id,

    salt: new Uint8Array(16), 
    iterations: 4,      //i=4
    memory: 256 * 1024, // m=256MB
    parallelism: 1,     // p=1

    hashLength: 32, 
    version: 0x13,
};

// Hàm dẫn xuất khóa (Key Derivation) từ mật khẩu bằng Argon2
async function deriveArgon2Key(password, salt) {
    const passwordBuffer = (new TextEncoder()).encode(password);
    
    // 1. Sử dụng argon2-browser để băm
    const result = await argon2.hash({
        ...ARGON2_PARAMS, 
        pass: passwordBuffer, // Thư viện Argon2 cần mật khẩu ở đây
        salt: salt,
        outputType: 'uint8',
        wasmPath: './argon2.wasm'
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
    
    // 3. Ghi đè bộ nhớ (Memory Zeroing)
    // Việc này giúp xóa mật khẩu thô và khóa AES thô khỏi bộ nhớ đệm
    // ngay sau khi chúng đã được chuyển sang đối tượng khóa của Web Crypto.
    try {
        passwordBuffer.fill(0); // Xóa mật khẩu người dùng khỏi bộ nhớ
        rawHash.fill(0);        // Xóa Khóa AES thô khỏi bộ nhớ
    } catch (e) {
        // Có thể thất bại nếu đó là một Buffer dạng View-Only (rất hiếm trong trường hợp này)
        console.warn("Could not zero out sensitive data buffers.", e);
    }

    return aesKey;
}

// Hàm từ ArrayBuffer/Uint8Array sang Base64 (dùng btoa)
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    // Chuyển Uint8Array thành Binary String
    const binary = String.fromCharCode.apply(null, bytes);
    return btoa(binary);
}

// Hàm từ Base64 sang Uint8Array (dùng atob)
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    
    // Chuyển Binary String sang Uint8Array
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
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
    
    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
        params: ARGON2_PARAMS,
    };
}

// Hàm giải mã Private Key
async function decryptData(encryptedData, password) {
    const salt = base64ToArrayBuffer(encryptedData.salt);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);

    const aesKey = await deriveArgon2Key(password, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        aesKey,
        ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer); 
}

export { encryptData, decryptData };
/**
 * Field-level AES-256-GCM encryption using Web Crypto API (zero dependencies).
 *
 * ใช้สำหรับเข้ารหัสข้อมูลส่วนบุคคลที่ละเอียดอ่อนก่อนเขียนลง Firestore
 * เช่น อีเมลผู้รายงาน, หมายเลขโทรศัพท์, ที่อยู่สำหรับจัดส่ง
 *
 * ⚠️ Key Management:
 *   - อย่าฝัง key ตรงๆ ใน source code หรือ bundle
 *   - ควรดึง key จาก Vercel Environment Variable ผ่าน serverless function
 *   - สำหรับ client-only app: Firestore Security Rules คือการป้องกันชั้นหลัก
 *     encryption ชั้นนี้เพิ่ม defense-in-depth ในกรณีที่ Rules ถูก bypass
 */

const ALGORITHM = { name: 'AES-GCM', length: 256 };

/**
 * แปลง hex string (64 chars) เป็น CryptoKey
 * สร้างด้วย: crypto.getRandomValues(new Uint8Array(32)) แล้วแปลงเป็น hex
 */
async function importKeyFromHex(hexKey) {
    if (!hexKey || hexKey.length !== 64) throw new Error('Key ต้องเป็น hex 32 bytes (64 chars)');
    const raw = Uint8Array.from(hexKey.match(/.{2}/g).map(h => parseInt(h, 16)));
    return crypto.subtle.importKey('raw', raw, ALGORITHM, false, ['encrypt', 'decrypt']);
}

/**
 * เข้ารหัส plaintext → base64 string (IV prepended)
 * @param {string} plaintext
 * @param {string} hexKey  - 64-char hex string
 * @returns {Promise<string>}
 */
export async function encryptField(plaintext, hexKey) {
    if (!plaintext) return plaintext;
    const key = await importKeyFromHex(hexKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
}

/**
 * ถอดรหัส base64 string → plaintext
 * @param {string} cipherB64
 * @param {string} hexKey
 * @returns {Promise<string>}
 */
export async function decryptField(cipherB64, hexKey) {
    if (!cipherB64) return cipherB64;
    const key = await importKeyFromHex(hexKey);
    const bytes = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}

/**
 * สร้าง encryption key ใหม่ (ใช้ครั้งแรกตั้งค่าระบบ)
 * วิธีใช้: เปิด browser console แล้วรัน generateKey()
 * แล้วเอา hex ที่ได้ไปใส่ใน Vercel Environment Variables ชื่อ VITE_ENCRYPT_KEY
 */
export function generateKey() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash ค่าไว้ใช้ค้นหา (เช่น wallet address → lookup token)
 * ใช้ SHA-256 เพื่อให้ค้นหา Firestore ได้โดยไม่ต้องเก็บค่าจริง
 */
export async function hashField(value) {
    if (!value) return null;
    const encoded = new TextEncoder().encode(value.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

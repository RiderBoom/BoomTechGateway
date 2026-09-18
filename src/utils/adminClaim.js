/**
 * Client-side utilities สำหรับ Firebase Admin Custom Claim
 *
 * Flow:
 *   requestAdminClaim()  → MetaMask popup → ส่ง signature ไป /api/set-admin-claim
 *                       → Firebase token refresh → Firestore Rules เห็น admin:true
 *   hasAdminClaim()      → ตรวจสอบว่า token ปัจจุบันมี admin:true แล้วหรือยัง
 */

const SIGN_MESSAGE = (wallet, firebaseUid, ts) =>
    `BoomTech Admin Authentication\nWallet: ${wallet.toLowerCase()}\nFirebase UID: ${firebaseUid}\nTimestamp: ${ts}`;

/**
 * ขอ admin custom claim:
 *   1. MetaMask sign message
 *   2. POST /api/set-admin-claim
 *   3. Force-refresh Firebase ID token
 *
 * @param {import('ethers').providers.Web3Provider} provider
 * @param {string} account - wallet address
 * @param {import('firebase/auth').User} firebaseUser
 * @throws {Error} ถ้า user reject MetaMask หรือ API fail
 */
export async function requestAdminClaim(provider, account, firebaseUser) {
    const timestamp = Date.now().toString();
    const message   = SIGN_MESSAGE(account, firebaseUser.uid, timestamp);

    // ขอ signature จาก MetaMask
    const signer    = provider.getSigner();
    const signature = await signer.signMessage(message);

    // ส่งไป serverless function
    const res = await fetch('/api/set-admin-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            walletAddress: account,
            signature,
            timestamp,
            firebaseUid: firebaseUser.uid,
        }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'ตั้งค่า Admin Claim ไม่สำเร็จ');
    }

    // Force-refresh token เพื่อให้ Firestore Rules เห็น admin:true ทันที
    await firebaseUser.getIdToken(true);
}

/**
 * ตรวจสอบว่า Firebase token ปัจจุบันมี admin custom claim แล้วหรือยัง
 * ใช้ cache จาก getIdTokenResult() — ไม่ต้อง round-trip ทุกครั้ง
 *
 * @param {import('firebase/auth').User} firebaseUser
 * @returns {Promise<boolean>}
 */
export async function hasAdminClaim(firebaseUser) {
    if (!firebaseUser) return false;
    try {
        const result = await firebaseUser.getIdTokenResult();
        return result.claims.admin === true;
    } catch {
        return false;
    }
}

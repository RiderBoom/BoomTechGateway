import { addDoc, collection } from 'firebase/firestore';

/**
 * บันทึก transaction ลง Firestore
 * - uid ใช้สำหรับ Firestore Security Rules (อ่านได้เฉพาะเจ้าของ + admin)
 * - extra รับ field เพิ่มเติม เช่น paymentStatus: 'pending_verification'
 */
export async function recordTransaction(db, appId, firebaseUser, account, type, amount, token, to, details = "", shippingAddress = null, extra = {}) {
    if (!db || !appId || !firebaseUser) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
            type, amount, token, to, details, shippingAddress,
            from:      account,
            uid:       firebaseUser.uid,   // ⬅️ เพิ่ม uid สำหรับ Rules
            timestamp: Date.now(),
            ...extra,                       // เช่น { paymentStatus: 'pending_verification' }
        });
    } catch (e) { console.error("Log tx error", e); }
}

export function formatNumber(num) {
    if (!num) return "-";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    return num.toLocaleString();
}

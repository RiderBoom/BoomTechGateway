import { addDoc, collection } from 'firebase/firestore';

export async function recordTransaction(db, appId, firebaseUser, account, type, amount, token, to, details = "", shippingAddress = null) {
    if (!db || !appId || !firebaseUser) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
            type, amount, token, to, details, shippingAddress,
            from: account,
            timestamp: Date.now()
        });
    } catch (e) { console.error("Log tx error", e); }
}

export function formatNumber(num) {
    if (!num) return "-";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    return num.toLocaleString();
}

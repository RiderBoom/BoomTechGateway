/**
 * Vercel Serverless Function — Set Firebase Admin Custom Claim
 *
 * Flow:
 *   1. Client ส่ง walletAddress + signature (MetaMask personal_sign) + timestamp + firebaseUid
 *   2. Function verify signature → ยืนยันว่า client เป็นเจ้าของ wallet จริง
 *   3. ตรวจว่า wallet อยู่ใน ADMIN_WALLETS
 *   4. setCustomUserClaims(uid, { admin: true })
 *   5. Client รัน firebaseUser.getIdToken(true) เพื่อ refresh token
 *
 * ⚙️ Environment Variables (Vercel Dashboard → Project → Settings → Env):
 *   FIREBASE_SERVICE_ACCOUNT  = JSON ทั้งหมดจาก Firebase Service Account key
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ethers } from 'ethers';

// ─── Admin Wallet List (ตรงกับ ADMIN_WALLETS ใน constants.js) ───────────────
const ADMIN_WALLETS = [
    '0x00F0903777B197CF673901b3cc768EA902fb601F',
].map(w => w.toLowerCase());

// Signature อายุไม่เกิน 5 นาที (ป้องกัน replay attack)
const MAX_AGE_MS = 5 * 60 * 1000;

// ข้อความที่ใช้ sign — ต้องตรงกับ adminClaim.js ฝั่ง client
export const SIGN_MESSAGE = (wallet, firebaseUid, ts) =>
    `BoomTech Admin Authentication\nWallet: ${wallet.toLowerCase()}\nFirebase UID: ${firebaseUid}\nTimestamp: ${ts}`;

// ─── Firebase Admin SDK (init ครั้งเดียว) ───────────────────────────────────
function getAdminAuth() {
    if (!getApps().length) {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
        }
        initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
    }
    return getAuth();
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { walletAddress, signature, timestamp, firebaseUid } = req.body ?? {};

    // ── Validate inputs ───────────────────────────────────────────────────────
    if (!walletAddress || !signature || !timestamp || !firebaseUid) {
        return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน (walletAddress, signature, timestamp, firebaseUid)' });
    }

    // ── Timestamp freshness check ─────────────────────────────────────────────
    const age = Date.now() - Number(timestamp);
    if (age > MAX_AGE_MS || age < 0) {
        return res.status(400).json({ error: 'Signature หมดอายุ — กรุณาลองใหม่' });
    }

    // ── Verify MetaMask signature ─────────────────────────────────────────────
    let recovered;
    try {
        const message = SIGN_MESSAGE(walletAddress, firebaseUid, timestamp);
        recovered = ethers.utils.verifyMessage(message, signature);
    } catch {
        return res.status(400).json({ error: 'Signature ไม่ถูกต้อง' });
    }

    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(403).json({ error: 'Signature ไม่ตรงกับ Wallet Address' });
    }

    // ── Check admin wallet list ───────────────────────────────────────────────
    if (!ADMIN_WALLETS.includes(walletAddress.toLowerCase())) {
        return res.status(403).json({ error: 'Wallet นี้ไม่มีสิทธิ์ Admin' });
    }

    // ── Set Firebase Custom Claim ─────────────────────────────────────────────
    try {
        const auth = getAdminAuth();
        await auth.setCustomUserClaims(firebaseUid, { admin: true });

        console.info(`[set-admin-claim] ✅ admin claim set — uid:${firebaseUid} wallet:${walletAddress}`);
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[set-admin-claim] Firebase error:', err.message);
        return res.status(500).json({ error: 'ตั้งค่า Custom Claim ไม่สำเร็จ' });
    }
}

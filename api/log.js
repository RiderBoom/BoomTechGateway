/**
 * Vercel Serverless Function — Access Log Endpoint
 *
 * จุดประสงค์: บันทึก IP Address จริงของผู้ใช้ลง Firestore เพื่อให้เป็นไปตาม
 * พ.ร.บ. คอมพิวเตอร์ มาตรา 26 (เก็บข้อมูลจราจรทางคอมพิวเตอร์ไม่น้อยกว่า 90 วัน)
 *
 * ⚙️ Setup ก่อนใช้งาน:
 * 1. npm install firebase-admin
 * 2. Firebase Console → Project Settings → Service Accounts → Generate new private key
 * 3. Vercel Dashboard → Project → Settings → Environment Variables
 *    เพิ่ม: FIREBASE_SERVICE_ACCOUNT = (วางเนื้อหา JSON ทั้งหมด)
 *           FIREBASE_APP_ID = (เช่น default-app-id หรือ app ID จริง)
 * 4. deploy แล้ว function นี้จะใช้งานได้ที่ /api/log
 *
 * ⚙️ Firestore TTL (ตั้งค่า auto-delete 90 วัน):
 * Firebase Console → Firestore → Indexes tab → TTL Policies → Add TTL policy
 *   Collection group: access_logs
 *   Field: expireAt
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let db;

function initFirebase() {
    if (db) return db;
    if (!getApps().length) {
        initializeApp({
            credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
        });
    }
    db = getFirestore();
    return db;
}

export default async function handler(req, res) {
    // CORS — อนุญาตเฉพาะ domain ของตัวเอง
    const allowedOrigin = process.env.PUBLIC_APP_ORIGIN || 'https://boomtech.app';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // ดึง IP จริงจาก Vercel headers (ผ่าน reverse proxy)
    const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';
    const origin    = req.headers['origin'] || req.headers['referer'] || 'direct';

    const { action = 'pageview', appId, wallet = null, path = '/' } = req.body || {};

    if (!appId) return res.status(400).json({ error: 'appId required' });
    if (process.env.FIREBASE_APP_ID && appId !== process.env.FIREBASE_APP_ID) {
        return res.status(403).json({ error: 'Invalid appId' });
    }
    if (typeof action !== 'string' || action.length > 80 || typeof path !== 'string' || path.length > 512) {
        return res.status(400).json({ error: 'Invalid log payload' });
    }

    const firestore = initFirebase();
    const now = Date.now();
    const expireAt = new Date(now + 90 * 24 * 60 * 60 * 1000); // 90 วัน

    try {
        await firestore
            .collection('artifacts').doc(appId)
            .collection('private').doc('logs')
            .collection('access_logs')
            .add({
                ip,
                userAgent,
                action,
                path,
                wallet,
                origin,
                timestamp: now,
                expireAt,   // Firestore TTL field — ใช้สร้าง TTL policy ชื่อ "expireAt"
            });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[access-log] Firestore error:', err.message);
        // ไม่ throw error ออกไปยัง client เพื่อไม่ให้รู้ว่าระบบ log ล้มเหลว
        return res.status(200).json({ ok: false });
    }
}

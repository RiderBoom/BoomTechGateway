import { useEffect, useRef } from 'react';

const LOG_ENDPOINT = '/api/log';

/**
 * ส่ง access log ไปยัง /api/log (Vercel serverless function)
 * function นั้นจะบันทึก IP จริง + UserAgent + Timestamp ลง Firestore
 * แบบ fire-and-forget — ไม่มี retry, ไม่ block UI
 */
async function sendLog(appId, payload) {
    if (!appId) return;
    try {
        await fetch(LOG_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId, ...payload }),
            keepalive: true, // ส่งได้แม้ user ปิด tab
        });
    } catch { /* silent — ไม่ให้ error ของ log กระทบ UX */ }
}

/**
 * React hook สำหรับ log การใช้งาน
 *
 * @param {string} appId       - Firebase app ID
 * @param {string|null} account - wallet address (null ถ้ายังไม่เชื่อมต่อ)
 * @param {string} activeTab   - tab ที่เปิดอยู่
 *
 * @returns {{ logAction }} - function สำหรับ log action เฉพาะเจาะจง
 *
 * ตัวอย่างการใช้ logAction เพิ่มเติม:
 *   const { logAction } = useAccessLog(appId, account, activeTab);
 *   await logAction('shop_purchase', { itemId: '123', amount: '0.05' });
 */
export function useAccessLog(appId, account, activeTab, analyticsConsent) {
    const lastTab = useRef(null);

    // Log เมื่อเปลี่ยน tab (page view)
    useEffect(() => {
        if (!analyticsConsent || !appId || activeTab === lastTab.current) return;
        lastTab.current = activeTab;
        sendLog(appId, {
            action: 'tab_view',
            path: `/#${activeTab}`,
            wallet: account || null,
        });
    }, [analyticsConsent, appId, activeTab, account]);

    // Log ครั้งแรกที่ wallet เชื่อมต่อ
    const prevAccount = useRef(null);
    useEffect(() => {
        if (!analyticsConsent || !appId || !account || account === prevAccount.current) return;
        prevAccount.current = account;
        sendLog(appId, {
            action: 'wallet_connect',
            path: `/#${activeTab}`,
            wallet: account,
        });
    }, [analyticsConsent, appId, account, activeTab]);

    const logAction = (action, extra = {}) => {
        if (!analyticsConsent) return;
        sendLog(appId, {
            action,
            path: `/#${activeTab}`,
            wallet: account || null,
            ...extra,
        });
    };

    return { logAction };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged,
    GoogleAuthProvider, signInWithPopup, signInWithPhoneNumber,
    RecaptchaVerifier, signOut,
} from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { FIREBASE_CONFIG, INITIAL_PRODUCTS, ADMIN_FIREBASE_UIDS } from '../constants';

const DEFAULT_FEE = { platformFeePercent: 0, platformFeeFixed: 0 };
const DEFAULT_COLLECTIONS = ["Merch", "Gadget", "Mining", "Digital", "NFT"];
const DEFAULT_TABS_CONFIG = { wallet: true, market: true, game: true, shop: true, news: true, community: true, donate: true };
const DEFAULT_PAYMENT_CONFIG = { eth: true, usdt: true, promptpay: true };

export function useFirebase() {
    const [db, setDb] = useState(null);
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [dbError, setDbError] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [shopOrders, setShopOrders] = useState([]);
    const [products, setProducts] = useState(INITIAL_PRODUCTS);
    const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE);
    const [bannedUsers, setBannedUsers] = useState([]);
    const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);
    const [tabsConfig, setTabsConfig] = useState(DEFAULT_TABS_CONFIG);
    const [paymentConfig, setPaymentConfig] = useState(DEFAULT_PAYMENT_CONFIG);
    const [reports, setReports] = useState([]);
    const [takedownLog, setTakedownLog] = useState([]);

    const authRef = useRef(null);
    const appId = globalThis.__app_id || 'default-app-id';

    useEffect(() => {
        try {
            let config;
            if (globalThis.__firebase_config) {
                config = JSON.parse(globalThis.__firebase_config);
            } else {
                config = FIREBASE_CONFIG;
            }
            if (!config) return;

            const app = initializeApp(config);
            const authInstance = getAuth(app);
            authRef.current = authInstance;
            const dbInstance = getFirestore(app);
            setDb(dbInstance);

            const initAuth = async () => {
                if (globalThis.__initial_auth_token) {
                    await signInWithCustomToken(authInstance, globalThis.__initial_auth_token);
                } else {
                    await signInAnonymously(authInstance);
                }
            };
            initAuth().catch(err => {
                console.error("Auth failed", err);
                setDbError("Authentication failed: " + err.code);
            });

            const unsub = onAuthStateChanged(authInstance, (user) => setFirebaseUser(user));
            return () => unsub();
        } catch (e) {
            console.error("Firebase init error", e);
            setDbError("Firebase Init Error: " + e.message);
        }
    }, []);

    useEffect(() => {
        if (!db || !appId || !firebaseUser) return;
        setDbError(null);

        const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'community_chat');
        const unsubChat = onSnapshot(chatRef, (snap) => {
            const msgs = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => a.timestamp - b.timestamp);
            setChatMessages(msgs);
        }, (err) => {
            if (err.code === 'permission-denied')
                setDbError("Permission Denied: โปรดตรวจสอบ Firestore Rules ใน Firebase Console");
        });

        // ── Transactions — admin เห็นทุกรายการ, user เห็นเฉพาะของตัวเอง (PDPA) ──
        const isAdminUid = ADMIN_FIREBASE_UIDS.includes(firebaseUser.uid);
        let txRef;
        if (isAdminUid) {
            // Admin: อ่านทั้งหมด
            txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
        } else {
            // Regular user: อ่านเฉพาะของตัวเอง (ต้องตรวจ Custom Claim ด้วย)
            txRef = query(
                collection(db, 'artifacts', appId, 'public', 'data', 'transactions'),
                where('uid', '==', firebaseUser.uid)
            );
        }
        // หลัง Custom Claim ถูก set (MetaMask admin) → token refresh → uid เป็น admin claim
        // ให้ตรวจสอบ claim เพิ่มเติมผ่าน getIdTokenResult
        const setupTxListener = async () => {
            let finalTxRef = txRef;
            if (!isAdminUid) {
                try {
                    const result = await firebaseUser.getIdTokenResult();
                    if (result.claims.admin === true) {
                        finalTxRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
                    }
                } catch { /* fall back to the user's own transactions */ }
            }
            return onSnapshot(finalTxRef, (snap) => {
                const txs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp);
                setTransactions(txs.slice(0, 50));
                setShopOrders(txs.filter(t => t.type === 'SHOP_BUY' || t.type === 'SHOP_BUY_QR'));
            });
        };
        let unsubTx = () => {};
        setupTxListener().then(unsub => { unsubTx = unsub; });

        const prodRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
        const unsubProd = onSnapshot(prodRef, (snap) => {
            if (!snap.empty) {
                const prods = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setProducts(prods);
            }
        });

        const feeRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'fees');
        const unsubFees = onSnapshot(feeRef, (snap) => {
            if (snap.exists()) setFeeSettings({ ...DEFAULT_FEE, ...snap.data() });
        });

        const bannedRef = collection(db, 'artifacts', appId, 'public', 'data', 'banned_users');
        const unsubBanned = onSnapshot(bannedRef, (snap) => {
            setBannedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const colRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'collections');
        const unsubCol = onSnapshot(colRef, (snap) => {
            if (snap.exists() && snap.data().list?.length > 0) {
                setCollections(snap.data().list);
            }
        });

        const tabsRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'tabs_config');
        const unsubTabs = onSnapshot(tabsRef, (snap) => {
            if (snap.exists()) setTabsConfig({ ...DEFAULT_TABS_CONFIG, ...snap.data() });
            else setTabsConfig(DEFAULT_TABS_CONFIG);
        });

        const paymentRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'payment_config');
        const unsubPayment = onSnapshot(paymentRef, (snap) => {
            if (snap.exists()) setPaymentConfig({ ...DEFAULT_PAYMENT_CONFIG, ...snap.data() });
            else setPaymentConfig(DEFAULT_PAYMENT_CONFIG);
        });

        // Rules อนุญาต reports/takedown_log เฉพาะ admin; ห้ามสร้าง listener ให้ผู้ใช้ทั่วไป
        // เพื่อไม่ให้เกิด permission-denied และไม่เปิด metadata ที่ไม่จำเป็น
        let disposed = false;
        let unsubReports = () => {};
        let unsubTakedown = () => {};
        const setupAdminListeners = async () => {
            let hasAdminAccess = isAdminUid;
            if (!hasAdminAccess) {
                try {
                    const result = await firebaseUser.getIdTokenResult();
                    hasAdminAccess = result.claims.admin === true;
                } catch (error) {
                    console.warn('Unable to verify admin claim', error);
                }
            }
            if (!hasAdminAccess || disposed) return;

            const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
            unsubReports = onSnapshot(reportsRef, (snap) => {
                const rpts = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp);
                setReports(rpts.slice(0, 200));
            }, (error) => console.error('Reports listener failed', error));

            const takedownRef = collection(db, 'artifacts', appId, 'public', 'data', 'takedown_log');
            unsubTakedown = onSnapshot(takedownRef, (snap) => {
                const logs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.actionAt - a.actionAt);
                setTakedownLog(logs.slice(0, 200));
            }, (error) => console.error('Takedown listener failed', error));
        };
        setupAdminListeners();

        return () => { disposed = true; unsubChat(); unsubTx(); unsubProd(); unsubFees(); unsubBanned(); unsubCol(); unsubTabs(); unsubPayment(); unsubReports(); unsubTakedown(); };
    }, [db, appId, firebaseUser]);

    // ─── Auth helpers ────────────────────────────────────────────────────────

    const signInWithGoogle = useCallback(async () => {
        if (!authRef.current) throw new Error('Auth not ready');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(authRef.current, provider);
        return result.user;
    }, []);

    const sendPhoneOTP = useCallback(async (phoneNumber, containerId) => {
        if (!authRef.current) throw new Error('Auth not ready');
        // clear old verifier if any
        if (window.__rcv) { try { window.__rcv.clear(); } catch { /* verifier already disposed */ } }
        const verifier = new RecaptchaVerifier(authRef.current, containerId, { size: 'invisible' });
        window.__rcv = verifier;
        const confirmation = await signInWithPhoneNumber(authRef.current, phoneNumber, verifier);
        return confirmation;
    }, []);

    const signOutUser = useCallback(async () => {
        if (!authRef.current) return;
        await signOut(authRef.current);
        // fall back to anonymous so Firestore rules still pass
        await signInAnonymously(authRef.current);
    }, []);

    return {
        db, appId, firebaseUser, dbError,
        chatMessages, transactions, shopOrders, products, feeSettings,
        bannedUsers, collections, tabsConfig, paymentConfig, reports, takedownLog,
        signInWithGoogle, sendPhoneOTP, signOutUser,
    };
}

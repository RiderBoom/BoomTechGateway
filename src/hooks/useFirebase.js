import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { FIREBASE_CONFIG, INITIAL_PRODUCTS } from '../constants';

export function useFirebase() {
    const [db, setDb] = useState(null);
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [dbError, setDbError] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [shopOrders, setShopOrders] = useState([]);
    const [products, setProducts] = useState(INITIAL_PRODUCTS);

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    useEffect(() => {
        try {
            let config;
            if (typeof __firebase_config !== 'undefined') {
                config = JSON.parse(__firebase_config);
            } else {
                config = FIREBASE_CONFIG;
            }
            if (!config) return;

            const app = initializeApp(config);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setDb(dbInstance);

            const initAuth = async () => {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(authInstance, __initial_auth_token);
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
        const ONE_HOUR_MS = 60 * 60 * 1000;

        const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'community_chat');
        const unsubChat = onSnapshot(chatRef, (snap) => {
            const cutoff = Date.now() - ONE_HOUR_MS;
            const msgs = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(m => m.timestamp > cutoff)
                .sort((a, b) => a.timestamp - b.timestamp);
            setChatMessages(msgs);
        }, (err) => {
            if (err.code === 'permission-denied')
                setDbError("Permission Denied: โปรดตรวจสอบ Firestore Rules ใน Firebase Console");
        });

        const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
        const unsubTx = onSnapshot(txRef, (snap) => {
            const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(txs.slice(0, 10));
            setShopOrders(txs.filter(t => t.type === 'SHOP_BUY' || t.type === 'SHOP_BUY_QR'));
        });

        const prodRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
        const unsubProd = onSnapshot(prodRef, (snap) => {
            if (!snap.empty) {
                const prods = snap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setProducts(prods);
            }
        });

        return () => { unsubChat(); unsubTx(); unsubProd(); };
    }, [db, appId, firebaseUser]);

    useEffect(() => {
        const interval = setInterval(() => {
            setChatMessages(prev => {
                const cutoff = Date.now() - 60 * 60 * 1000;
                const filtered = prev.filter(m => m.timestamp > cutoff);
                return filtered.length !== prev.length ? filtered : prev;
            });
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    return { db, appId, firebaseUser, dbError, chatMessages, transactions, shopOrders, products };
}

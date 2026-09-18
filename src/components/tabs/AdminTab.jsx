import React, { useState, useEffect } from 'react';
import { Shield, Wallet, ShoppingBag, Copy, ExternalLink, Percent, Save, RefreshCw, UserX, LayoutGrid, CreditCard, Flag, CheckCircle, Trash2, Clock, EyeOff, FileText, AlertTriangle, LogIn, QrCode, XCircle, BadgeCheck } from 'lucide-react';
import { setDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { glassPanel, glassInput, headingFont } from '../../styles';
import { SHOP_WALLET_ADDRESS, ADMIN_WALLETS, ADMIN_FIREBASE_UIDS } from '../../constants';
import TakedownModal from '../TakedownModal';

const TAB_LABELS = {
    wallet:    { label: 'กระเป๋าเงิน', desc: 'Crypto Wallet & Transfer' },
    market:    { label: 'ตลาด',        desc: 'ราคา Crypto Real-time' },
    game:      { label: 'BoomPet',     desc: 'เกม Pet' },
    shop:      { label: 'ร้านค้า',     desc: 'ซื้อสินค้า Crypto' },
    news:      { label: 'ข่าวสาร',     desc: 'ข่าว Crypto' },
    community: { label: 'ชุมชน',       desc: 'แชทชุมชน' },
    donate:    { label: 'บริจาค',      desc: 'รับบริจาค' },
};

const PAYMENT_OPTIONS = [
    { id: 'eth',       label: 'ETH',           desc: 'ชำระด้วย Ethereum หรือ EVM token', badge: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'usdt',      label: 'USDT',          desc: 'ชำระด้วย ERC-20 Stablecoin',       badge: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'promptpay', label: 'PromptPay QR',  desc: 'ชำระด้วยเงินบาทผ่าน QR Code',     badge: 'bg-sky-500/20 text-sky-300' },
];

const timeAgo = (ts) => {
    if (!ts) return '-';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'เมื่อกี้';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชม.ที่แล้ว`;
    return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const STATUS_META = {
    pending:  { label: 'รอตรวจสอบ', cls: 'bg-red-900/40 text-red-300 border-red-500/30' },
    reviewed: { label: 'ตรวจสอบแล้ว', cls: 'bg-yellow-900/30 text-yellow-300 border-yellow-500/20' },
    resolved: { label: 'แก้ไขแล้ว', cls: 'bg-emerald-900/30 text-emerald-300 border-emerald-500/20' },
};

export default function AdminTab({ shopOrders, transactions, account, db, appId, feeSettings, bannedUsers, tabsConfig, paymentConfig, reports = [], chatMessages = [], takedownLog = [], firebaseUser, isFirebaseAdmin, onLoginClick }) {
    const [feePercent, setFeePercent] = useState(0);
    const [feeFixed, setFeeFixed]     = useState(0);
    const [isSavingFee, setIsSavingFee] = useState(false);
    const [feeMsg, setFeeMsg]           = useState("");
    const [isSavingTabs, setIsSavingTabs] = useState(false);
    const [tabsMsg, setTabsMsg]           = useState("");
    const [isSavingPay, setIsSavingPay]   = useState(false);
    const [payMsg, setPayMsg]             = useState("");
    const [reportFilter, setReportFilter] = useState('pending');
    const [takedownTarget, setTakedownTarget] = useState(null);

    useEffect(() => {
        if (feeSettings) {
            setFeePercent(feeSettings.platformFeePercent ?? 0);
            setFeeFixed(feeSettings.platformFeeFixed ?? 0);
        }
    }, [feeSettings]);

    const totalRevenue = shopOrders.reduce((sum, o) => {
        if (o.token === 'ETH') return sum + parseFloat(o.amount || 0);
        return sum;
    }, 0);

    const copy = (text) => { navigator.clipboard.writeText(text); };

    const saveFeeSettings = async () => {
        if (!db) return setFeeMsg("Firebase ไม่พร้อม");
        setIsSavingFee(true);
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'fees'), {
                platformFeePercent: parseFloat(feePercent) || 0,
                platformFeeFixed:   parseFloat(feeFixed) || 0,
            });
            setFeeMsg("บันทึกสำเร็จ ✅");
            setTimeout(() => setFeeMsg(""), 3000);
        } catch (err) { setFeeMsg("Error: " + err.message); }
        finally { setIsSavingFee(false); }
    };

    const toggleTab = async (tabId, currentValue) => {
        if (!db) return;
        const next = currentValue === false ? true : false;
        setIsSavingTabs(true);
        try {
            await setDoc(
                doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'tabs_config'),
                { [tabId]: next },
                { merge: true }
            );
            setTabsMsg(`${TAB_LABELS[tabId]?.label} ${next ? 'เปิด' : 'ปิด'}แล้ว`);
            setTimeout(() => setTabsMsg(""), 2500);
        } catch (err) { setTabsMsg("Error: " + err.message); }
        finally { setIsSavingTabs(false); }
    };

    const togglePayment = async (payId, currentEnabled) => {
        if (!db) return;
        const next = !currentEnabled;
        setIsSavingPay(true);
        try {
            await setDoc(
                doc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'payment_config'),
                { [payId]: next },
                { merge: true }
            );
            const label = PAYMENT_OPTIONS.find(p => p.id === payId)?.label || payId;
            setPayMsg(`${label} ${next ? 'เปิด' : 'ปิด'}แล้ว`);
            setTimeout(() => setPayMsg(""), 2500);
        } catch (err) { setPayMsg("Error: " + err.message); }
        finally { setIsSavingPay(false); }
    };

    const updateReportStatus = async (reportId, status) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', reportId), { status, reviewedBy: account, reviewedAt: Date.now() });
        } catch (err) { console.error('[AdminTab] updateReport:', err.message); }
    };

    const unbanUser = async (id) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'banned_users', id));
        } catch (err) { console.error(err); }
    };

    const confirmPromptPay = async (txId) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', txId), {
                paymentStatus: 'confirmed',
                confirmedBy: account || 'admin',
                confirmedAt: Date.now(),
            });
        } catch (err) { console.error('[AdminTab] confirmPromptPay:', err.message); }
    };

    const rejectPromptPay = async (txId) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', txId), {
                paymentStatus: 'rejected',
                rejectedBy: account || 'admin',
                rejectedAt: Date.now(),
            });
        } catch (err) { console.error('[AdminTab] rejectPromptPay:', err.message); }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-bold text-indigo-300">Admin Dashboard</h3>
                    <p className="text-sm text-slate-400">สำหรับเจ้าของระบบเท่านั้น</p>
                </div>
            </div>

            {/* ── Firebase Auth Status Banner ─────────────────────────────────── */}
            {(() => {
                const uid = firebaseUser?.uid;
                const isAnon = firebaseUser?.isAnonymous;
                const isConfirmed = isFirebaseAdmin; // uid ตรงกับ ADMIN_FIREBASE_UIDS

                if (isConfirmed) {
                    // ✅ UID ถูกต้อง — แสดงสถานะปกติ
                    return (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-emerald-300">Firebase Admin พร้อมใช้งาน</p>
                                <p className="text-[10px] text-slate-500 font-mono truncate">UID: {uid}</p>
                            </div>
                        </div>
                    );
                }

                if (isAnon || !uid) {
                    // ⚠️ Anonymous — ปุ่มจะใช้งานไม่ได้
                    return (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-yellow-300">Firestore ยังไม่ได้รับรองตัวตน Admin</p>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        คุณเข้าระบบในฐานะ <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Anonymous User</span> อยู่{' '}
                                        — Firestore Security Rules บล็อกการเขียนข้อมูลสำหรับ anonymous user
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 font-mono">UID ปัจจุบัน: {uid || '(ไม่มี)'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-xs text-slate-400">
                                    แก้ไข: <span className="text-yellow-300 font-semibold">กด Login ด้วย Google</span> ด้วย account ที่มี UID:
                                </p>
                                <code className="text-[10px] bg-slate-800 text-emerald-300 px-2 py-1 rounded font-mono border border-slate-700">
                                    {ADMIN_FIREBASE_UIDS[0]}
                                </code>
                            </div>
                            {onLoginClick && (
                                <button
                                    onClick={onLoginClick}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all"
                                >
                                    <LogIn className="w-4 h-4" /> เข้าสู่ระบบ Firebase
                                </button>
                            )}
                        </div>
                    );
                }

                // Firebase user มี UID แต่ไม่ใช่ admin UID
                return (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-2">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-300">Firebase UID ไม่ตรงกับ Admin UID</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    UID ปัจจุบัน:{' '}
                                    <span className="font-mono bg-slate-800 text-red-300 px-1.5 py-0.5 rounded">{uid}</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    UID ที่ต้องใช้:{' '}
                                    <span className="font-mono bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded">{ADMIN_FIREBASE_UIDS[0]}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-1.5">
                                    กรุณา Sign out แล้ว Login ใหม่ด้วย Google account ที่ถูกต้อง
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-5 rounded-xl ${glassPanel} flex items-center justify-between`}>
                    <div><p className="text-slate-400 text-xs uppercase mb-1">ออเดอร์ทั้งหมด</p><p className={`text-2xl font-bold text-white ${headingFont}`}>{shopOrders.length}</p></div>
                    <div className="p-3 bg-indigo-500/20 rounded-xl"><ShoppingBag className="w-6 h-6 text-indigo-400"/></div>
                </div>
                <div className={`p-5 rounded-xl ${glassPanel} flex items-center justify-between`}>
                    <div><p className="text-slate-400 text-xs uppercase mb-1">รายรับรวม (ETH)</p><p className={`text-2xl font-bold text-emerald-400 ${headingFont}`}>{totalRevenue.toFixed(4)}</p></div>
                    <div className="p-3 bg-emerald-500/20 rounded-xl"><Wallet className="w-6 h-6 text-emerald-400"/></div>
                </div>
                <div className={`p-5 rounded-xl ${glassPanel} flex items-center justify-between`}>
                    <div><p className="text-slate-400 text-xs uppercase mb-1">Transactions</p><p className={`text-2xl font-bold text-white ${headingFont}`}>{transactions.length}</p></div>
                    <div className="p-3 bg-violet-500/20 rounded-xl"><Shield className="w-6 h-6 text-violet-400"/></div>
                </div>
            </div>

            {/* Fee Settings */}
            <div className={`p-6 rounded-xl ${glassPanel} space-y-4`}>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Percent className="w-5 h-5 text-indigo-400"/> ตั้งค่าค่าธรรมเนียม
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">ค่าธรรมเนียม % (ต่อรายการ)</label>
                        <div className="relative">
                            <input
                                type="number" min="0" max="100" step="0.1"
                                value={feePercent}
                                onChange={(e) => setFeePercent(e.target.value)}
                                className={`w-full rounded-lg px-4 py-2.5 pr-10 text-sm ${glassInput}`}
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400">%</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">ค่าธรรมเนียมคงที่ (ETH)</label>
                        <input
                            type="number" min="0" step="0.0001"
                            value={feeFixed}
                            onChange={(e) => setFeeFixed(e.target.value)}
                            className={`w-full rounded-lg px-4 py-2.5 text-sm ${glassInput}`}
                        />
                    </div>
                </div>

                <div className={`px-4 py-3 rounded-lg bg-indigo-950/30 border border-indigo-500/10 text-sm text-slate-300`}>
                    ปัจจุบัน:{" "}
                    {(parseFloat(feePercent) || 0) === 0 && (parseFloat(feeFixed) || 0) === 0
                        ? <span className="text-emerald-400 font-bold">ฟรี 0%</span>
                        : <span className="text-yellow-400 font-bold">{feePercent}% + {feeFixed} ETH ต่อรายการ</span>
                    }
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={saveFeeSettings} disabled={isSavingFee || !db} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all">
                        {isSavingFee ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        บันทึก
                    </button>
                    {feeMsg && <span className={`text-sm ${feeMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{feeMsg}</span>}
                </div>
                <p className="text-xs text-slate-500">ตั้งค่าทั้งคู่เป็น 0 = ไม่เก็บค่าธรรมเนียม (ลูกค้าจ่ายเฉพาะ Gas)</p>
            </div>

            {/* Tab Visibility Control */}
            <div className={`p-6 rounded-xl ${glassPanel} space-y-4`}>
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-violet-400"/> ควบคุมแถบเมนู
                    </h3>
                    {tabsMsg && (
                        <span className={`text-sm ${tabsMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tabsMsg}
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500">เปิด/ปิดแถบเมนูที่ผู้ใช้ทั่วไปจะเห็น (Admin เห็นครบเสมอ)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(TAB_LABELS).map(([id, { label, desc }]) => {
                        const enabled = tabsConfig ? tabsConfig[id] !== false : true;
                        return (
                            <div
                                key={id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                    enabled
                                        ? 'bg-indigo-950/30 border-indigo-500/20'
                                        : 'bg-slate-900/30 border-slate-700/30'
                                }`}
                            >
                                <div>
                                    <p className={`text-sm font-semibold ${enabled ? 'text-white' : 'text-slate-500'}`}>{label}</p>
                                    <p className="text-xs text-slate-600">{desc}</p>
                                </div>
                                <button
                                    onClick={() => toggleTab(id, enabled ? true : false)}
                                    disabled={isSavingTabs}
                                    className={`relative w-12 h-6 rounded-full transition-all duration-200 focus:outline-none disabled:opacity-50 ${
                                        enabled ? 'bg-indigo-600' : 'bg-slate-700'
                                    }`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                                        enabled ? 'left-7' : 'left-1'
                                    }`} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payment Methods Control */}
            <div className={`p-6 rounded-xl ${glassPanel} space-y-4`}>
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-400"/> ช่องทางชำระเงิน
                    </h3>
                    {payMsg && (
                        <span className={`text-sm ${payMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                            {payMsg}
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500">เลือกช่องทางที่ต้องการให้ลูกค้าชำระเงินได้ในร้านค้า</p>
                <div className="space-y-3">
                    {PAYMENT_OPTIONS.map(({ id, label, desc, badge }) => {
                        const enabled = paymentConfig ? paymentConfig[id] !== false : true;
                        return (
                            <div key={id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${enabled ? 'bg-indigo-950/30 border-indigo-500/20' : 'bg-slate-900/30 border-slate-700/30'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${badge}`}>{label}</span>
                                    <p className={`text-sm ${enabled ? 'text-slate-300' : 'text-slate-600'}`}>{desc}</p>
                                </div>
                                <button
                                    onClick={() => togglePayment(id, enabled)}
                                    disabled={isSavingPay}
                                    className={`relative w-12 h-6 rounded-full transition-all duration-200 focus:outline-none disabled:opacity-50 ${enabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${enabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-slate-600">* ต้องเปิดอย่างน้อย 1 ช่องทาง มิฉะนั้นลูกค้าจะชำระเงินไม่ได้</p>
            </div>

            {/* Wallet Addresses */}
            <div className={`p-6 rounded-xl ${glassPanel} space-y-4`}>
                <h3 className="font-bold text-white text-lg">กระเป๋าเงิน Treasury</h3>
                {[
                    { label: "Admin / Treasury Wallet", address: SHOP_WALLET_ADDRESS, color: "text-indigo-300" },
                    ...(account ? [{ label: "กระเป๋าที่เชื่อมต่ออยู่", address: account, color: "text-cyan-400" }] : []),
                ].map(({ label, address, color }) => (
                    <div key={address} className="bg-slate-950/50 p-4 rounded-xl border border-indigo-500/10">
                        <p className="text-xs text-slate-500 mb-2">{label}</p>
                        <div className="flex items-center gap-2">
                            <code className={`flex-1 font-mono text-sm ${color} break-all`}>{address}</code>
                            <button onClick={() => copy(address)} className="p-2 rounded-lg hover:bg-indigo-500/10 text-slate-400 hover:text-white shrink-0"><Copy className="w-4 h-4"/></button>
                            <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-indigo-500/10 text-slate-400 hover:text-white shrink-0"><ExternalLink className="w-4 h-4"/></a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Banned Users */}
            {bannedUsers && bannedUsers.length > 0 && (
                <div className={`p-6 rounded-xl ${glassPanel}`}>
                    <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                        <UserX className="w-5 h-5 text-red-400"/> ผู้ใช้ที่ถูกแบน ({bannedUsers.length})
                    </h3>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {bannedUsers.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-3 bg-red-900/10 border border-red-500/20 rounded-xl">
                                <div>
                                    <p className="text-red-300 font-mono text-sm">{u.senderName || u.id}</p>
                                    <p className="text-xs text-slate-500 font-mono">{u.id}</p>
                                    {u.bannedAt && <p className="text-xs text-slate-600">{new Date(u.bannedAt).toLocaleString('th-TH')}</p>}
                                </div>
                                <button onClick={() => unbanUser(u.id)} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                                    ปลดแบน
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reports */}
            <div className={`p-6 rounded-xl ${glassPanel}`}>
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2 shrink-0">
                        <Flag className="w-5 h-5 text-red-400"/>
                        รายงานความไม่เหมาะสม
                        {reports.filter(r => r.status === 'pending').length > 0 && (
                            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                                {reports.filter(r => r.status === 'pending').length} รอตรวจสอบ
                            </span>
                        )}
                    </h3>
                    <select
                        value={reportFilter}
                        onChange={(e) => setReportFilter(e.target.value)}
                        className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                    >
                        <option value="all">ทั้งหมด ({reports.length})</option>
                        <option value="pending">รอตรวจสอบ ({reports.filter(r => r.status === 'pending').length})</option>
                        <option value="reviewed">ตรวจสอบแล้ว ({reports.filter(r => r.status === 'reviewed').length})</option>
                        <option value="resolved">แก้ไขแล้ว ({reports.filter(r => r.status === 'resolved').length})</option>
                    </select>
                </div>
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {reports.length === 0 ? (
                        <div className="text-center py-10 text-slate-600">
                            <Flag className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                            <p className="text-sm">ยังไม่มีรายงาน</p>
                        </div>
                    ) : (() => {
                        const filtered = reportFilter === 'all' ? reports : reports.filter(r => r.status === reportFilter);
                        if (filtered.length === 0) return <p className="text-slate-500 text-sm text-center py-6">ไม่มีรายงานในหมวดนี้</p>;
                        return filtered.map(r => {
                            const sm = STATUS_META[r.status] || STATUS_META.pending;
                            return (
                                <div key={r.id} className="bg-slate-950/60 border border-red-500/10 rounded-xl p-4 space-y-3">
                                    {/* Report meta */}
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sm.cls}`}>
                                                {sm.label}
                                            </span>
                                            <span className="text-xs font-bold text-red-300 bg-red-900/30 px-2 py-0.5 rounded-full border border-red-500/20">
                                                {r.reasonLabel || r.reason}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-600 flex items-center gap-1 shrink-0">
                                            <Clock className="w-3 h-3"/> {timeAgo(r.timestamp)}
                                        </span>
                                    </div>

                                    {/* Reporter */}
                                    <p className="text-[10px] text-slate-500">
                                        รายงานโดย: <span className="font-mono text-slate-400">{r.reportedBy || 'Guest'}</span>
                                    </p>

                                    {/* Content preview */}
                                    {r.targetContent && (
                                        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                                            <p className="text-[10px] text-slate-500 mb-1">
                                                เนื้อหาที่ถูกรายงาน
                                                {r.targetSender && r.targetSender !== '-' && (
                                                    <span> · โดย <span className="font-mono text-slate-400">{r.targetSender}</span></span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-300 break-all line-clamp-3 leading-relaxed">{r.targetContent}</p>
                                        </div>
                                    )}

                                    {/* Details */}
                                    {r.details && (
                                        <p className="text-xs text-slate-400 italic">
                                            <span className="not-italic text-slate-500 font-medium">หมายเหตุ: </span>{r.details}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    {r.status === 'pending' && (
                                        <div className="flex gap-2 pt-1 flex-wrap">
                                            <button
                                                onClick={() => updateReportStatus(r.id, 'reviewed')}
                                                className="flex items-center gap-1.5 text-xs bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5"/> ตรวจสอบแล้ว
                                            </button>
                                            {r.targetId && (
                                                <>
                                                    <button
                                                        onClick={() => setTakedownTarget({
                                                            content: { id: r.targetId, contentType: r.targetType || 'chat_message', text: r.targetContent, sender: r.targetSender, walletAddress: r.targetWallet },
                                                            action: 'hide',
                                                            reportId: r.id,
                                                        })}
                                                        className="flex items-center gap-1.5 text-xs bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <EyeOff className="w-3.5 h-3.5"/> ซ่อนทันที
                                                    </button>
                                                    <button
                                                        onClick={() => setTakedownTarget({
                                                            content: { id: r.targetId, contentType: r.targetType || 'chat_message', text: r.targetContent, sender: r.targetSender, walletAddress: r.targetWallet },
                                                            action: 'delete',
                                                            reportId: r.id,
                                                        })}
                                                        className="flex items-center gap-1.5 text-xs bg-red-900/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5"/> ลบถาวร
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {r.status === 'reviewed' && (
                                        <div className="flex gap-2 pt-1 flex-wrap">
                                            <button
                                                onClick={() => updateReportStatus(r.id, 'resolved')}
                                                className="flex items-center gap-1.5 text-xs bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5"/> ทำเครื่องหมายแก้ไขแล้ว
                                            </button>
                                            {r.targetId && (
                                                <>
                                                    <button
                                                        onClick={() => setTakedownTarget({
                                                            content: { id: r.targetId, contentType: r.targetType || 'chat_message', text: r.targetContent, sender: r.targetSender, walletAddress: r.targetWallet },
                                                            action: 'hide',
                                                            reportId: r.id,
                                                        })}
                                                        className="flex items-center gap-1.5 text-xs bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <EyeOff className="w-3.5 h-3.5"/> ซ่อนทันที
                                                    </button>
                                                    <button
                                                        onClick={() => setTakedownTarget({
                                                            content: { id: r.targetId, contentType: r.targetType || 'chat_message', text: r.targetContent, sender: r.targetSender, walletAddress: r.targetWallet },
                                                            action: 'delete',
                                                            reportId: r.id,
                                                        })}
                                                        className="flex items-center gap-1.5 text-xs bg-red-900/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5"/> ลบถาวร
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Take-down Center */}
            <div className={`p-6 rounded-xl ${glassPanel} space-y-4`}>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <EyeOff className="w-5 h-5 text-yellow-400"/> Take-down Center
                </h3>

                {/* Hidden messages */}
                {(() => {
                    const hidden = chatMessages.filter(m => m.contentStatus === 'hidden');
                    if (hidden.length === 0) return (
                        <p className="text-slate-600 text-sm py-2">ไม่มีข้อความที่ซ่อนอยู่</p>
                    );
                    return (
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">
                                ข้อความที่ซ่อนอยู่ ({hidden.length})
                            </p>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {hidden.map(m => (
                                    <div key={m.id} className="flex items-start gap-3 bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-mono text-yellow-400 mb-0.5">{m.sender}</p>
                                            <p className="text-xs text-slate-400 break-all line-clamp-2">{m.text || '(รูปภาพ)'}</p>
                                            <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(m.takedownAt || m.timestamp)}</p>
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            <button
                                                onClick={() => setTakedownTarget({
                                                    content: { id: m.id, contentType: 'chat_message', text: m.text, sender: m.sender, walletAddress: m.walletAddress },
                                                    action: 'delete',
                                                    reportId: null,
                                                })}
                                                className="flex items-center gap-1 text-[10px] bg-red-900/40 hover:bg-red-900/60 text-red-300 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3"/> ลบถาวร
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Audit Log */}
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3 h-3"/> Audit Log ({takedownLog.length})
                    </p>
                    {takedownLog.length === 0 ? (
                        <p className="text-slate-600 text-sm py-2">ยังไม่มีประวัติการดำเนินการ</p>
                    ) : (
                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {takedownLog.map(log => (
                                <div key={log.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${log.action === 'delete' ? 'bg-red-900/30' : log.action === 'hide' ? 'bg-yellow-900/30' : 'bg-emerald-900/30'}`}>
                                        {log.action === 'delete'
                                            ? <Trash2 className="w-3 h-3 text-red-400"/>
                                            : log.action === 'hide'
                                                ? <EyeOff className="w-3 h-3 text-yellow-400"/>
                                                : <CheckCircle className="w-3 h-3 text-emerald-400"/>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.action === 'delete' ? 'bg-red-900/40 text-red-300' : log.action === 'hide' ? 'bg-yellow-900/40 text-yellow-300' : 'bg-emerald-900/40 text-emerald-300'}`}>
                                                {log.action === 'delete' ? 'ลบถาวร' : log.action === 'hide' ? 'ซ่อน' : 'คืนสถานะ'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono truncate">{log.contentSender || '-'}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{log.legalReasonLabel || log.legalReason}</p>
                                        {log.note && <p className="text-[10px] text-slate-500 italic truncate">{log.note}</p>}
                                        <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(log.actionAt)} · โดย <span className="font-mono">{log.actionBy ? `${log.actionBy.slice(0, 6)}...${log.actionBy.slice(-4)}` : 'admin'}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Pending PromptPay Orders ──────────────────────────────────── */}
            {(() => {
                const pending = transactions.filter(t =>
                    (t.type === 'SHOP_BUY_QR' || t.type === 'DONATE_PROMPTPAY') &&
                    t.paymentStatus === 'pending_verification'
                );
                if (pending.length === 0) return null;
                return (
                    <div className={`p-6 rounded-xl border border-sky-500/30 bg-sky-900/5 ${glassPanel} space-y-4`}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <h3 className="font-bold text-sky-300 text-lg flex items-center gap-2 shrink-0">
                                <QrCode className="w-5 h-5 text-sky-400"/>
                                รอยืนยัน PromptPay
                                <span className="text-xs bg-sky-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                                    {pending.length} รายการ
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                ตรวจสอบสลิปโอนเงินของลูกค้า แล้วกด ยืนยัน หรือ ปฏิเสธ
                            </p>
                        </div>

                        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                            {pending.map(o => (
                                <div key={o.id} className="bg-slate-950/70 border border-sky-500/20 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-start gap-2 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-900/40 text-sky-300 border border-sky-500/20">
                                                    {o.type === 'DONATE_PROMPTPAY' ? '💝 บริจาค' : '🛒 ซื้อสินค้า'}
                                                </span>
                                                <span className="text-xs font-bold text-white font-mono">
                                                    ฿{parseFloat(o.amount || 0).toLocaleString('th-TH')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1.5 font-mono break-all">
                                                จาก: {o.from || 'Guest'}
                                            </p>
                                            {o.uid && (
                                                <p className="text-[10px] text-slate-600 font-mono">
                                                    UID: {o.uid}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3"/> {timeAgo(o.timestamp)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => confirmPromptPay(o.id)}
                                                className="flex items-center gap-1.5 text-xs bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-500/30 text-emerald-300 px-3 py-2 rounded-xl font-bold transition-all active:scale-95"
                                            >
                                                <BadgeCheck className="w-4 h-4"/> ยืนยัน
                                            </button>
                                            <button
                                                onClick={() => rejectPromptPay(o.id)}
                                                className="flex items-center gap-1.5 text-xs bg-red-900/30 hover:bg-red-900/60 border border-red-500/20 text-red-300 px-3 py-2 rounded-xl font-bold transition-all active:scale-95"
                                            >
                                                <XCircle className="w-4 h-4"/> ปฏิเสธ
                                            </button>
                                        </div>
                                    </div>

                                    {/* ที่อยู่จัดส่ง (เฉพาะ SHOP_BUY_QR) */}
                                    {o.shippingAddress && (
                                        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-2.5">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ที่อยู่จัดส่ง</p>
                                            <p className="text-xs text-slate-300 whitespace-pre-wrap">{o.shippingAddress}</p>
                                        </div>
                                    )}

                                    {/* รายการสินค้า */}
                                    {o.details && (
                                        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">รายการ</p>
                                            <p className="text-xs text-slate-400 break-all">{o.details}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <p className="text-[10px] text-slate-600 leading-relaxed">
                            ⚠️ กรุณาตรวจสอบการโอนเงินจริงในแอปธนาคาร หรือ Statement ก่อนกด "ยืนยัน" ทุกครั้ง
                            — ระบบไม่สามารถยืนยันอัตโนมัติได้ (PromptPay ไม่มี webhook API สาธารณะ)
                        </p>
                    </div>
                );
            })()}

            {/* Recent Orders */}
            <div className={`p-6 rounded-xl ${glassPanel}`}>
                <h3 className="font-bold text-white text-lg mb-4">ออเดอร์ล่าสุด</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                    {shopOrders.length === 0 && <p className="text-slate-500 text-sm text-center py-6">ยังไม่มีออเดอร์</p>}
                    {shopOrders.map(o => (
                        <div key={o.id} className="bg-slate-950 p-4 rounded-xl border border-indigo-500/10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white font-bold text-sm">{o.details || "Order"}</p>
                                    <p className="text-xs text-slate-500">จาก: {o.from}</p>
                                    <p className="text-xs text-slate-500">{new Date(o.timestamp).toLocaleString('th-TH')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-400 font-bold">{o.amount} {o.token}</p>
                                    {o.paymentStatus === 'pending_verification'
                                        ? <span className="text-[10px] bg-sky-900/50 text-sky-300 px-2 py-0.5 rounded border border-sky-800">รอยืนยัน</span>
                                        : o.paymentStatus === 'rejected'
                                            ? <span className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-800">ปฏิเสธ</span>
                                            : <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">Paid</span>
                                    }
                                </div>
                            </div>
                            {o.shippingAddress && (
                                <div className="mt-2 bg-slate-900 p-2 rounded border border-slate-700 text-xs text-slate-300 whitespace-pre-wrap">{o.shippingAddress}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {takedownTarget && (
                <TakedownModal
                    db={db}
                    appId={appId}
                    account={account}
                    content={takedownTarget.content}
                    action={takedownTarget.action}
                    reportId={takedownTarget.reportId}
                    onClose={() => setTakedownTarget(null)}
                    onSuccess={() => setTakedownTarget(null)}
                />
            )}
        </div>
    );
}

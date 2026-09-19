import React, { useState, useEffect, useRef, useCallback, lazy, Suspense, Component } from 'react';
import { useFirebase } from './hooks/useFirebase';
import { useWallet } from './hooks/useWallet';
import { useMarket } from './hooks/useMarket';
import { usePet } from './hooks/usePet';
import Header from './components/Header';
import TabBar from './components/TabBar';
import AiChatbot from './components/AiChatbot';
import CookieConsentBanner from './components/CookieConsentBanner';
import AuthModal from './components/AuthModal';
import LegalModal from './components/LegalModal';
import SandboxBanner from './components/SandboxBanner';
import { useCookieConsent } from './hooks/useCookieConsent';
import { useAccessLog } from './hooks/useAccessLog';
import { requestAdminClaim, hasAdminClaim } from './utils/adminClaim';
import { ADMIN_FIREBASE_UIDS, SANDBOX_MODE } from './constants';
import { bodyFont } from './styles';

const TAB_TITLES = {
    wallet:    'กระเป๋าเงิน Crypto | BoomTech Gateway',
    market:    'ตลาด Crypto Real-time | BoomTech Gateway',
    game:      'BoomPet Game | BoomTech Gateway',
    shop:      'ร้านค้า Crypto | BoomTech Gateway',
    news:      'ข่าว Crypto | BoomTech Gateway',
    community: 'ชุมชน | BoomTech Gateway',
    donate:    'บริจาค | BoomTech Gateway',
    admin:     'Admin Panel | BoomTech Gateway',
};

class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error('[BoomTech ErrorBoundary]', error, info); }
    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="text-4xl">⚠️</div>
                <p className="text-slate-300 font-semibold">เกิดข้อผิดพลาดในส่วนนี้</p>
                <p className="text-slate-500 text-sm max-w-sm">{this.state.error?.message}</p>
                <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        );
    }
}

const WalletTab    = lazy(() => import('./components/tabs/WalletTab'));
const MarketTab    = lazy(() => import('./components/tabs/MarketTab'));
const GameTab      = lazy(() => import('./components/tabs/GameTab'));
const ShopTab      = lazy(() => import('./components/tabs/ShopTab'));
const NewsTab      = lazy(() => import('./components/tabs/NewsTab'));
const CommunityTab = lazy(() => import('./components/tabs/CommunityTab'));
const DonateTab    = lazy(() => import('./components/tabs/DonateTab'));
const AdminTab     = lazy(() => import('./components/tabs/AdminTab'));

const TabLoader = () => (
    <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

const STORAGE_TAB_KEY = 'boomtech_active_tab';

const App = () => {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem(STORAGE_TAB_KEY) || 'shop');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [statusType, setStatusType] = useState("info");
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [legalModal, setLegalModal] = useState(null); // 'privacy' | 'terms' | null
    const [hasFirebaseAdminClaim, setHasFirebaseAdminClaim] = useState(false);

    const showStatus = useCallback((msg, type = "info") => {
        const safe = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
        setStatusMsg(safe); setStatusType(type);
        setTimeout(() => setStatusMsg(""), type === "error" ? 8000 : 5000);
    }, []);

    const handleSetActiveTab = useCallback((tab) => {
        localStorage.setItem(STORAGE_TAB_KEY, tab);
        setActiveTab(tab);
        document.title = TAB_TITLES[tab] || 'BoomTech Gateway';
    }, []);

    const cookieConsent = useCookieConsent();

    const { db, appId, firebaseUser, dbError, chatMessages, transactions, shopOrders, products, feeSettings, bannedUsers, collections, tabsConfig, paymentConfig, reports, takedownLog, signInWithGoogle, sendPhoneOTP, signOutUser } = useFirebase();
    const { ethersLib, provider, signer, account, balance, setBalance, isOwner, connectWallet, chainId, switchChain } = useWallet(showStatus);

    // รวม admin จากทั้ง wallet address และ Firebase UID
    const isFirebaseAdmin = !!firebaseUser && ADMIN_FIREBASE_UIDS.includes(firebaseUser.uid);
    const hasFirebaseAdminAccess = isFirebaseAdmin || hasFirebaseAdminClaim;
    const isAdmin = isOwner || hasFirebaseAdminAccess;
    const market = useMarket(activeTab);
    const { pet, gameScore, handleAction, handleFaucet } = usePet(account, showStatus);
    useAccessLog(appId, account, activeTab, cookieConsent.consent.analytics);

    // ── Admin Firestore Auth ─────────────────────────────────────────────────
    // Flow: MetaMask wallet เชื่อมต่อ (isOwner) → ขอ signature → POST /api/set-admin-claim
    //       → Firebase Custom Claim admin:true ถูก set → Firestore ยอมรับทุก write
    //
    // Fallback: ถ้า API ล้มเหลว หรือ user reject MetaMask → แสดง login modal แทน
    const adminClaimAttempted = useRef(false);

    // Custom claims are issued server-side and live in the Firebase ID token.
    // Read the current token so the Admin panel reflects the real Firestore access state.
    useEffect(() => {
        let active = true;
        if (!firebaseUser) {
            setHasFirebaseAdminClaim(false);
            return () => { active = false; };
        }

        hasAdminClaim(firebaseUser)
            .then(hasClaim => { if (active) setHasFirebaseAdminClaim(hasClaim); })
            .catch(() => { if (active) setHasFirebaseAdminClaim(false); });

        return () => { active = false; };
    }, [firebaseUser]);

    useEffect(() => {
        if (!isOwner || !firebaseUser || !provider) return;

        // ถ้า Firebase UID ตรงกับ allowlist แล้ว — ไม่ต้องขอ claim
        if (isFirebaseAdmin) return;

        // ป้องกันการเรียกซ้ำในรอบเดียวกัน
        if (adminClaimAttempted.current) return;
        adminClaimAttempted.current = true;

        hasAdminClaim(firebaseUser).then(already => {
            if (already) return; // มี claim แล้ว ✅

            showStatus('Wallet Admin พบแล้ว — กรุณายืนยันใน MetaMask...', 'info');

            requestAdminClaim(provider, account, firebaseUser)
                .then(() => {
                    setHasFirebaseAdminClaim(true);
                    showStatus('Admin พร้อมใช้งาน ✅ — Firestore สิทธิ์เต็ม', 'success');
                })
                .catch(err => {
                    adminClaimAttempted.current = false; // อนุญาตให้ลองใหม่
                    if (err.message?.includes('user rejected')) {
                        // user กด reject MetaMask → fallback login modal
                        showStatus('ยกเลิกการยืนยัน — กรุณา Login ด้วย Firebase แทน', 'error');
                        setShowAuthModal(true);
                    } else {
                        // API error หรือ network error → fallback login modal
                        showStatus('Admin Claim ล้มเหลว — กรุณา Login ด้วย Firebase แทน', 'error');
                        setShowAuthModal(true);
                    }
                });
        }).catch(() => { adminClaimAttempted.current = false; });
    }, [account, firebaseUser, isFirebaseAdmin, isOwner, provider, showStatus]);

    // Auto-switch ถ้า tab ที่เปิดอยู่ถูก admin ปิด
    useEffect(() => {
        if (activeTab === 'admin') return;
        if (tabsConfig[activeTab] === false) {
            const fallback = ['shop', 'market', 'wallet', 'game', 'news', 'community', 'donate']
                .find(t => tabsConfig[t] !== false) || 'shop';
            handleSetActiveTab(fallback);
        }
    }, [activeTab, handleSetActiveTab, tabsConfig]);

    const tabProps = { db, appId, firebaseUser, account, signer, ethersLib, provider, isLoading, setIsLoading, showStatus };

    return (
        <div className={`min-h-screen ${bodyFont} bg-[#060c18] text-slate-200 relative`}>
            {SANDBOX_MODE && <SandboxBanner />}
            <div className="p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6 relative z-10">
                <Header account={account} balance={balance} isOwner={isAdmin} connectWallet={connectWallet} chainId={chainId} firebaseUser={firebaseUser} onLoginClick={() => setShowAuthModal(true)} signOutUser={signOutUser} />

                <div className="rounded-2xl overflow-hidden relative bg-indigo-950/20 backdrop-blur-xl border border-indigo-500/10 shadow-2xl shadow-indigo-900/20">
                    <TabBar activeTab={activeTab} setActiveTab={handleSetActiveTab} isOwner={isAdmin} tabsConfig={tabsConfig} />

                    <div className="p-6 md:p-8">
                        <ErrorBoundary>
                        <Suspense fallback={<TabLoader />}>
                            {activeTab === 'wallet'    && <WalletTab {...tabProps} balance={balance} setBalance={setBalance} transactions={transactions} chainId={chainId} switchChain={switchChain} feeSettings={feeSettings} />}
                            {activeTab === 'market'    && <MarketTab {...market} />}
                            {activeTab === 'game'      && <GameTab pet={pet} gameScore={gameScore} handleAction={handleAction} handleFaucet={handleFaucet} />}
                            {activeTab === 'shop'      && <ShopTab {...tabProps} balance={balance} ethUsdPrice={market.ethUsdPrice} transactions={transactions} shopOrders={shopOrders} isOwner={isAdmin} products={products} collections={collections} paymentConfig={paymentConfig} />}
                            {activeTab === 'news'      && <NewsTab />}
                            {activeTab === 'community' && <CommunityTab {...tabProps} dbError={dbError} chatMessages={chatMessages} isOwner={isAdmin} bannedUsers={bannedUsers} />}
                            {activeTab === 'donate'    && <DonateTab {...tabProps} />}
                            {activeTab === 'admin'     && <AdminTab shopOrders={shopOrders} transactions={transactions} account={account} db={db} appId={appId} feeSettings={feeSettings} bannedUsers={bannedUsers} tabsConfig={tabsConfig} paymentConfig={paymentConfig} reports={reports} chatMessages={chatMessages} takedownLog={takedownLog} firebaseUser={firebaseUser} isFirebaseAdmin={hasFirebaseAdminAccess} onLoginClick={() => setShowAuthModal(true)} />}
                        </Suspense>
                        </ErrorBoundary>

                        {statusMsg && (
                            <div className={`mt-6 p-4 rounded-xl border text-center ${statusType === 'error' ? 'bg-red-900/20 border-red-900/50 text-red-400' : statusType === 'success' ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-indigo-900/20 border-indigo-900/50 text-indigo-300'}`}>
                                <span className="font-medium">{statusMsg}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto mt-6 pb-4 space-y-3">
                {/* Sandbox disclaimer — แสดงเฉพาะ Sandbox mode */}
                {SANDBOX_MODE && (
                    <div className="text-center px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                        <p className="text-[11px] text-amber-700/80 leading-relaxed">
                            ⚗️ <strong>ระบบทดสอบ (Sandbox)</strong> — เว็บไซต์นี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการทดสอบระบบและพัฒนาซอฟต์แวร์เท่านั้น
                            ข้อมูลและธุรกรรมทั้งหมดในระบบเป็นสิ่งสมมุติ ไม่มีการเรียกเก็บค่าใช้จ่ายใดๆ จากผู้ใช้งานจริง
                        </p>
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600">
                    <span>© 2568 BoomTech Gateway</span>
                    <button onClick={() => setLegalModal('privacy')} className="hover:text-slate-400 transition-colors">นโยบายความเป็นส่วนตัว</button>
                    <button onClick={() => setLegalModal('terms')} className="hover:text-slate-400 transition-colors">ข้อกำหนดการใช้งาน</button>
                    <span className="text-slate-700">|</span>
                    <span className="text-yellow-700/70">⚠ ไม่ใช่คำแนะนำการลงทุน</span>
                    {SANDBOX_MODE && <span className="text-amber-700/70 font-semibold">🧪 Sandbox Mode</span>}
                </div>
            </footer>

            <AiChatbot coinSymbol={market.coinSymbol} currentPrice={market.currentPrice} priceChange={market.priceChange} marketStats={market.marketStats} fearGreed={market.fearGreed} />

            <CookieConsentBanner {...cookieConsent} />

            {showAuthModal && (
                <AuthModal
                    onClose={() => setShowAuthModal(false)}
                    signInWithGoogle={signInWithGoogle}
                    sendPhoneOTP={sendPhoneOTP}
                />
            )}

            {legalModal && (
                <LegalModal mode={legalModal} onClose={() => setLegalModal(null)}/>
            )}
            </div>{/* end p-4 md:p-8 */}
        </div>
    );
};

export default App;

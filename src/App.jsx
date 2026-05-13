import React, { useState } from 'react';
import { useFirebase } from './hooks/useFirebase';
import { useWallet } from './hooks/useWallet';
import { useMarket } from './hooks/useMarket';
import { usePet } from './hooks/usePet';
import Header from './components/Header';
import TabBar from './components/TabBar';
import AiChatbot from './components/AiChatbot';
import WalletTab from './components/tabs/WalletTab';
import MarketTab from './components/tabs/MarketTab';
import GameTab from './components/tabs/GameTab';
import ShopTab from './components/tabs/ShopTab';
import NewsTab from './components/tabs/NewsTab';
import CommunityTab from './components/tabs/CommunityTab';
import DonateTab from './components/tabs/DonateTab';
import AdminTab from './components/tabs/AdminTab';
import { glassPanel, bodyFont } from './styles';
import { DEFAULT_CONTRACT_ADDRESS } from './constants';

const App = () => {
    const [activeTab, setActiveTab] = useState("shop");
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [statusType, setStatusType] = useState("info");
    const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);

    const showStatus = (msg, type = "info") => {
        const safe = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
        setStatusMsg(safe); setStatusType(type);
        if (type === "success") setTimeout(() => setStatusMsg(""), 5000);
    };

    const { db, appId, firebaseUser, dbError, chatMessages, transactions, shopOrders, products } = useFirebase();
    const { ethersLib, provider, signer, account, balance, setBalance, isOwner, connectWallet, chainId, switchChain } = useWallet(showStatus);
    const market = useMarket(activeTab);
    const { pet, gameScore, handleAction, handleFaucet } = usePet(account, showStatus);

    const tabProps = { db, appId, firebaseUser, account, signer, ethersLib, provider, isLoading, setIsLoading, showStatus };

    return (
        <div className={`min-h-screen ${bodyFont} bg-[#020617] text-slate-200 p-4 md:p-8 relative`}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 15% 50%, rgba(6, 182, 212, 0.12) 0%, transparent 25%), radial-gradient(circle at 85% 30%, rgba(99, 102, 241, 0.12) 0%, transparent 25%)' }}></div>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

            <div className="max-w-6xl mx-auto space-y-6 relative z-10">
                <Header account={account} balance={balance} isOwner={isOwner} connectWallet={connectWallet} chainId={chainId} />

                {isOwner && (
                    <div className={`p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center ${glassPanel}`}>
                        <div className="flex-1 w-full">
                            <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider">Smart Contract Address</label>
                            <input type="text" placeholder="0x..." value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} className="w-full rounded-lg px-4 py-2 font-mono text-sm bg-slate-950/50 border border-white/10 focus:border-cyan-500/50 outline-none text-slate-200" />
                        </div>
                    </div>
                )}

                <div className={`rounded-2xl overflow-hidden relative ${glassPanel}`}>
                    <TabBar activeTab={activeTab} setActiveTab={setActiveTab} isOwner={isOwner} />

                    <div className="p-6 md:p-8">
                        {activeTab === 'wallet' && <WalletTab {...tabProps} balance={balance} setBalance={setBalance} transactions={transactions} contractAddress={contractAddress} chainId={chainId} switchChain={switchChain} />}
                        {activeTab === 'market' && <MarketTab {...market} />}
                        {activeTab === 'game' && <GameTab pet={pet} gameScore={gameScore} handleAction={handleAction} handleFaucet={handleFaucet} />}
                        {activeTab === 'shop' && <ShopTab {...tabProps} balance={balance} currentPrice={market.currentPrice} transactions={transactions} shopOrders={shopOrders} isOwner={isOwner} products={products} contractAddress={contractAddress} />}
                        {activeTab === 'news' && <NewsTab />}
                        {activeTab === 'community' && <CommunityTab {...tabProps} dbError={dbError} chatMessages={chatMessages} />}
                        {activeTab === 'donate' && <DonateTab {...tabProps} contractAddress={contractAddress} />}
                        {activeTab === 'admin' && <AdminTab contractAddress={contractAddress} signer={signer} ethersLib={ethersLib} isLoading={isLoading} setIsLoading={setIsLoading} showStatus={showStatus} />}

                        {statusMsg && (
                            <div className={`mt-6 p-4 rounded-xl border text-center animate-pulse ${statusType === 'error' ? 'bg-red-900/20 border-red-900/50 text-red-400' : statusType === 'success' ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-blue-900/20 border-blue-900/50 text-blue-400'}`}>
                                <span className="font-medium">{statusMsg}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AiChatbot coinSymbol={market.coinSymbol} currentPrice={market.currentPrice} priceChange={market.priceChange} marketStats={market.marketStats} fearGreed={market.fearGreed} />
        </div>
    );
};

export default App;

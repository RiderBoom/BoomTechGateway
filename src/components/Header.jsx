import React from 'react';
import { Wallet, Shield, LogOut } from 'lucide-react';
import { glassPanel, headingFont } from '../styles';

export default function Header({ account, balance, isOwner, connectWallet }) {
    return (
        <div className={`flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl ${glassPanel}`}>
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative w-14 h-14 bg-slate-900 rounded-xl border border-slate-700/50 flex items-center justify-center shadow-2xl overflow-hidden group-hover:border-cyan-500/50 transition-colors">
                        <svg viewBox="0 0 64 64" className="w-9 h-9 transform group-hover:scale-110 transition-transform duration-300" fill="none">
                            <path d="M8 12 h 48 v 12 h -48 z" fill="url(#logo-grad)" opacity="0.7"/>
                            <path d="M4 18 h 56 c 2.2 0 4 1.8 4 4 v 32 c 0 2.2 -1.8 4 -4 4 h -56 c -2.2 0 -4 -1.8 -4 -4 v -32 c 0 -2.2 1.8 -4 4 -4 z" fill="url(#logo-grad)" />
                            <path d="M4 26 h 56" stroke="#0f172a" strokeWidth="2" opacity="0.3" />
                            <path d="M46 32 h 14 v 12 h -14 c -3.3 0 -6 -2.7 -6 -6 s 2.7 -6 6 -6 z" fill="#0f172a" />
                            <circle cx="52" cy="38" r="3" fill="url(#logo-grad)" />
                            <defs><linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#06b6d4" /><stop offset="50%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
                        </svg>
                    </div>
                </div>
                <div>
                    <h1 className={`text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent ${headingFont}`}>BoomTech Gateway</h1>
                    <p className="text-slate-400 text-sm flex items-center gap-1">Universal Protocol <span className="text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-400 border border-blue-800">BETA</span></p>
                </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
                {account && (
                    <div className="hidden md:flex flex-col items-end">
                        <span className={`text-sm font-bold text-white tracking-wide ${headingFont}`}>{balance} ETH</span>
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">Available <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div></span>
                    </div>
                )}
                {isOwner && (
                    <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg border border-yellow-500/20 text-xs font-bold flex items-center gap-1">
                        <Shield className="w-3 h-3" /> ADMIN
                    </div>
                )}
                <button onClick={connectWallet} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${account ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700" : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-orange-500/20 active:scale-95"}`}>
                    {account ? <><Wallet className="w-4 h-4" />{account.slice(0,6)}...{account.slice(-4)}</> : <><LogOut className="w-4 h-4 rotate-180" /> Connect MetaMask / Binance</>}
                </button>
            </div>
        </div>
    );
}

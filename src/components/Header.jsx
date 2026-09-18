import React from 'react';
import { Wallet, Shield, LogOut, LogIn, User } from 'lucide-react';
import { glassPanel, headingFont } from '../styles';
import { CHAINS } from '../constants';

export default function Header({ account, balance, isOwner, connectWallet, chainId, firebaseUser, onLoginClick, signOutUser }) {
    const nativeSymbol = CHAINS[chainId]?.symbol || 'ETH';
    const isAnonymous = !firebaseUser || firebaseUser.isAnonymous;
    const displayName = firebaseUser?.displayName || firebaseUser?.phoneNumber || null;
    const photoURL = firebaseUser?.photoURL || null;

    return (
        <div className={`flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl ${glassPanel}`}>
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-700 rounded-xl blur opacity-50 group-hover:opacity-90 transition duration-500"></div>
                    <div className="relative w-14 h-14 bg-[#060c18] rounded-xl border border-indigo-500/30 flex items-center justify-center shadow-2xl overflow-hidden group-hover:border-indigo-400/60 transition-colors">
                        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="16" y="30" width="36" height="20" rx="3" fill="url(#lg-back)" opacity="0.6" transform="skewX(-10)"/>
                            <rect x="12" y="20" width="36" height="20" rx="3" fill="url(#lg-mid)" opacity="0.85" transform="skewX(-10)"/>
                            <rect x="8" y="10" width="36" height="20" rx="3" fill="url(#lg-front)" transform="skewX(-10)"/>
                            <rect x="46" y="14" width="10" height="4" rx="2" fill="#818cf8" opacity="0.9"/>
                            <rect x="46" y="22" width="7" height="3" rx="1.5" fill="#6366f1" opacity="0.7"/>
                            <defs>
                                <linearGradient id="lg-front" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#a5b4fc"/>
                                    <stop offset="100%" stopColor="#4f46e5"/>
                                </linearGradient>
                                <linearGradient id="lg-mid" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4f46e5"/>
                                    <stop offset="100%" stopColor="#312e81"/>
                                </linearGradient>
                                <linearGradient id="lg-back" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#312e81"/>
                                    <stop offset="100%" stopColor="#0a0020"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
                <div>
                    <h1 className={`text-3xl font-bold bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-400 bg-clip-text text-transparent ${headingFont}`}>BoomTech Gateway</h1>
                    <p className="text-slate-400 text-sm flex items-center gap-1">Universal Protocol <span className="text-xs bg-indigo-900/50 px-2 py-0.5 rounded text-indigo-300 border border-indigo-700/50">BETA</span></p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
                {account && (
                    <div className="hidden md:flex flex-col items-end">
                        <span className={`text-sm font-bold text-white tracking-wide ${headingFont}`}>{balance} {nativeSymbol}</span>
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">Available <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div></span>
                    </div>
                )}
                {isOwner && (
                    <div className="bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30 text-xs font-bold flex items-center gap-1">
                        <Shield className="w-3 h-3" /> ADMIN
                    </div>
                )}

                {/* Firebase login / user info */}
                {!isAnonymous ? (
                    <div className="flex items-center gap-2 bg-indigo-900/20 border border-indigo-500/20 rounded-xl px-3 py-1.5">
                        {photoURL ? (
                            <img src={photoURL} alt="avatar" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover"/>
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-600/50 flex items-center justify-center">
                                <User className="w-4 h-4 text-indigo-300"/>
                            </div>
                        )}
                        <span className="text-sm text-slate-300 max-w-[110px] truncate hidden sm:block">
                            {displayName || 'User'}
                        </span>
                        <button onClick={signOutUser} title="ออกจากระบบ" className="ml-1 text-slate-500 hover:text-red-400 transition-colors">
                            <LogOut className="w-4 h-4"/>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-900/30 hover:bg-indigo-800/50 border border-indigo-500/30 text-indigo-300 hover:text-white text-sm font-semibold transition-all active:scale-95"
                    >
                        <LogIn className="w-4 h-4"/> เข้าสู่ระบบ
                    </button>
                )}

                {/* Wallet */}
                <button
                    onClick={connectWallet}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${account ? "bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/50" : "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-700/30 active:scale-95"}`}
                >
                    {account
                        ? <><Wallet className="w-4 h-4"/>{account.slice(0,6)}...{account.slice(-4)}</>
                        : <><LogOut className="w-4 h-4 rotate-180"/> Connect Wallet</>
                    }
                </button>
            </div>
        </div>
    );
}

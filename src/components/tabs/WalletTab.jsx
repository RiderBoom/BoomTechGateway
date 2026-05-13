import React, { useState, useEffect } from 'react';
import { Send, QrCode, ArrowRightLeft, RefreshCw, Copy, History, Layers, ExternalLink, AlertCircle } from 'lucide-react';
import { glassPanel, glassButton, glassInput, headingFont } from '../../styles';
import { ERC20_ABI, CHAINS } from '../../constants';
import { recordTransaction } from '../../utils/recordTx';

const CHAIN_LIST = Object.entries(CHAINS).map(([id, info]) => ({ id: parseInt(id), ...info }));

export default function WalletTab({ account, provider, signer, ethersLib, balance, setBalance, transactions, db, appId, firebaseUser, isLoading, setIsLoading, showStatus, chainId, switchChain }) {
    const [walletMode, setWalletMode] = useState("transfer");
    const [transferType, setTransferType] = useState("NATIVE");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");
    const [tokenBalance, setTokenBalance] = useState("0.00");
    const [tokenSymbol, setTokenSymbol] = useState("TOKEN");

    const currentChain = CHAINS[chainId];
    const nativeSymbol = currentChain?.symbol || "ETH";

    useEffect(() => {
        const fetch = async () => {
            if (!account || !ethersLib || !ethersLib.utils.isAddress(tokenAddress)) {
                setTokenBalance("0.00"); setTokenSymbol("TOKEN"); return;
            }
            try {
                const c = new ethersLib.Contract(tokenAddress, ERC20_ABI, provider);
                const [bal, dec, sym] = await Promise.all([c.balanceOf(account), c.decimals(), c.symbol().catch(() => "TOKEN")]);
                setTokenBalance(parseFloat(ethersLib.utils.formatUnits(bal, dec)).toFixed(4));
                setTokenSymbol(sym);
            } catch { setTokenBalance("0.00"); }
        };
        fetch();
    }, [tokenAddress, account, ethersLib, provider, chainId]);

    const handleTransfer = async () => {
        if (!recipient || !amount) return showStatus("กรุณากรอกข้อมูลให้ครบ", "error");
        if (!ethersLib || !signer) return showStatus("กรุณาเชื่อมต่อกระเป๋าก่อน", "error");
        if (!ethersLib.utils.isAddress(recipient)) return showStatus("ที่อยู่ผู้รับไม่ถูกต้อง กรุณาตรวจสอบ", "error");
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return showStatus("จำนวนต้องมากกว่า 0", "error");
        if (transferType === "NATIVE" && numAmount >= parseFloat(balance)) return showStatus(`ยอดเงินไม่พอ (มี ${balance} ${nativeSymbol})`, "error");
        setIsLoading(true);
        showStatus("กำลังดำเนินการ...", "info");
        try {
            if (transferType === "NATIVE") {
                const tx = await signer.sendTransaction({ to: recipient, value: ethersLib.utils.parseEther(amount) });
                await tx.wait();
                await recordTransaction(db, appId, firebaseUser, account, `TRANSFER_${nativeSymbol}`, amount, nativeSymbol, recipient);
            } else {
                const tc = new ethersLib.Contract(tokenAddress, ERC20_ABI, signer);
                const dec = await tc.decimals();
                const wei = ethersLib.utils.parseUnits(amount, dec);
                const tx = await tc.transfer(recipient, wei);
                await tx.wait();
                await recordTransaction(db, appId, firebaseUser, account, "TRANSFER_TOKEN", amount, tokenSymbol, recipient);
            }
            showStatus("โอนสำเร็จ! ✅", "success");
            const newBal = await provider.getBalance(account);
            setBalance(parseFloat(ethersLib.utils.formatEther(newBal)).toFixed(4));
            setAmount("");
        } catch (err) { showStatus("เกิดข้อผิดพลาด: " + (err.reason || err.message), "error"); }
        finally { setIsLoading(false); }
    };

    const explorerUrl = currentChain?.explorer;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

            {/* Network Selector */}
            <div className={`p-4 rounded-2xl ${glassPanel}`}>
                <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Select Network</span>
                    {chainId && !CHAINS[chainId] && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400 ml-auto"><AlertCircle className="w-3 h-3" /> Unsupported Network</span>
                    )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {CHAIN_LIST.map(chain => {
                        const isActive = chainId === chain.id;
                        return (
                            <button key={chain.id} onClick={() => switchChain(chain.id)} className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all active:scale-95 ${isActive ? `${chain.bg} ${chain.border} shadow-lg` : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'}`}>
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${chain.gradient} flex items-center justify-center shadow-md`}>
                                    <span className="text-white font-bold text-[10px]">{chain.shortName.slice(0,3)}</span>
                                </div>
                                <span className={`text-[10px] font-medium leading-tight text-center ${isActive ? chain.color : 'text-slate-400'}`}>{chain.name.split(' ')[0]}</span>
                                {isActive && <div className={`w-1.5 h-1.5 rounded-full ${chain.color.replace('text-', 'bg-')} animate-pulse`}></div>}
                            </button>
                        );
                    })}
                </div>
                {currentChain && (
                    <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-xl ${currentChain.bg} border ${currentChain.border}`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${currentChain.color.replace('text-', 'bg-')} animate-pulse`}></div>
                            <span className={`text-sm font-bold ${currentChain.color}`}>{currentChain.name}</span>
                            <span className="text-xs text-slate-500">Chain ID: {chainId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-mono font-bold ${currentChain.color}`}>{balance} {nativeSymbol}</span>
                            {explorerUrl && account && (
                                <a href={`${explorerUrl}/address/${account}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Send / Receive Toggle */}
            <div className="flex justify-center">
                <div className={`p-1 rounded-xl flex ${glassPanel}`}>
                    <button onClick={() => setWalletMode('transfer')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${walletMode === 'transfer' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}><Send className="w-4 h-4" /> โอนเงิน (Send)</button>
                    <button onClick={() => setWalletMode('deposit')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${walletMode === 'deposit' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}><QrCode className="w-4 h-4" /> รับเงิน (Receive)</button>
                </div>
            </div>

            {walletMode === 'transfer' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        {/* Token Type */}
                        <div className={`flex p-1 rounded-xl w-fit ${glassPanel}`}>
                            <button onClick={() => setTransferType('NATIVE')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${transferType === 'NATIVE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
                                {nativeSymbol} (Native)
                            </button>
                            <button onClick={() => setTransferType('ERC20')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${transferType === 'ERC20' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
                                Token (ERC-20)
                            </button>
                        </div>

                        {transferType === 'ERC20' && (
                            <div>
                                <label className="block text-sm text-slate-400 mb-1 ml-1">Token Contract Address</label>
                                <input type="text" placeholder="0x..." value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} />
                                {tokenAddress && <div className="flex justify-between mt-1 text-xs px-1"><span className="text-slate-500">{tokenSymbol}</span><span className="text-emerald-400">Balance: {tokenBalance}</span></div>}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-slate-400 mb-1 ml-1">ผู้รับ (Recipient Address)</label>
                            <input type="text" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1 ml-1">จำนวน (Amount)</label>
                            <div className="relative">
                                <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full rounded-xl px-4 py-3 pr-20 font-mono text-sm ${glassInput}`} />
                                <span className={`absolute right-4 top-3.5 text-sm font-bold ${currentChain?.color || 'text-slate-400'}`}>
                                    {transferType === 'NATIVE' ? nativeSymbol : tokenSymbol}
                                </span>
                            </div>
                            {transferType === 'NATIVE' && (
                                <p className="text-xs text-slate-500 mt-1 text-right">Available: {balance} {nativeSymbol}</p>
                            )}
                        </div>

                        <button onClick={handleTransfer} disabled={isLoading || !recipient || !amount || !account} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}
                            {isLoading ? "กำลังโอน..." : `Send ${transferType === 'NATIVE' ? nativeSymbol : tokenSymbol}`}
                        </button>

                        {!account && <p className="text-center text-xs text-slate-500">กรุณาเชื่อมต่อกระเป๋าก่อน</p>}
                    </div>

                    {/* Tx History */}
                    <div className={`rounded-xl p-4 flex flex-col max-h-[500px] ${glassPanel}`}>
                        <h3 className={`text-white font-bold mb-4 flex items-center gap-2 ${headingFont}`}><History className="w-5 h-5 text-slate-400"/> ประวัติธุรกรรมล่าสุด</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {transactions.length === 0 ? <p className="text-slate-500 text-center py-10">ยังไม่มีรายการ</p> : transactions.map(tx => (
                                <div key={tx.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/50 text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className={`font-bold ${tx.type.includes('BUY') ? 'text-pink-400' : 'text-emerald-400'}`}>{tx.type}</span>
                                        <span className="text-slate-500 text-xs">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-white font-mono">{tx.amount} {tx.token}</div>
                                    <div className="text-xs text-slate-500 truncate">To: {tx.to}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {walletMode === 'deposit' && (
                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                    {currentChain && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentChain.bg} border ${currentChain.border}`}>
                            <div className={`w-2 h-2 rounded-full ${currentChain.color.replace('text-', 'bg-')} animate-pulse`}></div>
                            <span className={`text-sm font-bold ${currentChain.color}`}>{currentChain.name}</span>
                        </div>
                    )}
                    {account ? (
                        <div className="bg-white p-4 rounded-3xl shadow-xl">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${account}`} alt="Wallet QR" className="w-64 h-64 rounded-xl" />
                        </div>
                    ) : (
                        <div className="w-64 h-64 bg-slate-800/50 rounded-3xl flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700"><p>กรุณาเชื่อมต่อกระเป๋า</p></div>
                    )}
                    <div className="w-full max-w-md bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col gap-3">
                        <span className="text-sm text-slate-400 font-medium">Wallet Address (รองรับทุก EVM Chain)</span>
                        <div className="flex items-center gap-3">
                            <code className="flex-1 font-mono text-emerald-400 break-all bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/20 text-sm">{account || "ยังไม่เชื่อมต่อ"}</code>
                            <button onClick={() => { navigator.clipboard.writeText(account); showStatus("คัดลอกแล้ว", "success"); }} className={`p-3 rounded-lg flex-shrink-0 ${glassButton}`}><Copy className="w-5 h-5" /></button>
                        </div>
                        <p className="text-xs text-slate-500 text-center">Address เดียวกันใช้ได้กับทุก Chain ด้านบน</p>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Send, QrCode, ArrowRightLeft, RefreshCw, Copy, History } from 'lucide-react';
import { glassPanel, glassButton, glassInput, headingFont } from '../../styles';
import { CONTRACT_ABI, ERC20_ABI, SHOP_WALLET_ADDRESS } from '../../constants';
import { recordTransaction } from '../../utils/recordTx';

export default function WalletTab({ account, provider, signer, ethersLib, balance, setBalance, transactions, db, appId, firebaseUser, isLoading, setIsLoading, showStatus, contractAddress }) {
    const [walletMode, setWalletMode] = useState("transfer");
    const [transferType, setTransferType] = useState("ETH");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");
    const [tokenBalance, setTokenBalance] = useState("0.00");

    useEffect(() => {
        const fetch = async () => {
            if (!account || !ethersLib || !ethersLib.utils.isAddress(tokenAddress)) return;
            try {
                const c = new ethersLib.Contract(tokenAddress, ERC20_ABI, provider);
                const bal = await c.balanceOf(account);
                const dec = await c.decimals();
                setTokenBalance(ethersLib.utils.formatUnits(bal, dec));
            } catch { setTokenBalance("0.00"); }
        };
        fetch();
    }, [tokenAddress, account, ethersLib, provider]);

    const handleTransfer = async () => {
        if (!contractAddress) return showStatus("กรุณาระบุ Contract Address", "error");
        if (!recipient || !amount) return showStatus("กรุณากรอกข้อมูลให้ครบ", "error");
        if (!ethersLib) return;
        setIsLoading(true);
        showStatus("กำลังดำเนินการ...", "info");
        try {
            const contract = new ethersLib.Contract(contractAddress, CONTRACT_ABI, signer);
            if (transferType === "ETH") {
                const tx = await contract.transferETHWithReferral(recipient, SHOP_WALLET_ADDRESS, { value: ethersLib.utils.parseEther(amount) });
                await tx.wait();
                await recordTransaction(db, appId, firebaseUser, account, "TRANSFER_ETH", amount, "ETH", recipient);
            } else {
                const tokenContract = new ethersLib.Contract(tokenAddress, ERC20_ABI, signer);
                const decimals = await tokenContract.decimals();
                const amountWei = ethersLib.utils.parseUnits(amount, decimals);
                const allowance = await tokenContract.allowance(account, contractAddress);
                if (allowance.lt(amountWei)) { const tx = await tokenContract.approve(contractAddress, ethersLib.constants.MaxUint256); await tx.wait(); }
                const tx = await contract.transferTokenWithReferral(tokenAddress, recipient, amountWei, SHOP_WALLET_ADDRESS);
                await tx.wait();
                await recordTransaction(db, appId, firebaseUser, account, "TRANSFER_TOKEN", amount, "TOKEN", recipient);
            }
            showStatus("โอนสำเร็จ! ✅", "success");
            const newBal = await provider.getBalance(account);
            setBalance(parseFloat(ethersLib.utils.formatEther(newBal)).toFixed(4));
            setAmount("");
        } catch (err) { showStatus("เกิดข้อผิดพลาด: " + (err.reason || err.message), "error"); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-6">
                <div className={`p-1 rounded-xl flex ${glassPanel}`}>
                    <button onClick={() => setWalletMode('transfer')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${walletMode === 'transfer' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}><Send className="w-4 h-4" /> โอนเงิน (Send)</button>
                    <button onClick={() => setWalletMode('deposit')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${walletMode === 'deposit' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}><QrCode className="w-4 h-4" /> รับเงิน (Receive)</button>
                </div>
            </div>

            {walletMode === 'transfer' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className={`flex p-1 rounded-xl w-fit ${glassPanel}`}>
                            <button onClick={() => setTransferType('ETH')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${transferType === 'ETH' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Native ETH</button>
                            <button onClick={() => setTransferType('ERC20')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${transferType === 'ERC20' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>ERC-20 Token</button>
                        </div>
                        {transferType === 'ERC20' && (
                            <div>
                                <label className="block text-sm text-slate-400 mb-1 ml-1">Token Contract Address</label>
                                <input type="text" placeholder="0x..." value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} />
                                <p className="text-xs text-emerald-400 mt-1 text-right">Balance: {tokenBalance}</p>
                            </div>
                        )}
                        <div><label className="block text-sm text-slate-400 mb-1 ml-1">ผู้รับ (Recipient)</label><input type="text" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} /></div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1 ml-1">จำนวน (Amount)</label>
                            <div className="relative"><input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} /><span className="absolute right-4 top-3.5 text-slate-500 text-sm font-bold">{transferType === 'ETH' ? 'ETH' : 'TOKENS'}</span></div>
                        </div>
                        <button onClick={handleTransfer} disabled={isLoading || !recipient || !amount} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}
                            {transferType === 'ERC20' ? 'Approve & Transfer' : 'ยืนยันการโอน (Transfer)'}
                        </button>
                    </div>
                    <div className={`rounded-xl p-4 flex flex-col max-h-[500px] ${glassPanel}`}>
                        <h3 className={`text-white font-bold mb-4 flex items-center gap-2 ${headingFont}`}><History className="w-5 h-5 text-slate-400"/> ประวัติธุรกรรมล่าสุด</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {transactions.length === 0 ? <p className="text-slate-500 text-center py-10">ยังไม่มีรายการ</p> : transactions.map(tx => (
                                <div key={tx.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/50 text-sm">
                                    <div className="flex justify-between mb-1"><span className={`font-bold ${tx.type.includes('BUY') ? 'text-pink-400' : 'text-emerald-400'}`}>{tx.type}</span><span className="text-slate-500 text-xs">{new Date(tx.timestamp).toLocaleTimeString()}</span></div>
                                    <div className="text-white font-mono">{tx.amount} {tx.token}</div>
                                    <div className="text-xs text-slate-500 truncate">To: {tx.to}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {walletMode === 'deposit' && (
                <div className="flex flex-col items-center justify-center py-6 space-y-8">
                    {account ? <div className="bg-white p-4 rounded-3xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${account}`} alt="Wallet QR" className="w-64 h-64 rounded-xl" /></div>
                        : <div className="w-64 h-64 bg-slate-800/50 rounded-3xl flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700"><p>กรุณาเชื่อมต่อกระเป๋า</p></div>}
                    <div className="w-full max-w-md bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col gap-3">
                        <span className="text-sm text-slate-400">Wallet Address ของคุณ</span>
                        <div className="flex items-center gap-3">
                            <code className="flex-1 font-mono text-emerald-400 break-all bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/20 text-sm">{account || "ยังไม่เชื่อมต่อ"}</code>
                            <button onClick={() => { navigator.clipboard.writeText(account); showStatus("คัดลอกแล้ว", "success"); }} className={`p-3 rounded-lg ${glassButton}`}><Copy className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState } from 'react';
import { Heart, Wallet, Coins, RefreshCw } from 'lucide-react';
import { glassPanel, glassInput, headingFont } from '../../styles';
import { ERC20_ABI, CONTRACT_ABI, SHOP_WALLET_ADDRESS, ADMIN_WALLETS } from '../../constants';
import { recordTransaction } from '../../utils/recordTx';

export default function DonateTab({ account, signer, ethersLib, db, appId, firebaseUser, isLoading, setIsLoading, showStatus, contractAddress }) {
    const [donateType, setDonateType] = useState("ETH");
    const [amount, setAmount] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");

    const getTarget = () => {
        if (ethersLib?.utils.isAddress(SHOP_WALLET_ADDRESS)) return SHOP_WALLET_ADDRESS;
        if (ADMIN_WALLETS.length > 0) return ADMIN_WALLETS[0];
        return "0x000000000000000000000000000000000000dEaD";
    };

    const handleDonate = async () => {
        if (!ethersLib || !signer) return showStatus("กรุณาเชื่อมต่อกระเป๋าก่อน", "error");
        if (!account) return showStatus("กรุณาเชื่อมต่อกระเป๋าก่อน", "error");
        if (!amount) return showStatus("กรุณากรอกจำนวน", "error");
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return showStatus("จำนวนต้องมากกว่า 0", "error");

        setIsLoading(true);
        const target = getTarget();
        const useContract = contractAddress && ethersLib.utils.isAddress(contractAddress);

        try {
            if (donateType === "ETH") {
                const value = ethersLib.utils.parseEther(amount);
                if (useContract) {
                    try {
                        const c = new ethersLib.Contract(contractAddress, CONTRACT_ABI, signer);
                        const tx = await c.donateETH({ value });
                        await tx.wait();
                    } catch {
                        const tx = await signer.sendTransaction({ to: target, value });
                        await tx.wait();
                    }
                } else {
                    const tx = await signer.sendTransaction({ to: target, value });
                    await tx.wait();
                }
                await recordTransaction(db, appId, firebaseUser, account, "DONATE_ETH", amount, "ETH", "Treasury");
            } else {
                if (!tokenAddress) throw new Error("กรุณาระบุ Token Contract Address");
                if (!ethersLib.utils.isAddress(tokenAddress)) throw new Error("Token Address ไม่ถูกต้อง");
                const tc = new ethersLib.Contract(tokenAddress, ERC20_ABI, signer);
                const dec = await tc.decimals();
                const wei = ethersLib.utils.parseUnits(amount, dec);
                const bal = await tc.balanceOf(account);
                if (bal.lt(wei)) throw new Error("ยอดเงิน Token ไม่เพียงพอ");
                if (useContract) {
                    try {
                        const allowance = await tc.allowance(account, contractAddress);
                        if (allowance.lt(wei)) {
                            showStatus("กำลัง Approve token...", "info");
                            const approveTx = await tc.approve(contractAddress, wei);
                            await approveTx.wait();
                        }
                        const c = new ethersLib.Contract(contractAddress, CONTRACT_ABI, signer);
                        const tx = await c.donateToken(tokenAddress, wei);
                        await tx.wait();
                    } catch {
                        const tx = await tc.transfer(target, wei);
                        await tx.wait();
                    }
                } else {
                    const tx = await tc.transfer(target, wei);
                    await tx.wait();
                }
                await recordTransaction(db, appId, firebaseUser, account, "DONATE_TOKEN", amount, "TOKEN", "Treasury");
            }
            showStatus("ขอบคุณสำหรับการบริจาค! 🙏", "success");
            setAmount("");
        } catch (err) { showStatus("บริจาคไม่สำเร็จ: " + (err.reason || err.message), "error"); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="space-y-8 text-center py-10 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto border border-pink-500/20 shadow-lg shadow-pink-500/10"><Heart className="w-12 h-12 text-pink-500" /></div>
            <div><h2 className={`text-2xl font-bold text-white mb-2 ${headingFont}`}>สนับสนุนโปรเจกต์ (Donation)</h2><p className="text-slate-400 max-w-md mx-auto text-sm">เงินบริจาคจะถูกส่งเข้า Treasury โดยตรง เพื่อพัฒนาและบำรุงรักษาระบบ</p></div>
            <div className="flex justify-center gap-4">
                <button onClick={() => setDonateType("ETH")} className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${donateType === 'ETH' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}><Wallet className="w-4 h-4" /> ETH</button>
                <button onClick={() => setDonateType("ERC20")} className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${donateType === 'ERC20' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}><Coins className="w-4 h-4" /> USDT / Token</button>
            </div>
            <div className="max-w-sm mx-auto space-y-4">
                {donateType === 'ERC20' && <input type="text" placeholder="Token/USDT Address (0x...)" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} />}
                <div className="relative">
                    <input type="number" placeholder="0.00" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-white text-center text-2xl font-bold outline-none transition-colors ${donateType === 'ETH' ? 'focus:border-pink-500' : 'focus:border-purple-500'} ${glassInput}`} />
                    <span className="absolute right-4 top-5 text-slate-500 text-sm font-bold">{donateType === 'ETH' ? 'ETH' : 'TOKENS'}</span>
                </div>
                {donateType === 'ETH' && <div className="flex gap-2 justify-center">{[0.01, 0.05, 0.1].map(v => <button key={v} onClick={() => setAmount(v.toString())} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg border border-slate-700">{v} ETH</button>)}</div>}
            </div>
            <button onClick={handleDonate} disabled={isLoading || !amount || !account} className={`w-full max-w-sm mx-auto text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${donateType === 'ETH' ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'}`}>
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Heart className="w-5 h-5 fill-current" />}
                {isLoading ? "กำลังดำเนินการ..." : `ยืนยันบริจาค ${donateType}`}
            </button>
            {!account && <p className="text-xs text-slate-500">กรุณาเชื่อมต่อกระเป๋าก่อน</p>}
        </div>
    );
}

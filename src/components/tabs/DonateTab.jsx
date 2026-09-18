import React, { useState } from 'react';
import { Heart, Wallet, Coins, RefreshCw, QrCode, Copy } from 'lucide-react';
import { glassPanel, glassInput, headingFont } from '../../styles';
import { ERC20_ABI, SHOP_WALLET_ADDRESS, ADMIN_WALLETS, PROMPTPAY_ID, USD_THB_RATE, SANDBOX_MODE } from '../../constants';
import { recordTransaction } from '../../utils/recordTx';
import ConsentCheckbox from '../ConsentCheckbox';

const MODES = [
    { id: 'ETH',      label: 'ETH / Crypto',  icon: Wallet,  color: 'bg-purple-600' },
    { id: 'ERC20',    label: 'USDT / Token',   icon: Coins,   color: 'bg-emerald-600' },
    { id: 'PROMPTPAY',label: 'PromptPay',       icon: QrCode,  color: 'bg-sky-600' },
];

export default function DonateTab({ account, signer, ethersLib, db, appId, firebaseUser, isLoading, setIsLoading, showStatus }) {
    const [mode, setMode] = useState("ETH");
    const [amount, setAmount] = useState("");
    const [amountTHB, setAmountTHB] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");
    const [consentChecked, setConsentChecked] = useState(false);
    const [consentTouched, setConsentTouched] = useState(false);

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

        // ── Sandbox Mode ──────────────────────────────────────────────────
        if (SANDBOX_MODE) {
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 800));
            await recordTransaction(db, appId, firebaseUser, account, mode === "ETH" ? "DONATE_ETH" : "DONATE_TOKEN", amount, mode === "ETH" ? "ETH" : "TOKEN", "Treasury");
            showStatus("🧪 [SANDBOX] จำลองการบริจาคสำเร็จ — ไม่มีการส่ง transaction จริง 🙏", "success");
            setAmount(""); setConsentChecked(false); setConsentTouched(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const target = getTarget();
        try {
            if (mode === "ETH") {
                const tx = await signer.sendTransaction({ to: target, value: ethersLib.utils.parseEther(amount) });
                await tx.wait();
                await recordTransaction(db, appId, firebaseUser, account, "DONATE_ETH", amount, "ETH", "Treasury");
            } else {
                if (!tokenAddress) throw new Error("กรุณาระบุ Token Contract Address");
                if (!ethersLib.utils.isAddress(tokenAddress)) throw new Error("Token Address ไม่ถูกต้อง");
                const tc = new ethersLib.Contract(tokenAddress, ERC20_ABI, signer);
                const dec = await tc.decimals();
                const wei = ethersLib.utils.parseUnits(amount, dec);
                const bal = await tc.balanceOf(account);
                if (bal.lt(wei)) throw new Error("ยอดเงิน Token ไม่เพียงพอ");
                const tx = await tc.transfer(target, wei);
                await tx.wait();
                await recordTransaction(db, appId, firebaseUser, account, "DONATE_TOKEN", amount, "TOKEN", "Treasury");
            }
            showStatus("ขอบคุณสำหรับการสนับสนุน! 🙏", "success");
            setAmount(""); setConsentChecked(false); setConsentTouched(false);
        } catch (err) { showStatus("ไม่สำเร็จ: " + (err.reason || err.message), "error"); }
        finally { setIsLoading(false); }
    };

    const handlePromptPayConfirm = async () => {
        if (!amountTHB || parseFloat(amountTHB) <= 0) return showStatus("กรุณากรอกจำนวนเงิน", "error");

        // ── Sandbox Mode: ห้ามโอนเงินจริง ────────────────────────────────
        if (SANDBOX_MODE) {
            await recordTransaction(db, appId, firebaseUser, account || "Guest", "DONATE_PROMPTPAY", amountTHB, "THB", "Treasury", "", null, { paymentStatus: 'sandbox_demo' });
            showStatus("🧪 [SANDBOX] บันทึกจำลองสำเร็จ — อย่าโอนเงินจริงในระบบทดสอบนี้", "success");
            setAmountTHB(""); setConsentChecked(false); setConsentTouched(false);
            return;
        }

        // บันทึก donation พร้อมสถานะ "รอยืนยัน" — ไม่มีการตรวจสอบอัตโนมัติ
        await recordTransaction(db, appId, firebaseUser, account || "Guest", "DONATE_PROMPTPAY", amountTHB, "THB", "Treasury", "", null, { paymentStatus: 'pending_verification' });
        showStatus("บันทึกการสนับสนุนแล้ว 🙏 กรุณาตรวจสอบว่าการโอนเงินสำเร็จก่อนปิดหน้านี้", "success");
        setAmountTHB(""); setConsentChecked(false); setConsentTouched(false);
    };

    return (
        <div className="max-w-lg mx-auto space-y-8 py-8 animate-in fade-in zoom-in duration-300">

            {/* Icon + Title */}
            <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto border border-purple-500/20 shadow-lg shadow-purple-500/10">
                    <Heart className="w-10 h-10 text-purple-400 fill-current" />
                </div>
                <h2 className={`text-2xl font-bold text-white ${headingFont}`}>สนับสนุนโปรเจกต์</h2>
                <p className="text-slate-400 text-sm">เงินทุกบาทช่วยพัฒนาและบำรุงรักษาระบบ BoomTech Gateway</p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
                {MODES.map(m => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border font-medium text-sm transition-all ${mode === m.id ? `${m.color} border-transparent text-white shadow-lg` : 'border-purple-500/20 text-slate-400 hover:text-white hover:border-purple-500/40'}`}
                    >
                        <m.icon className="w-5 h-5"/>
                        {m.label}
                    </button>
                ))}
            </div>

            {/* ETH Mode */}
            {mode === 'ETH' && (
                <div className="space-y-4">
                    <div className="relative">
                        <input type="number" placeholder="0.00" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full rounded-xl px-4 py-4 font-mono text-white text-center text-3xl font-bold outline-none ${glassInput}`} />
                        <span className="absolute right-4 top-5 text-slate-500 font-bold">ETH</span>
                    </div>
                    <div className="flex gap-2 justify-center flex-wrap">
                        {[0.01, 0.05, 0.1, 0.5].map(v => (
                            <button key={v} onClick={() => setAmount(v.toString())} className="bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 text-sm px-4 py-2 rounded-xl border border-purple-500/20">
                                {v} ETH
                            </button>
                        ))}
                    </div>
                    <ConsentCheckbox
                        checked={consentChecked}
                        onChange={(val) => { setConsentChecked(val); setConsentTouched(true); }}
                        touched={consentTouched}
                    />
                    <div onClick={() => { if (!consentChecked) setConsentTouched(true); }}>
                        <button onClick={handleDonate} disabled={isLoading || !amount || !account || !consentChecked} className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-900/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95">
                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Heart className="w-5 h-5 fill-current" />}
                            {isLoading ? "กำลังดำเนินการ..." : "บริจาคด้วย ETH"}
                        </button>
                    </div>
                    {!account && <p className="text-center text-xs text-slate-500">กรุณาเชื่อมต่อกระเป๋าก่อน</p>}
                </div>
            )}

            {/* ERC20 Mode */}
            {mode === 'ERC20' && (
                <div className="space-y-4">
                    <input type="text" placeholder="Token/USDT Contract Address (0x...)" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} />
                    <div className="relative">
                        <input type="number" placeholder="0.00" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full rounded-xl px-4 py-4 font-mono text-white text-center text-3xl font-bold outline-none ${glassInput}`} />
                        <span className="absolute right-4 top-5 text-slate-500 font-bold">TOKENS</span>
                    </div>
                    <ConsentCheckbox
                        checked={consentChecked}
                        onChange={(val) => { setConsentChecked(val); setConsentTouched(true); }}
                        touched={consentTouched}
                    />
                    <div onClick={() => { if (!consentChecked) setConsentTouched(true); }}>
                        <button onClick={handleDonate} disabled={isLoading || !amount || !account || !consentChecked} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95">
                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Coins className="w-5 h-5" />}
                            {isLoading ? "กำลังดำเนินการ..." : "บริจาคด้วย Token"}
                        </button>
                    </div>
                    {!account && <p className="text-center text-xs text-slate-500">กรุณาเชื่อมต่อกระเป๋าก่อน</p>}
                </div>
            )}

            {/* PromptPay Mode */}
            {mode === 'PROMPTPAY' && (
                <div className="space-y-5">
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="จำนวนเงิน (บาท)"
                            min="1"
                            step="1"
                            value={amountTHB}
                            onChange={(e) => setAmountTHB(e.target.value)}
                            className={`w-full rounded-xl px-4 py-4 font-mono text-white text-center text-3xl font-bold outline-none ${glassInput}`}
                        />
                        <span className="absolute right-4 top-5 text-slate-500 font-bold">THB</span>
                    </div>
                    <div className="flex gap-2 justify-center flex-wrap">
                        {[50, 100, 200, 500].map(v => (
                            <button key={v} onClick={() => setAmountTHB(v.toString())} className="bg-sky-900/30 hover:bg-sky-800/40 text-sky-300 text-sm px-4 py-2 rounded-xl border border-sky-500/20">
                                ฿{v}
                            </button>
                        ))}
                    </div>

                    {/* QR Code */}
                    <div className={`p-5 rounded-2xl flex flex-col items-center gap-4 ${glassPanel}`}>
                        <p className="text-sm text-slate-400">สแกน QR Code ด้วยแอปธนาคาร</p>
                        <div className="bg-white p-4 rounded-2xl shadow-xl">
                            <img
                                src={`https://promptpay.io/${PROMPTPAY_ID}/${amountTHB || '0'}.png`}
                                alt="PromptPay QR"
                                className="w-52 h-52 rounded-lg"
                            />
                        </div>
                        <div className="text-center">
                            <div className={`text-3xl font-bold text-white font-mono`}>
                                ฿{amountTHB ? parseFloat(amountTHB).toLocaleString() : '0'}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">พร้อมเพย์ ID: {PROMPTPAY_ID}</p>
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText(PROMPTPAY_ID); showStatus("คัดลอก ID แล้ว", "success"); }}
                            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-800 px-4 py-2 rounded-lg border border-slate-700"
                        >
                            <Copy className="w-3.5 h-3.5" /> คัดลอก PromptPay ID
                        </button>
                    </div>

                    <ConsentCheckbox
                        checked={consentChecked}
                        onChange={(val) => { setConsentChecked(val); setConsentTouched(true); }}
                        touched={consentTouched}
                    />
                    <div onClick={() => { if (!consentChecked) setConsentTouched(true); }}>
                        <button
                            onClick={handlePromptPayConfirm}
                            disabled={!amountTHB || parseFloat(amountTHB) <= 0 || !consentChecked}
                            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Heart className="w-5 h-5 fill-current" /> ยืนยันการโอนเงิน
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-500">กดยืนยันหลังจากโอนเงินเรียบร้อยแล้ว</p>
                </div>
            )}

            {/* Wallet target info */}
            <div className={`p-4 rounded-xl text-xs text-slate-500 ${glassPanel} space-y-1`}>
                <p className="text-slate-400 font-medium mb-2">ปลายทาง Treasury</p>
                <p className="font-mono text-purple-300 break-all">{SHOP_WALLET_ADDRESS}</p>
            </div>
        </div>
    );
}

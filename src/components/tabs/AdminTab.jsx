import React from 'react';
import { Shield, Wallet, ShoppingBag, Copy, ExternalLink } from 'lucide-react';
import { glassPanel } from '../../styles';
import { SHOP_WALLET_ADDRESS, ADMIN_WALLETS } from '../../constants';

export default function AdminTab({ shopOrders, transactions, account }) {
    const totalRevenue = shopOrders.reduce((sum, o) => {
        if (o.token === 'ETH') return sum + parseFloat(o.amount || 0);
        return sum;
    }, 0);

    const copy = (text) => { navigator.clipboard.writeText(text); };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div><h3 className="font-bold text-yellow-500">Admin Dashboard</h3><p className="text-sm text-yellow-200/70">สำหรับเจ้าของระบบเท่านั้น</p></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-5 rounded-xl ${glassPanel} flex items-center justify-between`}>
                    <div><p className="text-slate-400 text-xs uppercase mb-1">ออเดอร์ทั้งหมด</p><p className="text-2xl font-bold text-white">{shopOrders.length}</p></div>
                    <div className="p-3 bg-blue-500/20 rounded-xl"><ShoppingBag className="w-6 h-6 text-blue-400" /></div>
                </div>
                <div className={`p-5 rounded-xl ${glassPanel} flex items-center justify-between`}>
                    <div><p className="text-slate-400 text-xs uppercase mb-1">รายรับรวม (ETH)</p><p className="text-2xl font-bold text-emerald-400">{totalRevenue.toFixed(4)}</p></div>
                    <div className="p-3 bg-emerald-500/20 rounded-xl"><Wallet className="w-6 h-6 text-emerald-400" /></div>
                </div>
                <div className={`p-5 rounded-xl ${glassPanel} flex items-center justify-between`}>
                    <div><p className="text-slate-400 text-xs uppercase mb-1">Transaction ล่าสุด</p><p className="text-2xl font-bold text-white">{transactions.length}</p></div>
                    <div className="p-3 bg-purple-500/20 rounded-xl"><Shield className="w-6 h-6 text-purple-400" /></div>
                </div>
            </div>

            <div className={`p-6 rounded-xl ${glassPanel} space-y-4`}>
                <h3 className="font-bold text-white text-lg">กระเป๋าเงิน</h3>
                {[
                    { label: "Admin / Shop Wallet (รับเงินทั้งหมด)", address: SHOP_WALLET_ADDRESS, color: "text-yellow-400" },
                    ...(account ? [{ label: "กระเป๋าที่เชื่อมต่ออยู่", address: account, color: "text-cyan-400" }] : []),
                ].map(({ label, address, color }) => (
                    <div key={address} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-500 mb-2">{label}</p>
                        <div className="flex items-center gap-2">
                            <code className={`flex-1 font-mono text-sm ${color} break-all`}>{address}</code>
                            <button onClick={() => copy(address)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"><Copy className="w-4 h-4" /></button>
                            <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"><ExternalLink className="w-4 h-4" /></a>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`p-6 rounded-xl ${glassPanel}`}>
                <h3 className="font-bold text-white text-lg mb-4">ออเดอร์ล่าสุด</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                    {shopOrders.length === 0 && <p className="text-slate-500 text-sm text-center py-6">ยังไม่มีออเดอร์</p>}
                    {shopOrders.map(o => (
                        <div key={o.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white font-bold text-sm">{o.details || "Order"}</p>
                                    <p className="text-xs text-slate-500">จาก: {o.from}</p>
                                    <p className="text-xs text-slate-500">{new Date(o.timestamp).toLocaleString('th-TH')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-400 font-bold">{o.amount} {o.token}</p>
                                    <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">Paid</span>
                                </div>
                            </div>
                            {o.shippingAddress && (
                                <div className="mt-2 bg-slate-900 p-2 rounded border border-slate-700 text-xs text-slate-300 whitespace-pre-wrap">{o.shippingAddress}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

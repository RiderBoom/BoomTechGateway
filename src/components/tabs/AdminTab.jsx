import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { glassPanel, glassButton, glassInput } from '../../styles';
import { CONTRACT_ABI } from '../../constants';

export default function AdminTab({ contractAddress, signer, ethersLib, isLoading, setIsLoading, showStatus }) {
    const [newFee, setNewFee] = useState("");
    const [newTreasury, setNewTreasury] = useState("");

    const handleUpdateFee = async () => {
        if (!ethersLib) return;
        setIsLoading(true);
        try { const c = new ethersLib.Contract(contractAddress, CONTRACT_ABI, signer); await (await c.setFeeBps(newFee)).wait(); showStatus("อัปเดตค่าธรรมเนียมเรียบร้อย", "success"); }
        catch (err) { showStatus("Error: " + err.message, "error"); }
        finally { setIsLoading(false); }
    };

    const handleUpdateTreasury = async () => {
        if (!ethersLib) return;
        setIsLoading(true);
        try { const c = new ethersLib.Contract(contractAddress, CONTRACT_ABI, signer); await (await c.setTreasury(newTreasury)).wait(); showStatus("อัปเดต Treasury Wallet เรียบร้อย", "success"); setNewTreasury(""); }
        catch (err) { showStatus("Error: " + err.message, "error"); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" /><div><h3 className="font-bold text-yellow-500">Admin Zone</h3><p className="text-sm text-yellow-200/70">สำหรับเจ้าของสัญญาเท่านั้น</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl ${glassPanel}`}>
                    <label className="block text-sm text-slate-400 mb-2">ค่าธรรมเนียมใหม่ (BPS)</label>
                    <div className="flex gap-2"><input type="number" placeholder="20" value={newFee} onChange={(e) => setNewFee(e.target.value)} className={`flex-1 rounded-lg px-3 py-2 text-sm ${glassInput}`} /><button onClick={handleUpdateFee} disabled={isLoading} className={`px-4 rounded-lg text-sm ${glassButton}`}>บันทึก</button></div>
                </div>
                <div className={`p-6 rounded-xl ${glassPanel}`}>
                    <label className="block text-sm text-slate-400 mb-2">เปลี่ยน Treasury Wallet</label>
                    <div className="flex gap-2"><input type="text" placeholder="0x..." value={newTreasury} onChange={(e) => setNewTreasury(e.target.value)} className={`flex-1 rounded-lg px-3 py-2 text-sm ${glassInput}`} /><button onClick={handleUpdateTreasury} disabled={isLoading} className={`px-4 rounded-lg text-sm ${glassButton}`}>บันทึก</button></div>
                </div>
            </div>
        </div>
    );
}

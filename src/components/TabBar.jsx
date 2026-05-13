import React from 'react';
import { Wallet, BarChart2, Gamepad2, ShoppingBag, Newspaper, MessageSquare, Heart, Settings } from 'lucide-react';

const TABS = [
    { id: 'wallet', icon: Wallet, label: 'กระเป๋าเงิน' },
    { id: 'market', icon: BarChart2, label: 'ตลาด' },
    { id: 'game', icon: Gamepad2, label: 'BoomPet' },
    { id: 'shop', icon: ShoppingBag, label: 'ร้านค้า' },
    { id: 'news', icon: Newspaper, label: 'ข่าวสาร' },
    { id: 'community', icon: MessageSquare, label: 'ชุมชน' },
    { id: 'donate', icon: Heart, label: 'บริจาค' },
    { id: 'admin', icon: Settings, label: 'Admin Panel' },
];

export default function TabBar({ activeTab, setActiveTab, isOwner }) {
    return (
        <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
                if (tab.id === 'admin' && !isOwner) return null;
                return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[100px] py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === tab.id ? 'text-white bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}>
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : ''}`} />
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]"></div>}
                    </button>
                );
            })}
        </div>
    );
}

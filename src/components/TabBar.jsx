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

export default function TabBar({ activeTab, setActiveTab, isOwner, tabsConfig = {} }) {
    return (
        <div className="flex border-b border-indigo-500/10 overflow-x-auto scrollbar-hide bg-indigo-950/10">
            {TABS.map(tab => {
                if (tab.id === 'admin' && !isOwner) return null;
                if (tab.id !== 'admin' && tabsConfig[tab.id] === false) return null;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[100px] py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${isActive ? 'text-white bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-indigo-500/5'}`}
                    >
                        <tab.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} />
                        {tab.label}
                        {isActive && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_-2px_10px_rgba(168,85,247,0.5)]"></div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

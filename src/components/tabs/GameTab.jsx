import React from 'react';
import { Trophy, Utensils, Activity, Moon, Sun, Gift, Egg, Smile, Flame, Zap } from 'lucide-react';
import { glassPanel, headingFont } from '../../styles';

const PET_STAGES = {
    egg: { name: "DigiEgg", icon: Egg, color: "text-slate-400", next: "baby", reqExp: 10 },
    baby: { name: "Botamon", icon: Smile, color: "text-pink-400", next: "rookie", reqExp: 100 },
    rookie: { name: "Agumon", icon: Flame, color: "text-orange-500", next: "champion", reqExp: 300 },
    champion: { name: "Greymon", icon: Zap, color: "text-blue-500", next: "ultimate", reqExp: 800 },
    ultimate: { name: "WarGreymon", icon: Trophy, color: "text-yellow-400", next: null, reqExp: 9999 }
};

export default function GameTab({ pet, gameScore, handleAction, handleFaucet }) {
    const stage = PET_STAGES[pet.stage];
    const Icon = stage.icon;
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px] flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl mx-auto space-y-6 text-center">
                <div><h2 className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 ${headingFont}`}>BOOM PET</h2><p className="text-slate-400 text-sm">เลี้ยงมอนสเตอร์ดิจิทัล • ดูแลให้เติบโต (Free to Play)</p></div>
                <div className={`p-6 rounded-3xl ${glassPanel} border-2 border-slate-700 flex flex-col md:flex-row gap-8 items-start justify-center`}>
                    <div className="w-full md:w-1/3 space-y-4 text-left order-2 md:order-1">
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Score</p>
                            <div className="flex items-center gap-2 text-2xl font-bold text-white font-mono"><Trophy className="w-6 h-6 text-yellow-400" />{gameScore.toLocaleString()} BP</div>
                        </div>
                        <div className="space-y-2">
                            {[{ label: "Hunger", value: pet.hunger, color: "bg-orange-500" }, { label: "Happiness", value: pet.happiness, color: "bg-pink-500" }, { label: "Energy", value: pet.energy, color: "bg-blue-500" }].map(({ label, value, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-xs text-slate-400"><span>{label}</span><span>{value}%</span></div>
                                    <div className="w-full bg-slate-800 rounded-full h-2"><div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div></div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button onClick={() => handleAction('feed')} className="py-3 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-600/50 hover:bg-orange-600/40 flex flex-col items-center gap-1 active:scale-95"><Utensils className="w-5 h-5"/> Feed</button>
                            <button onClick={() => handleAction('train')} className="py-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600/40 flex flex-col items-center gap-1 active:scale-95"><Activity className="w-5 h-5"/> Train</button>
                            <button onClick={() => handleAction(pet.isSleeping ? 'wake' : 'sleep')} className={`py-3 rounded-xl border flex flex-col items-center gap-1 active:scale-95 col-span-2 ${pet.isSleeping ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50' : 'bg-purple-600/20 text-purple-400 border-purple-600/50 hover:bg-purple-600/40'}`}>
                                {pet.isSleeping ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>} {pet.isSleeping ? "Wake Up" : "Sleep"}
                            </button>
                        </div>
                    </div>
                    <div className="order-1 md:order-2 bg-slate-900 p-8 rounded-xl shadow-2xl border-4 border-slate-800 flex-1 w-full flex flex-col items-center justify-center relative min-h-[300px]">
                        {pet.isSleeping && <div className="absolute top-4 right-4 text-4xl animate-pulse">zZZ</div>}
                        <div className={`relative ${pet.isSleeping ? 'opacity-50 grayscale' : ''}`}>
                            {pet.stage === 'egg'
                                ? <button onClick={() => handleAction('hatch')} className="animate-bounce"><Icon className={`w-32 h-32 ${stage.color} drop-shadow-2xl`} /><p className="text-center text-xs mt-2 text-slate-400">Click to Hatch!</p></button>
                                : <div className="animate-pulse"><Icon className={`w-32 h-32 ${stage.color} drop-shadow-2xl`} /></div>}
                        </div>
                        <div className="mt-8 text-center">
                            <h3 className="text-2xl font-bold text-white">{stage.name}</h3>
                            <p className="text-slate-400 text-sm capitalize">Stage: {pet.stage}</p>
                            {stage.next && (
                                <div className="mt-4 w-full max-w-[200px]">
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>EXP</span><span>{pet.exp} / {stage.reqExp}</span></div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (pet.exp / stage.reqExp) * 100)}%` }}></div></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {gameScore < 100 && <button onClick={handleFaucet} className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center justify-center gap-1 mx-auto"><Gift className="w-3 h-3"/> ขอรับแต้มฟรี (Faucet)</button>}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';

const STAGES = {
    egg: { next: "baby", reqExp: 10 },
    baby: { next: "rookie", reqExp: 100 },
    rookie: { next: "champion", reqExp: 300 },
    champion: { next: "ultimate", reqExp: 800 },
    ultimate: { next: null, reqExp: 9999 }
};

export function usePet(account, showStatus) {
    const [gameScore, setGameScore] = useState(0);
    const [pet, setPet] = useState({ name: "Egg", stage: "egg", hunger: 100, energy: 100, happiness: 100, exp: 0, age: 0, isSleeping: false, lastTick: Date.now() });

    useEffect(() => {
        const interval = setInterval(() => {
            if (pet.stage === 'egg') return;
            setPet(prev => {
                if (prev.isSleeping) {
                    const newEnergy = Math.min(100, prev.energy + 5);
                    const newHunger = Math.max(0, prev.hunger - 1);
                    if (newEnergy >= 100 && prev.energy < 100) {
                        showStatus("ตื่นแล้ว! พลังเต็มเปี่ยม", "success");
                        return { ...prev, energy: 100, hunger: newHunger, isSleeping: false };
                    }
                    return { ...prev, energy: newEnergy, hunger: newHunger };
                }
                return { ...prev, hunger: Math.max(0, prev.hunger - 2), happiness: Math.max(0, prev.happiness - 1), energy: Math.max(0, prev.energy - 1) };
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [pet.stage, pet.isSleeping]);

    const handleAction = (action) => {
        if (!account) return showStatus("Login First!", "error");
        if (pet.stage === 'egg' && action !== 'hatch') return showStatus("ต้องฟักไข่ก่อน!", "error");
        if (pet.isSleeping && action !== 'wake') return showStatus("น้องหลับอยู่... zZZ", "info");

        setPet(prev => {
            let next = { ...prev };
            switch (action) {
                case 'hatch':
                    if (prev.stage !== 'egg') return prev;
                    next.exp += 5;
                    if (next.exp >= STAGES.egg.reqExp) { next.stage = 'baby'; next.exp = 0; showStatus("ไข่ฟักแล้ว! ยินดีด้วย", "success"); }
                    else showStatus("กำลังฟัก... เขย่าๆ", "info");
                    break;
                case 'feed':
                    if (prev.hunger >= 100) return prev;
                    next.hunger = Math.min(100, prev.hunger + 30); next.exp += 5;
                    showStatus("Yummy! อร่อยจัง (+Exp)", "success");
                    break;
                case 'train':
                    if (prev.energy < 20) { showStatus("เหนื่อยแล้ว! ต้องพักผ่อน", "error"); return prev; }
                    next.energy -= 20; next.happiness = Math.min(100, prev.happiness + 10); next.exp += 15;
                    showStatus("Training! แข็งแกร่งขึ้น (+Exp)", "success");
                    break;
                case 'sleep': next.isSleeping = true; showStatus("Good Night! zZZ", "info"); break;
                case 'wake': next.isSleeping = false; showStatus("ตื่นแล้ว!", "info"); break;
                default: break;
            }
            const stage = STAGES[next.stage];
            if (stage.next && next.exp >= stage.reqExp) {
                next.stage = stage.next; next.exp = 0; next.happiness = next.energy = next.hunger = 100;
                setGameScore(s => s + 500);
                showStatus(`🎉 EVOLUTION! (+500 BP)`, "success");
            }
            return next;
        });
    };

    const handleFaucet = () => { setGameScore(prev => prev + 500); showStatus("รับฟรี 500 BP สำเร็จ!", "success"); };

    return { pet, gameScore, handleAction, handleFaucet };
}

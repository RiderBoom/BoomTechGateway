import React, { useState, useRef, useEffect } from 'react';
import { Bot, Users, X, Sparkles, Zap } from 'lucide-react';
import { glassPanel, glassInput } from '../styles';

export default function AiChatbot({ coinSymbol, currentPrice, priceChange, marketStats, fearGreed }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 1, sender: 'bot', text: 'สวัสดีครับ! ผมคือ BoomBot AI (Powered by Gemini) 🤖 ถามเรื่องราคาเหรียญ วิเคราะห์กราฟ หรือความรู้ Crypto ได้เลยครับ!' }]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const endRef = useRef(null);

    useEffect(() => { if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const query = input;
        setInput("");
        setIsTyping(true);
        try {
            const systemPrompt = `You are BoomBot AI, an intelligent crypto assistant. Current Market Context: Active Coin: ${coinSymbol}, Price: $${currentPrice.toLocaleString()}, 24h Change: ${priceChange.toFixed(2)}%, Market Cap: $${marketStats.marketCap.toLocaleString()}, Fear & Greed: ${fearGreed.value} (${fearGreed.status}). Role: Crypto assistant. Tone: Friendly, professional. Language: Thai.`;
            const apiKey = import.meta.env.VITE_GEMINI_KEY || "";
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: query }] }], systemInstruction: { parts: [{ text: systemPrompt }] } })
            });
            const data = await response.json();
            const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัย ผมไม่สามารถประมวลผลคำตอบได้";
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botText }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: `เกิดข้อผิดพลาด: ${error.message}` }]);
        } finally { setIsTyping(false); }
    };

    return (
        <>
            <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl shadow-indigo-600/40 transition-all hover:scale-110 active:scale-95">
                <Bot className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            </button>
            {isOpen && (
                <div className={`fixed bottom-24 right-6 w-[350px] md:w-96 h-[500px] ${glassPanel} rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden`}>
                    <div className="bg-indigo-600 p-4 flex justify-between items-center border-b border-indigo-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1.5 rounded-lg"><Sparkles className="w-5 h-5 text-white"/></div>
                            <div><h3 className="font-bold text-white text-sm">AI Crypto Guru</h3><div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span><p className="text-[10px] text-indigo-100">Online & Ready</p></div></div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/80">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'bot' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                    {msg.sender === 'bot' ? <Bot className="w-5 h-5 text-white" /> : <Users className="w-4 h-4 text-slate-300" />}
                                </div>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-indigo-900/40 border border-indigo-500/20 text-indigo-100 rounded-tl-none'}`}>{msg.text}</div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
                                <div className="bg-indigo-900/40 border border-indigo-500/20 px-4 py-3 rounded-2xl rounded-tl-none">
                                    <div className="flex gap-1">{[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: `${d}ms`}}></div>)}</div>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-3 bg-slate-900/90 border-t border-slate-800 flex gap-2 items-center">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ถามราคาเหรียญ..." className={`flex-1 ${glassInput} rounded-full px-4 py-2.5 text-sm`}/>
                        <button type="submit" disabled={!input.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-full"><Zap className="w-4 h-4 fill-current" /></button>
                    </form>
                </div>
            )}
        </>
    );
}

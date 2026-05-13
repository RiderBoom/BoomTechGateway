import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, AlertTriangle, Shield, Image as ImageIcon, X } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { glassPanel, glassButton, glassInput, headingFont } from '../../styles';

export default function CommunityTab({ db, appId, firebaseUser, account, dbError, chatMessages, showStatus }) {
    const [chatInput, setChatInput] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 500 * 1024) return showStatus("รูปภาพต้องมีขนาดไม่เกิน 500KB", "error");
        const reader = new FileReader();
        reader.onloadend = () => setSelectedImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!chatInput.trim() && !selectedImage) || !db) return;
        const senderName = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : `Guest-${Math.floor(Math.random()*1000)}`;
        const avatar = account ? `https://api.dicebear.com/7.x/identicon/svg?seed=${account}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_chat'), { text: chatInput, image: selectedImage, sender: senderName, isWallet: !!account, avatar, timestamp: Date.now() });
            setChatInput(""); setSelectedImage(null);
        } catch { showStatus("ส่งข้อความไม่สำเร็จ", "error"); }
    };

    const myName = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

    return (
        <div className="flex flex-col h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4"><div className="bg-blue-900/30 p-2 rounded-lg"><MessageSquare className="w-6 h-6 text-blue-400"/></div><div><h2 className={`text-xl font-bold text-white ${headingFont}`}>Community Chat</h2><p className="text-xs text-slate-400">พื้นที่พูดคุยแลกเปลี่ยนสำหรับชาว BoomTech</p></div></div>
            {dbError && (<div className="mb-4 bg-red-900/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 text-red-200 text-xs"><AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" /><span>{dbError}</span></div>)}
            <div className={`flex-1 rounded-xl overflow-hidden flex flex-col shadow-inner relative ${glassPanel}`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2"><MessageSquare className="w-12 h-12 opacity-20"/><p>ยังไม่มีข้อความ เริ่มต้นทักทายได้เลย!</p></div>
                        : chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === myName ? 'flex-row-reverse' : ''}`}>
                                <img src={msg.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0" />
                                <div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === myName ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                                    <div className="flex items-center gap-2 mb-1"><span className={`text-[10px] font-bold ${msg.sender === myName ? 'text-blue-200' : 'text-slate-400'}`}>{msg.sender}</span>{msg.isWallet && <Shield className="w-3 h-3 text-emerald-400" />}<span className="text-[9px] opacity-60 ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                    {msg.image && <div className="mb-2 rounded-lg overflow-hidden"><img src={msg.image} alt="attached" className="max-w-full h-auto max-h-60 object-cover" /></div>}
                                    {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}
                                </div>
                            </div>
                        ))}
                    <div ref={chatEndRef} />
                </div>
                {selectedImage && (<div className="absolute bottom-[70px] left-4 right-4 bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg border border-slate-600 flex items-center justify-between z-10"><div className="flex items-center gap-3 overflow-hidden"><img src={selectedImage} alt="Preview" className="h-12 w-12 object-cover rounded-md border border-slate-500" /><span className="text-xs text-slate-300 truncate">พร้อมส่งรูปภาพ...</span></div><button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>)}
                <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden"/>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full ${glassButton}`}><ImageIcon className="w-5 h-5" /></button>
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={account ? "พิมพ์ข้อความ..." : "เชื่อมต่อกระเป๋าเพื่อแชท"} disabled={!account} className={`flex-1 rounded-full px-4 py-2 text-sm ${glassInput}`}/>
                    <button type="submit" disabled={(!chatInput.trim() && !selectedImage) || !account} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center"><Send className="w-4 h-4 ml-0.5" /></button>
                </form>
            </div>
        </div>
    );
}

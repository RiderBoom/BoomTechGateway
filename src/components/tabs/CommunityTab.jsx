import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, AlertTriangle, Shield, Image as ImageIcon, X, Trash2, UserX, Ban, Flag, EyeOff } from 'lucide-react';
import { addDoc, deleteDoc, setDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { glassPanel, glassButton, glassInput, headingFont } from '../../styles';
import ReportModal from '../ReportModal';

export default function CommunityTab({ db, appId, account, dbError, chatMessages, showStatus, isOwner, bannedUsers }) {
    const [chatInput, setChatInput] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [reportTarget, setReportTarget] = useState(null);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const isBanned = account && bannedUsers?.some(u => u.id.toLowerCase() === account.toLowerCase());

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
        if (isBanned) return showStatus("คุณถูกแบนจากชุมชน", "error");
        const senderName = account
            ? `${account.slice(0, 6)}...${account.slice(-4)}`
            : `Guest-${Math.floor(Math.random() * 1000)}`;
        const avatar = account
            ? `https://api.dicebear.com/7.x/identicon/svg?seed=${account}`
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_chat'), {
                text: chatInput,
                image: selectedImage,
                sender: senderName,
                walletAddress: account || null,
                isWallet: !!account,
                avatar,
                timestamp: Date.now(),
            });
            setChatInput(""); setSelectedImage(null);
        } catch { showStatus("ส่งข้อความไม่สำเร็จ", "error"); }
    };

    const deleteMessage = async (msgId) => {
        if (!db || !isOwner) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'community_chat', msgId));
            showStatus("ลบข้อความแล้ว", "info");
        } catch (err) { showStatus("ลบไม่สำเร็จ: " + err.message, "error"); }
    };

    const restoreMessage = async (msgId) => {
        if (!db || !isOwner) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'community_chat', msgId), {
                contentStatus: 'active', restoredBy: account, restoredAt: Date.now(),
            });
            showStatus("เลิกซ่อนข้อความแล้ว", "success");
        } catch (err) { showStatus("ไม่สำเร็จ: " + err.message, "error"); }
    };

    const banUser = async (walletAddress, senderName) => {
        if (!db || !isOwner || !walletAddress) return showStatus("ไม่มีข้อมูล Wallet เพื่อแบน", "error");
        const addr = walletAddress.toLowerCase();
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'banned_users', addr), {
                address: addr,
                senderName,
                bannedAt: Date.now(),
                bannedBy: account,
            });
            showStatus(`แบน ${senderName} เรียบร้อย`, "info");
        } catch (err) { showStatus("แบนไม่สำเร็จ: " + err.message, "error"); }
    };

    const myName = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

    return (
        <div className="flex flex-col h-[620px] animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-900/30 p-2 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-purple-400"/>
                </div>
                <div>
                    <h2 className={`text-xl font-bold text-white ${headingFont}`}>Community Chat</h2>
                    <p className="text-xs text-slate-400">พื้นที่พูดคุยแลกเปลี่ยนสำหรับชาว BoomTech</p>
                </div>
                {isOwner && (
                    <div className="ml-auto flex items-center gap-2 bg-purple-500/10 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/20 text-xs font-bold">
                        <Shield className="w-3 h-3"/> Admin Mode · {chatMessages.length} ข้อความ
                    </div>
                )}
            </div>

            {dbError && (
                <div className="mb-4 bg-red-900/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 text-red-200 text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{dbError}</span>
                </div>
            )}

            {isBanned && (
                <div className="mb-4 bg-red-900/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-2 text-red-300 text-sm justify-center">
                    <Ban className="w-4 h-4"/> คุณถูกแบนจากชุมชน
                </div>
            )}

            <div className={`flex-1 rounded-xl overflow-hidden flex flex-col shadow-inner relative ${glassPanel}`}>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                            <MessageSquare className="w-12 h-12 opacity-20"/>
                            <p>ยังไม่มีข้อความ เริ่มต้นทักทายได้เลย!</p>
                        </div>
                    ) : chatMessages
                        .filter(msg => isOwner ? true : !msg.contentStatus || msg.contentStatus === 'active')
                        .map((msg) => {
                        const isHidden = msg.contentStatus === 'hidden';
                        return (
                        <div key={msg.id} className={`flex items-start gap-2 group ${msg.sender === myName ? 'flex-row-reverse' : ''} ${isHidden ? 'opacity-50' : ''}`}>
                            <img src={msg.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-800 border border-purple-500/20 flex-shrink-0 mt-1" />
                            <div className={`flex flex-col max-w-[80%] ${msg.sender === myName ? 'items-end' : 'items-start'}`}>
                                {isHidden && isOwner && (
                                    <span className="text-[9px] bg-yellow-900/50 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded mb-1 font-bold tracking-wide">
                                        ซ่อนอยู่ (HIDDEN)
                                    </span>
                                )}
                                <div className={`rounded-2xl p-3 ${msg.sender === myName ? 'bg-purple-700/70 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 rounded-tl-none'} ${isHidden ? 'border border-yellow-500/20' : ''}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold ${msg.sender === myName ? 'text-purple-200' : 'text-purple-400'}`}>{msg.sender}</span>
                                        {msg.isWallet && <Shield className="w-3 h-3 text-emerald-400"/>}
                                        <span className="text-[9px] opacity-60 ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    {msg.image && <div className="mb-2 rounded-lg overflow-hidden"><img src={msg.image} alt="attached" className="max-w-full h-auto max-h-60 object-cover"/></div>}
                                    {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}
                                </div>

                                {/* Controls on hover — admin: ซ่อน/เลิกซ่อน+แบน+รายงาน / user: รายงาน */}
                                {(isOwner || (account && msg.sender !== myName)) && (
                                    <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === myName ? 'flex-row-reverse' : ''}`}>
                                        {isOwner && !isHidden && (
                                            <button
                                                onClick={() => deleteMessage(msg.id)}
                                                className="flex items-center gap-1 text-[10px] bg-red-900/50 hover:bg-red-800/70 text-red-300 px-2 py-0.5 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3"/> ลบ
                                            </button>
                                        )}
                                        {isOwner && isHidden && (
                                            <button
                                                onClick={() => restoreMessage(msg.id)}
                                                className="flex items-center gap-1 text-[10px] bg-yellow-900/50 hover:bg-yellow-800/70 text-yellow-300 px-2 py-0.5 rounded-lg transition-colors"
                                            >
                                                <EyeOff className="w-3 h-3"/> เลิกซ่อน
                                            </button>
                                        )}
                                        {isOwner && msg.walletAddress && msg.sender !== myName && (
                                            <button
                                                onClick={() => banUser(msg.walletAddress, msg.sender)}
                                                className="flex items-center gap-1 text-[10px] bg-orange-900/50 hover:bg-orange-800/70 text-orange-300 px-2 py-0.5 rounded-lg transition-colors"
                                            >
                                                <UserX className="w-3 h-3"/> แบน
                                            </button>
                                        )}
                                        {account && msg.sender !== myName && (
                                            <button
                                                onClick={() => setReportTarget({ ...msg, type: 'chat_message' })}
                                                className="flex items-center gap-1 text-[10px] bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 px-2 py-0.5 rounded-lg transition-colors"
                                            >
                                                <Flag className="w-3 h-3"/> รายงาน
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                    <div ref={chatEndRef} />
                </div>

                {/* Image preview */}
                {selectedImage && (
                    <div className="absolute bottom-[70px] left-4 right-4 bg-slate-800/95 backdrop-blur-sm p-3 rounded-lg border border-purple-500/20 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <img src={selectedImage} alt="Preview" className="h-12 w-12 object-cover rounded-md border border-purple-500/20"/>
                            <span className="text-xs text-slate-300 truncate">พร้อมส่งรูปภาพ...</span>
                        </div>
                        <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 bg-slate-900/80 border-t border-purple-500/10 flex gap-2 items-center">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden"/>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full ${glassButton}`}>
                        <ImageIcon className="w-5 h-5"/>
                    </button>
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={isBanned ? "คุณถูกแบน" : account ? "พิมพ์ข้อความ..." : "เชื่อมต่อกระเป๋าเพื่อแชท"}
                        disabled={!account || isBanned}
                        className={`flex-1 rounded-full px-4 py-2 text-sm ${glassInput}`}
                    />
                    <button
                        type="submit"
                        disabled={(!chatInput.trim() && !selectedImage) || !account || isBanned}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                    >
                        <Send className="w-4 h-4 ml-0.5"/>
                    </button>
                </form>
            </div>
            {reportTarget && (
                <ReportModal
                    db={db}
                    appId={appId}
                    account={account}
                    target={reportTarget}
                    onClose={() => setReportTarget(null)}
                    onSuccess={() => showStatus('ส่งรายงานเรียบร้อย ขอบคุณที่ช่วยดูแลชุมชน 🙏', 'success')}
                />
            )}
        </div>
    );
}

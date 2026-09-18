import React, { useState } from 'react';
import { FlaskConical, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * SandboxBanner — แสดงเมื่อ SANDBOX_MODE = true
 * แถบเตือนสีเหลืองถาวรด้านบนสุด ย่อ/ขยายได้ แต่ปิดไม่ได้
 */
export default function SandboxBanner() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="w-full bg-gradient-to-r from-amber-500/90 via-yellow-500/90 to-amber-500/90 text-amber-950 shadow-lg shadow-amber-500/20 border-b border-amber-400/50 backdrop-blur-sm">
            {/* Main bar */}
            <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                    <FlaskConical className="w-4 h-4" />
                    <span className="text-xs font-black tracking-wider uppercase">Sandbox Demo</span>
                </div>
                <div className="flex-1 text-xs font-semibold text-center">
                    ระบบทดสอบ — <span className="font-black">ไม่มีการตัดเงินจริง</span> ทุกธุรกรรมเป็นการจำลอง
                </div>
                <button
                    onClick={() => setExpanded(v => !v)}
                    className="shrink-0 flex items-center gap-1 text-[10px] font-bold bg-amber-900/20 hover:bg-amber-900/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                    {expanded ? <><ChevronUp className="w-3 h-3"/> ย่อ</> : <><ChevronDown className="w-3 h-3"/> รายละเอียด</>}
                </button>
            </div>

            {/* Expandable detail */}
            {expanded && (
                <div className="max-w-6xl mx-auto px-4 pb-4 pt-1">
                    <div className="bg-amber-900/10 border border-amber-700/20 rounded-xl p-4 space-y-2.5">
                        <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
                            <FlaskConical className="w-3.5 h-3.5 shrink-0"/>
                            ระบบนี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการทดสอบระบบและแสดงผลงาน (Portfolio / MVP) เท่านั้น
                        </p>
                        <ul className="text-[11px] text-amber-900/80 space-y-1.5 leading-relaxed list-none">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-700 font-black shrink-0 mt-0.5">✕</span>
                                <span>ธุรกรรม Crypto ทั้งหมดเป็นการจำลอง — <strong>ไม่มีการส่ง ETH / Token จริง</strong>ผ่าน Blockchain</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-700 font-black shrink-0 mt-0.5">✕</span>
                                <span>PromptPay / QR Code ที่ปรากฏเป็นข้อมูลสาธิต — <strong>ห้ามโอนเงินจริง</strong>มายังเลขดังกล่าว</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-700 font-black shrink-0 mt-0.5">✕</span>
                                <span>สินค้าและราคาทั้งหมดเป็นข้อมูลสมมุติ ไม่มีการจัดส่งสินค้าจริง</span>
                            </li>
                        </ul>
                        <p className="text-[10px] text-amber-800/60 border-t border-amber-700/20 pt-2">
                            เว็บไซต์นี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการทดสอบระบบและพัฒนาซอฟต์แวร์ภายในเท่านั้น ข้อมูลและธุรกรรมทั้งหมดในระบบเป็นสิ่งสมมุติ ไม่มีการเรียกเก็บค่าใช้จ่ายใดๆ จากผู้ใช้งาน
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

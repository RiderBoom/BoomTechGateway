import React, { useState } from 'react';
import { Flag, X, Send, RefreshCw, CheckCircle } from 'lucide-react';
import { submitReport } from '../utils/submitReport';

const REASONS = [
  { id: 'pornography', label: 'เนื้อหาลามกอนาจาร',     emoji: '🔞' },
  { id: 'gambling',    label: 'การพนัน / ลิงก์พนัน',   emoji: '🎰' },
  { id: 'fraud',       label: 'หลอกลวง / ฉ้อโกง',      emoji: '⚠️' },
  { id: 'malware',     label: 'ลิงก์อันตราย',           emoji: '🦠' },
  { id: 'violence',    label: 'ความรุนแรง / ข่มขู่',    emoji: '🔴' },
  { id: 'defamation',  label: 'หมิ่นประมาท',            emoji: '⚖️' },
  { id: 'spam',        label: 'สแปม / โฆษณาผิดกฎ',     emoji: '📢' },
  { id: 'other',       label: 'อื่นๆ (โปรดระบุ)',        emoji: '📝' },
];

const MAX_DETAILS = 300;

/**
 * Props:
 *  db, appId, account — Firebase context
 *  target — object with: { id, type, text, image, sender, walletAddress, avatar }
 *  onClose() — ปิด modal
 *  onSuccess() — callback หลัง submit สำเร็จ
 */
const ReportModal = ({ db, appId, account, target, onClose, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const reasonObj = REASONS.find(r => r.id === selectedReason);
  const requiresDetails = selectedReason === 'other';
  const canSubmit = selectedReason && (!requiresDetails || details.trim().length >= 5);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      await submitReport(db, appId, {
        reason: selectedReason,
        reasonLabel: reasonObj?.label || selectedReason,
        details: details.trim(),
        reportedBy: account || 'Guest',
        targetId: target.id || null,
        targetType: target.type || 'chat_message',
        targetContent: target.text || target.content || '',
        targetSender: target.sender || '-',
        targetWallet: target.walletAddress || null,
      });
      setSubmitted(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 2000);
    } catch (err) {
      setError('ส่งรายงานไม่สำเร็จ: ' + (err.message || 'ลองใหม่อีกครั้ง'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl bg-[#0b1221] border border-red-500/20 shadow-2xl shadow-red-900/20 overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-red-500/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-900/30 border border-red-500/20">
              <Flag size={15} className="text-red-400" />
            </div>
            <h2 id="report-modal-title" className="text-sm font-bold text-slate-100">
              รายงานความไม่เหมาะสม
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center animate-scale-in">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-100 font-semibold">ส่งรายงานเรียบร้อยแล้ว</p>
              <p className="text-slate-400 text-sm mt-1">ทีมงานจะตรวจสอบและดำเนินการโดยเร็ว</p>
            </div>
          </div>
        ) : (
          <>
            {/* Content preview */}
            <div className="px-5 pt-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">เนื้อหาที่รายงาน</p>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-start gap-2.5">
                {target.avatar && (
                  <img src={target.avatar} alt="" className="w-7 h-7 rounded-full bg-slate-800 shrink-0 border border-slate-700 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">{target.sender || 'ไม่ระบุ'}</p>
                  {target.image && <p className="text-[10px] text-slate-500 italic mb-0.5">[มีรูปภาพแนบ]</p>}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 break-all">
                    {target.text || '(ไม่มีข้อความ)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason grid */}
            <div className="px-5 pt-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
                เหตุผลในการรายงาน <span className="text-red-400">*</span>
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {REASONS.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all duration-150 select-none
                      ${selectedReason === r.id
                        ? 'bg-red-900/40 border-red-500/60 text-red-200 shadow-sm shadow-red-900/30'
                        : 'border-slate-700/50 text-slate-500 hover:border-slate-600/70 hover:text-slate-300 bg-slate-900/30'
                      }`}
                  >
                    <span className="text-[15px] leading-none">{r.emoji}</span>
                    <span className="text-[9px] leading-tight font-medium px-0.5">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="px-5 pt-3 pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  รายละเอียดเพิ่มเติม
                  {requiresDetails && <span className="text-red-400 ml-1">* (จำเป็น)</span>}
                </p>
                <span className={`text-[10px] tabular-nums ${details.length > MAX_DETAILS * 0.9 ? 'text-red-400' : 'text-slate-600'}`}>
                  {details.length}/{MAX_DETAILS}
                </span>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, MAX_DETAILS))}
                placeholder={requiresDetails ? 'โปรดอธิบายเหตุผลให้ชัดเจน (อย่างน้อย 5 ตัวอักษร)' : 'ระบุรายละเอียดเพิ่มเติม เช่น ลิงก์ที่พบ หรือข้อมูลอื่นที่เป็นประโยชน์ (ไม่บังคับ)'}
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 resize-none bg-slate-950/60 border border-indigo-500/10 focus:border-red-500/30 outline-none transition-all leading-relaxed"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="px-5 pb-3 text-xs text-red-400 flex items-center gap-1.5">
                <span className="shrink-0">⚠</span> {error}
              </p>
            )}

            {/* Footer */}
            <div className="flex gap-2 px-5 pb-5 border-t border-red-500/5 pt-4">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-40"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 active:scale-[0.98] text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-red-900/30"
              >
                {isSubmitting
                  ? <><RefreshCw size={13} className="animate-spin" />กำลังส่ง...</>
                  : <><Send size={13} />ส่งรายงาน</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;

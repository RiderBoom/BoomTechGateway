import React, { useState } from 'react';
import { ShieldAlert, X, EyeOff, Trash2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { takedownContent } from '../utils/takedownContent';

const LEGAL_REASONS = [
  {
    id: 'computer_crime_14',
    label: 'พ.ร.บ. คอมพิวเตอร์ มาตรา 14',
    desc: 'นำเข้าข้อมูลปลอม/เท็จ, เนื้อหาลามก, ภัยต่อความมั่นคง',
    color: 'red',
  },
  {
    id: 'computer_crime_15',
    label: 'พ.ร.บ. คอมพิวเตอร์ มาตรา 15',
    desc: 'ผู้ให้บริการรู้เห็นหรือยินยอมให้มีการกระทำผิดมาตรา 14',
    color: 'red',
  },
  {
    id: 'pdpa',
    label: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
    desc: 'เปิดเผยข้อมูลส่วนบุคคลโดยไม่ได้รับความยินยอม',
    color: 'orange',
  },
  {
    id: 'platform_gambling',
    label: 'นโยบายแพลตฟอร์ม: การพนัน',
    desc: 'โฆษณา ลิงก์ หรือส่งเสริมการพนันออนไลน์',
    color: 'yellow',
  },
  {
    id: 'platform_fraud',
    label: 'นโยบายแพลตฟอร์ม: หลอกลวง/ฉ้อโกง',
    desc: 'Scam, Phishing, ข้อมูลเท็จที่ก่อให้เกิดความเสียหาย',
    color: 'yellow',
  },
  {
    id: 'platform_spam',
    label: 'นโยบายแพลตฟอร์ม: สแปม',
    desc: 'เนื้อหาซ้ำ หรือโฆษณาที่ไม่ได้รับอนุญาต',
    color: 'slate',
  },
  {
    id: 'other',
    label: 'เหตุผลอื่น (โปรดระบุในหมายเหตุ)',
    desc: '',
    color: 'slate',
  },
];

const COLOR_CLASSES = {
  red:    'border-red-500/40 bg-red-900/20 text-red-300',
  orange: 'border-orange-500/40 bg-orange-900/20 text-orange-300',
  yellow: 'border-yellow-500/40 bg-yellow-900/20 text-yellow-300',
  slate:  'border-slate-600/50 bg-slate-800/40 text-slate-300',
};

const COLOR_SELECTED = {
  red:    'border-red-400 bg-red-900/40 ring-1 ring-red-500/50',
  orange: 'border-orange-400 bg-orange-900/40 ring-1 ring-orange-500/50',
  yellow: 'border-yellow-400 bg-yellow-900/40 ring-1 ring-yellow-500/50',
  slate:  'border-slate-400 bg-slate-700/60 ring-1 ring-slate-500/50',
};

/**
 * Props:
 *  db, appId, account   — Firebase context
 *  content              — { id, contentType, text, sender, walletAddress, ... }
 *  action               — 'hide' | 'delete'
 *  reportId             — optional report doc ID
 *  onClose()
 *  onSuccess()
 */
const TakedownModal = ({ db, appId, account, content, action, reportId, onClose, onSuccess }) => {
  const [legalReason, setLegalReason] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const isHide = action === 'hide';
  const reasonObj = LEGAL_REASONS.find(r => r.id === legalReason);
  const canConfirm = !!legalReason && (legalReason !== 'other' || note.trim().length >= 5);

  const handleConfirm = async () => {
    if (!canConfirm || isProcessing) return;
    setError('');
    setIsProcessing(true);
    try {
      await takedownContent(db, appId, {
        content,
        action,
        legalReason,
        legalReasonLabel: reasonObj?.label || legalReason,
        note: note.trim(),
        actionBy: account,
        reportId,
      });
      setDone(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1800);
    } catch (err) {
      setError('ดำเนินการไม่สำเร็จ: ' + (err.message || 'ลองใหม่อีกครั้ง'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="takedown-title"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1221] border border-orange-500/25 shadow-2xl shadow-orange-900/20 overflow-hidden animate-slide-up">

        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isHide ? 'border-yellow-500/15' : 'border-red-500/15'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isHide ? 'bg-yellow-900/30 border border-yellow-500/20' : 'bg-red-900/30 border border-red-500/20'}`}>
              {isHide ? <EyeOff size={16} className="text-yellow-400" /> : <Trash2 size={16} className="text-red-400" />}
            </div>
            <div>
              <h2 id="takedown-title" className="text-sm font-bold text-slate-100">
                {isHide ? 'ซ่อนเนื้อหา (Take-down)' : 'ลบเนื้อหาถาวร (Hard Delete)'}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isHide ? 'เนื้อหาจะถูกซ่อน สามารถคืนสถานะได้ภายหลัง' : 'เนื้อหาจะถูกลบถาวร ไม่สามารถกู้คืนได้'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30"
          >
            <X size={15} />
          </button>
        </div>

        {done ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center animate-scale-in">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-100 font-semibold">
                {isHide ? 'ซ่อนเนื้อหาเรียบร้อยแล้ว' : 'ลบเนื้อหาเรียบร้อยแล้ว'}
              </p>
              <p className="text-slate-400 text-sm mt-1">บันทึก Audit Log สำเร็จแล้ว</p>
            </div>
          </div>
        ) : (
          <>
            {/* Content preview */}
            <div className="px-5 pt-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">เนื้อหาที่จะดำเนินการ</p>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/60">
                <p className="text-[10px] font-mono text-slate-500 mb-1">
                  {content.sender || '-'}
                  {content.id && <span className="ml-2 opacity-50">#{content.id.substring(0, 8)}</span>}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed break-all line-clamp-4">
                  {content.text || content.content || '(ไม่มีข้อความ)'}
                </p>
              </div>
            </div>

            {/* Legal reason */}
            <div className="px-5 pt-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
                เหตุผลทางกฎหมาย / นโยบาย <span className="text-red-400">*</span>
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {LEGAL_REASONS.map(r => {
                  const isSelected = legalReason === r.id;
                  const base = COLOR_CLASSES[r.color];
                  const selected = COLOR_SELECTED[r.color];
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setLegalReason(r.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${isSelected ? selected : base + ' hover:brightness-125'}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all
                          ${isSelected ? 'border-current bg-current' : 'border-current/40'}`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#0b1221]" />}
                        </span>
                        <div>
                          <p className="text-xs font-semibold leading-tight">{r.label}</p>
                          {r.desc && <p className="text-[10px] opacity-70 mt-0.5 leading-relaxed">{r.desc}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div className="px-5 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  หมายเหตุแอดมิน {legalReason === 'other' && <span className="text-red-400">* (จำเป็น)</span>}
                </p>
                <span className="text-[10px] text-slate-600 tabular-nums">{note.length}/300</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 300))}
                placeholder="บันทึกเหตุผลเพิ่มเติมสำหรับ Audit Trail..."
                rows={2}
                className="w-full rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 resize-none bg-slate-950/60 border border-indigo-500/10 focus:border-orange-500/30 outline-none transition-all"
              />
            </div>

            {/* Delete warning */}
            {!isHide && (
              <div className="mx-5 mt-3 p-3 rounded-xl bg-red-950/40 border border-red-500/25 flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300 leading-relaxed">
                  การลบถาวรจะลบเนื้อหาออกจากฐานข้อมูลทันที แต่ <strong>Audit Log จะยังคงบันทึกไว้</strong> เพื่อเป็นหลักฐานทางกฎหมาย การดำเนินการนี้ไม่สามารถยกเลิกได้
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="px-5 mt-2 text-xs text-red-400 flex items-center gap-1.5">
                <span>⚠</span> {error}
              </p>
            )}

            {/* Footer */}
            <div className="flex gap-2 px-5 py-5 border-t border-slate-800/60 mt-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-40"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm || isProcessing}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg
                  ${isHide
                    ? 'bg-yellow-700 hover:bg-yellow-600 shadow-yellow-900/30'
                    : 'bg-red-700 hover:bg-red-600 shadow-red-900/30'
                  }`}
              >
                {isProcessing
                  ? <><RefreshCw size={13} className="animate-spin" />กำลังดำเนินการ...</>
                  : isHide
                    ? <><EyeOff size={13} />ยืนยันซ่อนเนื้อหา</>
                    : <><Trash2 size={13} />ยืนยันลบถาวร</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TakedownModal;

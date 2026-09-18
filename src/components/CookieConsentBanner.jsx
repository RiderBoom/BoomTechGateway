import React, { useState } from 'react';
import { Cookie, X, ChevronDown, ChevronUp, Shield, BarChart2, Megaphone, Settings2 } from 'lucide-react';

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors duration-200
      ${disabled ? 'cursor-not-allowed opacity-50 border-indigo-500/30 bg-indigo-900/40'
        : checked ? 'cursor-pointer border-indigo-500 bg-indigo-600'
        : 'cursor-pointer border-slate-600 bg-slate-700 hover:border-slate-500'}`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
    />
  </button>
);

// ─── Cookie Category Row ──────────────────────────────────────────────────────
const CategoryRow = ({ icon: Icon, title, description, checked, onChange, disabled = false, alwaysOn = false }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-indigo-500/10 rounded-xl bg-indigo-950/30 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-900/50 text-indigo-400">
          {React.createElement(Icon, { size: 16 })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">{title}</span>
            {alwaysOn && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-500/20">
                เปิดอยู่เสมอ
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Toggle checked={checked} onChange={onChange} disabled={disabled} />
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={open ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด'}
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-xs text-slate-400 leading-relaxed pl-12">{description}</p>
        </div>
      )}
    </div>
  );
};

// ─── Settings Modal ───────────────────────────────────────────────────────────
const SettingsModal = ({ initialConsent, onSave, onRejectAll, onClose }) => {
  const [draft, setDraft] = useState({
    analytics: !!initialConsent.analytics,
    marketing: !!initialConsent.marketing,
    preferences: !!initialConsent.preferences,
  });

  const set = (key) => (val) => setDraft(prev => ({ ...prev, [key]: val }));

  const categories = [
    {
      key: 'necessary',
      icon: Shield,
      title: 'คุกกี้ที่จำเป็น (Necessary)',
      description: 'คุกกี้เหล่านี้จำเป็นสำหรับการทำงานของเว็บไซต์ เช่น การรักษาสถานะล็อกอิน ความปลอดภัย และการตั้งค่าพื้นฐาน ไม่สามารถปิดใช้งานได้',
      checked: true,
      disabled: true,
      alwaysOn: true,
    },
    {
      key: 'analytics',
      icon: BarChart2,
      title: 'คุกกี้การวิเคราะห์ (Analytics)',
      description: 'ช่วยให้เราเข้าใจวิธีที่ผู้ใช้โต้ตอบกับแพลตฟอร์ม เช่น จำนวนผู้เข้าชม หน้าที่ได้รับความนิยม และเส้นทางการใช้งาน ข้อมูลทั้งหมดเป็นข้อมูลรวม (Aggregated) ไม่ระบุตัวตน',
      checked: draft.analytics,
      onChange: set('analytics'),
    },
    {
      key: 'marketing',
      icon: Megaphone,
      title: 'คุกกี้การตลาด (Marketing)',
      description: 'ใช้เพื่อแสดงโฆษณาและเนื้อหาที่เกี่ยวข้องกับความสนใจของท่าน รวมถึงการวัดประสิทธิภาพของแคมเปญโฆษณา ต้องได้รับความยินยอมก่อนเปิดใช้งาน (Opt-in) ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล',
      checked: draft.marketing,
      onChange: set('marketing'),
    },
    {
      key: 'preferences',
      icon: Settings2,
      title: 'คุกกี้การตั้งค่า (Preferences)',
      description: 'จดจำการตั้งค่าของท่าน เช่น ภาษา ธีม และค่าที่กำหนดเอง เพื่อมอบประสบการณ์ที่ปรับให้เหมาะกับท่านในการเข้าชมครั้งถัดไป',
      checked: draft.preferences,
      onChange: set('preferences'),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1221] border border-indigo-500/20 shadow-2xl shadow-indigo-900/40 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-indigo-500/10">
          <div className="flex items-center gap-2">
            <Cookie size={18} className="text-indigo-400" />
            <h2 id="cookie-settings-title" className="text-base font-bold text-slate-100">
              ตั้งค่าความเป็นส่วนตัว
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-200 hover:bg-indigo-900/40 transition-colors"
            aria-label="ปิด"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-400 leading-relaxed mb-1">
            เลือกประเภทคุกกี้ที่ท่านยินยอมให้เราใช้งาน คุกกี้ที่จำเป็นจะถูกเปิดใช้งานเสมอเพื่อให้เว็บไซต์ทำงานได้ตามปกติ
            คุกกี้ประเภท Marketing และ Analytics จะ <strong className="text-slate-300">ไม่ทำงานจนกว่าท่านจะยินยอม</strong> ตามมาตรฐาน PDPA
          </p>

          {categories.map(({ key, icon, title, description, checked, onChange, disabled, alwaysOn }) => (
            <CategoryRow
              key={key}
              icon={icon}
              title={title}
              description={description}
              checked={checked}
              onChange={onChange}
              disabled={disabled}
              alwaysOn={alwaysOn}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 p-5 border-t border-indigo-500/10">
          <button
            onClick={onRejectAll}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 hover:border-slate-500 transition-colors"
          >
            ปฏิเสธทั้งหมด
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/40"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Banner ──────────────────────────────────────────────────────────────
const CookieConsentBanner = ({ consent, showBanner, showSettings, setShowSettings, acceptAll, rejectAll, saveCustom }) => {
  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Bottom Banner */}
      {showBanner && !showSettings && (
        <div
          role="region"
          aria-label="แจ้งเตือนคุกกี้"
          className="fixed bottom-0 inset-x-0 z-[9998] p-3 sm:p-4 animate-slide-up"
        >
          <div className="max-w-4xl mx-auto rounded-2xl bg-[#0b1221]/95 backdrop-blur-xl border border-indigo-500/20 shadow-2xl shadow-indigo-900/50 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Icon + Text */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-900/60 text-indigo-400">
                  <Cookie size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-100">เว็บไซต์นี้ใช้คุกกี้</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    เราใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งาน วิเคราะห์การใช้งาน และนำเสนอเนื้อหาที่เกี่ยวข้อง
                    คุกกี้ประเภท Marketing และ Analytics{' '}
                    <strong className="text-slate-300">จะไม่ทำงานจนกว่าท่านจะยินยอม</strong>{' '}
                    ตาม{' '}
                    <a
                      href="/privacy"
                      className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      นโยบายความเป็นส่วนตัว (PDPA)
                    </a>
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col xs:flex-row sm:flex-col md:flex-row items-stretch sm:items-end gap-2 shrink-0">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-300 text-xs font-medium hover:bg-indigo-900/30 hover:border-indigo-500/50 transition-colors whitespace-nowrap"
                >
                  ตั้งค่าคุกกี้
                </button>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-xs font-medium hover:bg-slate-800 hover:border-slate-500 transition-colors whitespace-nowrap"
                >
                  ปฏิเสธทั้งหมด
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-900/50 whitespace-nowrap"
                >
                  ยอมรับทั้งหมด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          initialConsent={consent}
          onSave={saveCustom}
          onRejectAll={rejectAll}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default CookieConsentBanner;

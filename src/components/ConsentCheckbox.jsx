import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * PDPA-compliant consent checkbox.
 * - Never pre-checked (controlled externally, starts false)
 * - Shows validation error only after the user has interacted (touched)
 * - Links to /privacy-policy in a new tab
 */
const ConsentCheckbox = ({ checked, onChange, touched = false }) => {
  const showError = touched && !checked;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="pdpa-consent-cb"
        className="flex items-start gap-3 cursor-pointer group select-none"
      >
        <input
          id="pdpa-consent-cb"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        {/* Custom styled checkbox */}
        <span
          aria-hidden="true"
          className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150
            ${checked
              ? 'bg-indigo-600 border-indigo-600'
              : showError
                ? 'border-red-500 bg-red-900/10'
                : 'border-slate-600 bg-slate-900/60 group-hover:border-indigo-400'
            }`}
        >
          {checked && (
            <svg viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
              <path d="M1 4l2.5 2.5L9 1" />
            </svg>
          )}
        </span>

        {/* Label */}
        <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
          ฉันได้อ่านและยินยอมให้เก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคลของฉันตาม{' '}
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors font-medium"
          >
            นโยบายความเป็นส่วนตัว (Privacy Policy)
          </a>
          {' '}ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          <span className="text-red-400 ml-0.5">*</span>
        </span>
      </label>

      {/* Validation error — shown only after first submit attempt */}
      {showError && (
        <p className="flex items-center gap-1.5 text-red-400 text-xs pl-7 animate-slide-up" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนดำเนินการต่อ
        </p>
      )}
    </div>
  );
};

export default ConsentCheckbox;

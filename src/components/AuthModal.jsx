import React, { useState, useRef } from 'react';
import { X, Phone, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { glassPanel, glassInput, headingFont } from '../styles';

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

export default function AuthModal({ onClose, signInWithGoogle, sendPhoneOTP }) {
    const [tab, setTab] = useState('google');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('input'); // 'input' | 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const confirmRef = useRef(null);

    const handleGoogle = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            onClose();
        } catch (e) {
            if (e.code === 'auth/popup-closed-by-user') return;
            setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ: ' + (e.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        const raw = phone.trim().replace(/\s|-/g, '');
        if (!raw) return setError('กรุณากรอกเบอร์โทรศัพท์');
        const normalized = raw.startsWith('0') ? '+66' + raw.slice(1) : raw.startsWith('+') ? raw : '+66' + raw;
        setLoading(true);
        setError('');
        try {
            confirmRef.current = await sendPhoneOTP(normalized, 'recaptcha-auth-container');
            setStep('otp');
        } catch (e) {
            setError('ส่ง OTP ไม่สำเร็จ: ' + (e.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) return setError('กรุณากรอกรหัส OTP');
        setLoading(true);
        setError('');
        try {
            await confirmRef.current.confirm(otp.trim());
            onClose();
        } catch {
            setError('รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className={`w-full max-w-sm rounded-2xl p-6 relative ${glassPanel}`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5"/>
                </button>

                <h2 className={`text-xl font-bold text-white mb-1 ${headingFont}`}>เข้าสู่ระบบ</h2>
                <p className="text-slate-400 text-sm mb-5">รับข้อมูลและประวัติการใช้งานส่วนตัว</p>

                {/* Tabs */}
                <div className="flex gap-2 mb-5">
                    <button
                        onClick={() => { setTab('google'); setError(''); setStep('input'); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${tab === 'google' ? 'bg-white/10 border-white/20 text-white' : 'border-indigo-500/20 text-slate-400 hover:text-white'}`}
                    >
                        <GoogleIcon /> Google
                    </button>
                    <button
                        onClick={() => { setTab('phone'); setError(''); setStep('input'); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${tab === 'phone' ? 'bg-indigo-600/40 border-indigo-500/50 text-white' : 'border-indigo-500/20 text-slate-400 hover:text-white'}`}
                    >
                        <Phone className="w-4 h-4"/> เบอร์โทร
                    </button>
                </div>

                {/* Google tab */}
                {tab === 'google' && (
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500"/> : <GoogleIcon/>}
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'Sign in with Google'}
                    </button>
                )}

                {/* Phone tab */}
                {tab === 'phone' && (
                    <div className="space-y-3">
                        {step === 'input' ? (
                            <>
                                <div className="flex gap-2">
                                    <div className={`flex items-center px-3 rounded-xl text-slate-300 text-sm font-mono border border-indigo-500/10 bg-slate-950/60 select-none`}>+66</div>
                                    <input
                                        type="tel"
                                        placeholder="0812345678"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                                        className={`flex-1 rounded-xl px-4 py-3 text-sm ${glassInput}`}
                                        maxLength={15}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ChevronRight className="w-4 h-4"/>}
                                    {loading ? 'กำลังส่ง OTP...' : 'ส่งรหัส OTP'}
                                </button>
                                <p className="text-xs text-slate-500 text-center">จะส่ง SMS ไปยังเบอร์ที่กรอก</p>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setStep('input'); setOtp(''); setError(''); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-1 transition-colors">
                                    <ArrowLeft className="w-3 h-3"/> เปลี่ยนเบอร์
                                </button>
                                <p className="text-sm text-slate-300">ส่ง OTP ไปที่ <span className="font-mono text-indigo-300">{phone}</span> แล้ว</p>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="รหัส 6 หลัก"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                                    className={`w-full rounded-xl px-4 py-3 text-center font-mono text-xl tracking-widest ${glassInput}`}
                                    maxLength={6}
                                    autoFocus
                                />
                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={loading || otp.length < 6}
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                                    {loading ? 'กำลังยืนยัน...' : 'ยืนยัน OTP'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {error && (
                    <p className="mt-3 text-xs text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">{error}</p>
                )}

                <p className="text-xs text-slate-600 text-center mt-4">
                    การเข้าสู่ระบบถือว่ายอมรับ{' '}
                    <span className="text-indigo-400 cursor-default">นโยบายความเป็นส่วนตัว</span>
                </p>

                {/* invisible reCAPTCHA anchor */}
                <div id="recaptcha-auth-container"/>
            </div>
        </div>
    );
}

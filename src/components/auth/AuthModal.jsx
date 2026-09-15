import { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle,
  LogOut,
  X,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import useStore from '../../store/useStore.js';
import { useTranslation } from '../../i18n/index.jsx';
import {
  getSupabase,
  isSupabaseConfigured,
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
} from '../../lib/supabase.js';

export default function AuthModal() {
  const { lang, t } = useTranslation();
  const {
    user,
    authModalOpen,
    setAuthModalOpen,
    syncStatus,
    setSyncStatus,
    syncToCloud,
    syncFromCloud,
    signOut,
    lastSyncedAt,
  } = useStore();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'otp' | 'success'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // Custom Supabase Config fields
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setStep('input');
      const conf = getSupabaseConfig();
      setCustomUrl(conf.url || '');
      setCustomKey(conf.anonKey || '');
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setErrorMsg('');
    setSuccessMsg('');
    setStep('input');
  };

  const handleGoogleSignIn = async () => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে প্রথমে Supabase প্রোজেক্ট URL ও Anon Key কনফিগার করুন।'
          : 'Please configure your Supabase Project URL & Anon Key first.'
      );
      setShowConfig(true);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google sign in error:', err);
      setErrorMsg(err.message || 'Failed to initialize Google Sign In');
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ইমেল অ্যাড্রেস লিখুন।'
          : 'Please enter a valid email address.'
      );
      return;
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setErrorMsg(
        lang === 'bn'
          ? 'Supabase কনফিগারেশন পাওয়া যায়নি। নিচের ড্রয়ারে URL ও Anon Key প্রদান করুন।'
          : 'Supabase configuration missing. Please provide URL & Anon Key below.'
      );
      setShowConfig(true);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      setStep('otp');
      setSuccessMsg(
        lang === 'bn'
          ? `${email} এ একটি ওয়ান-টাইম ভেরিফিকেশন কোড পাঠানো হয়েছে!`
          : `A one-time verification code has been sent to ${email}!`
      );
    } catch (err) {
      console.error('Send OTP error:', err);
      setErrorMsg(err.message || 'Failed to send login code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে ৬-সংখ্যার কোডটি প্রবেশ করান।'
          : 'Please enter the 6-digit code.'
      );
      return;
    }

    const supabase = getSupabase();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email',
      });
      if (error) throw error;

      setStep('success');
      setSuccessMsg(
        lang === 'bn'
          ? 'সফলভাবে লগইন সম্পন্ন হয়েছে! আপনার ডেটা ক্লাউডের সাথে সিঙ্ক হচ্ছে...'
          : 'Successfully signed in! Your data is syncing to the cloud...'
      );
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setErrorMsg(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e?.preventDefault();
    if (!customUrl || !customKey) {
      setErrorMsg('Please enter both Supabase URL and Anon Key');
      return;
    }
    saveCustomSupabaseConfig(customUrl, customKey);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
    setErrorMsg('');
  };

  const handleClearConfig = () => {
    clearCustomSupabaseConfig();
    setCustomUrl('');
    setCustomKey('');
    setErrorMsg('');
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-container auth-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: '92%',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.28), 0 0 0 1px var(--color-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header with Luxury Emerald Accent */}
        <div
          style={{
            padding: '24px 24px 18px',
            borderBottom: '1px solid var(--color-border-light)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, var(--color-surface-secondary) 0%, var(--color-surface) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-lg)',
                background: user
                  ? 'rgba(94, 210, 28, 0.16)'
                  : 'rgba(59, 130, 246, 0.12)',
                color: user ? '#5ED21C' : '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                border: `1px solid ${user ? 'rgba(94, 210, 28, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
                flexShrink: 0,
              }}
            >
              {user ? <Cloud size={24} /> : <CloudOff size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  {lang === 'bn' ? 'হিসাব ক্লাউড সিঙ্ক ও ব্যাকআপ' : 'Hisab Cloud Sync & Backup'}
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 'var(--weight-bold)',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: user
                      ? 'rgba(94, 210, 28, 0.15)'
                      : isSupabaseConfigured()
                      ? 'rgba(59, 130, 246, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                    color: user
                      ? '#207208'
                      : isSupabaseConfigured()
                      ? '#2563EB'
                      : '#DC2626',
                    textTransform: 'uppercase',
                  }}
                >
                  {user
                    ? (lang === 'bn' ? 'সংযুক্ত' : 'Connected')
                    : isSupabaseConfigured()
                    ? (lang === 'bn' ? 'রেডি' : 'Ready')
                    : (lang === 'bn' ? 'লোকাল' : 'Local-First')}
                </span>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  margin: '4px 0 0',
                }}
              >
                {user
                  ? (lang === 'bn' ? 'সকল ডিভাইসে আপনার হিসাব সংরক্ষিত ও সিঙ্ক হচ্ছে।' : 'Your finances are encrypted & synced across all your devices.')
                  : (lang === 'bn' ? 'লগইন করে রিয়েল-টাইম ক্লাউড ব্যাকআপ সক্রিয় করুন।' : 'Sign in to enable real-time encrypted cloud sync & backup.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="btn btn-icon btn-ghost btn-sm"
            style={{
              color: 'var(--color-text-tertiary)',
              borderRadius: 'var(--radius-full)',
              width: 30,
              height: 30,
              padding: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Error / Success Notifications */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#DC2626',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(94, 210, 28, 0.12)',
                border: '1px solid rgba(94, 210, 28, 0.3)',
                color: '#207208',
                fontSize: '13px',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================
              STATE A: USER IS AUTHENTICATED
              ======================================================== */}
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile Card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #111411 0%, #2A302A 100%)',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: 'var(--weight-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #5ED21C',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    {(user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 'var(--weight-bold)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
                        marginTop: 2,
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '11px',
                    fontWeight: 'var(--weight-bold)',
                    color: '#207208',
                    backgroundColor: 'rgba(94, 210, 28, 0.15)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#5ED21C',
                    }}
                  />
                  <span>{lang === 'bn' ? 'লাইভ সিঙ্ক' : 'Live Synced'}</span>
                </div>
              </div>

              {/* Sync Actions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setSuccessMsg('');
                    await syncToCloud();
                    setSuccessMsg(
                      lang === 'bn'
                        ? 'সকল লোকাল ডাটা ক্লাউডে সফলভাবে আপলোড করা হয়েছে!'
                        : 'Local data uploaded to cloud successfully!'
                    );
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 44,
                  }}
                >
                  <RefreshCw
                    size={16}
                    className={loading ? 'animate-spin' : ''}
                  />
                  <span>{lang === 'bn' ? 'ক্লাউডে আপলোড' : 'Push to Cloud'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setSuccessMsg('');
                    await syncFromCloud();
                    setSuccessMsg(
                      lang === 'bn'
                        ? 'ক্লাউড থেকে সর্বশেষ ডাটা ডাউনলোড করা হয়েছে!'
                        : 'Synced latest data from cloud!'
                    );
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 44,
                  }}
                >
                  <Cloud size={16} />
                  <span>{lang === 'bn' ? 'ক্লাউড থেকে আনুন' : 'Pull Cloud Data'}</span>
                </button>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await signOut();
                  setLoading(false);
                  setSuccessMsg(
                    lang === 'bn'
                      ? 'লগআউট সম্পন্ন হয়েছে। অ্যাপটি লোকাল মোডে চলবে।'
                      : 'Signed out. App is running in Local-First mode.'
                  );
                }}
                disabled={loading}
                className="btn btn-ghost"
                style={{
                  color: 'var(--color-expense)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <LogOut size={16} />
                <span>{lang === 'bn' ? 'ক্লাউড অ্যাকাউন্ট সাইন আউট' : 'Sign Out of Cloud'}</span>
              </button>
            </div>
          ) : (
            /* ========================================================
               STATE B: USER IS NOT LOGGED IN
               ======================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Value Proposition Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border-light)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={18} style={{ color: '#5ED21C' }} />
                  <span style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                    {lang === 'bn' ? 'সুরক্ষিত RLS' : 'Encrypted RLS'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Smartphone size={18} style={{ color: '#3B82F6' }} />
                  <span style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                    {lang === 'bn' ? 'মোবাইল ও পিসি' : 'Cross-Device'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={18} style={{ color: '#F59E0B' }} />
                  <span style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                    {lang === 'bn' ? 'অফলাইন রেডি' : 'Offline First'}
                  </span>
                </div>
              </div>

              {/* 1-Tap Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn"
                style={{
                  height: 48,
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid #D1D5DB',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '14px',
                  fontWeight: 'var(--weight-bold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Google SVG Brand Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{lang === 'bn' ? 'গুগল দিয়ে সাইন ইন করুন' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  margin: '4px 0',
                }}
              >
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'bn' ? 'অথবা ইমেল ওটিপি' : 'or email magic code'}
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
              </div>

              {/* Email OTP Flow */}
              {step === 'input' ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>
                      {lang === 'bn' ? 'আপনার ইমেল ঠিকানা' : 'Email Address'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{ paddingLeft: 38 }}
                      />
                      <Mail
                        size={16}
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--color-text-tertiary)',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <span>{loading ? (lang === 'bn' ? 'কোড পাঠানো হচ্ছে...' : 'Sending code...') : (lang === 'bn' ? 'লগইন কোড পাঠান' : 'Send Login Code')}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>
                        {lang === 'bn' ? '৬-সংখ্যার কোড প্রবেশ করান' : 'Enter 6-Digit Code'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setStep('input')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        {lang === 'bn' ? 'ইমেল পরিবর্তন' : 'Change Email'}
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        type="text"
                        required
                        maxLength={8}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        style={{
                          paddingLeft: 38,
                          letterSpacing: '0.25em',
                          fontSize: '16px',
                          fontWeight: 'bold',
                        }}
                      />
                      <KeyRound
                        size={16}
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--color-text-tertiary)',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <span>{loading ? (lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...') : (lang === 'bn' ? 'কোড যাচাই ও লগইন' : 'Verify & Sign In')}</span>
                    <CheckCircle2 size={16} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================
              ACCORDION: CUSTOM SUPABASE PROJECT CONFIGURATION
              ======================================================== */}
          <div
            style={{
              borderTop: '1px solid var(--color-border-light)',
              paddingTop: 14,
            }}
          >
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
                fontWeight: 'var(--weight-semibold)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={14} />
                <span>
                  {lang === 'bn' ? 'কাস্টম Supabase প্রোজেক্ট সংযোগ (BYO Database)' : 'Custom Supabase Project Connection (BYO Database)'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                {showConfig ? '▲ Hide' : '▼ Setup'}
              </span>
            </button>

            {showConfig && (
              <form
                onSubmit={handleSaveConfig}
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
                  {lang === 'bn'
                    ? 'আপনার নিজস্ব Supabase প্রোজেক্ট থাকলে Project Settings -> API থেকে URL ও anon key এখানে প্রবেশ করান।'
                    : 'If you have your own Supabase project, paste your Project URL and anon public key from Project Settings -> API.'}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Project URL</label>
                  <input
                    className="form-input"
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    style={{ fontSize: '12px', height: 38 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Anon Public Key</label>
                  <input
                    className="form-input"
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    style={{ fontSize: '12px', height: 38 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px' }}
                  >
                    {lang === 'bn' ? 'রিসেট' : 'Clear'}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '11px', minWidth: 90 }}
                  >
                    {configSaved ? <CheckCircle2 size={13} /> : null}
                    <span>{configSaved ? 'Saved!' : 'Save & Link'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--color-border-light)',
            background: 'var(--color-surface-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            <Lock size={12} />
            <span>Local-First: Works 100% Offline</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '12px' }}
          >
            {lang === 'bn' ? 'অফলাইনে থাকুন' : 'Continue Offline'}
          </button>
        </div>
      </div>
    </div>
  );
}

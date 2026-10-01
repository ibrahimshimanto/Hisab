import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { getMailProvider } from '../../lib/mailProvider.js';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/modalHelper.js';

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
  const [step, setStep] = useState('input'); // 'input' | 'sent' | 'success'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If user becomes authenticated while waiting for magic link, auto-advance
  useEffect(() => {
    if (user && step === 'sent') {
      setStep('success');
      setSuccessMsg(
        lang === 'bn'
          ? 'সফলভাবে লগইন সম্পন্ন হয়েছে! আপনার ডেটা ক্লাউডের সাথে সিঙ্ক হচ্ছে...'
          : 'Successfully signed in! Your data is syncing to the cloud...'
      );
      setTimeout(() => {
        handleClose();
      }, 1400);
    }
  }, [user, step]);

  // Custom Supabase Config fields
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      lockBodyScroll();
      setErrorMsg('');
      setSuccessMsg('');
      setStep('input');
      const conf = getSupabaseConfig();
      setCustomUrl(conf.url || '');
      setCustomKey(conf.anonKey || '');
      return () => {
        unlockBodyScroll();
      };
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

  const handleSendMagicLink = async (e) => {
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

      setStep('sent');
      setResendCooldown(30);
      setSuccessMsg(
        lang === 'bn'
          ? `${email} এ ১-ক্লিক সাইন ইন লিংক পাঠানো হয়েছে!`
          : `Magic sign-in link sent to ${email}!`
      );
    } catch (err) {
      console.error('Send Magic Link error:', err);
      setErrorMsg(err.message || 'Failed to send login link');
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

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={handleClose}>
      <div
        className="modal auth-modal-container animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        <div className="modal-grab-handle" />
        {/* Header with Luxury Emerald Accent */}
        <div
          className="modal-header"
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
                background: 'rgba(94, 210, 28, 0.16)',
                color: '#5ED21C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(94, 210, 28, 0.3)',
                flexShrink: 0,
              }}
            >
              <Cloud size={24} />
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
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(94, 210, 28, 0.15)',
                    color: '#207208',
                    border: '1px solid rgba(94, 210, 28, 0.3)',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#5ED21C' }} />
                  {user ? (lang === 'bn' ? 'অ্যাকাউন্ট সংযুক্ত' : 'Linked') : (lang === 'bn' ? 'অনলাইন সিঙ্ক' : 'Online Synced')}
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
                  ? (lang === 'bn' ? 'আপনার অ্যাকাউন্টের সাথে ক্লাউড সিঙ্ক চালু রয়েছে।' : 'Your finances are linked to your profile and syncing across devices.')
                  : (lang === 'bn' ? 'স্বয়ংক্রিয় অনলাইন ক্লাউড সিঙ্ক চালু রয়েছে। নির্দিষ্ট প্রোফাইলে যুক্ত করতে সাইন-ইন করুন।' : 'Real-time online cloud sync is active. Sign in anytime to link to your profile.')}
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
          className="modal-body auth-modal-body"
          style={{
            minHeight: 0,
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
                      ? 'লগআউট সম্পন্ন হয়েছে। অ্যাপটি অনলাইন ক্লাউড সিঙ্ক মোডে সচল রয়েছে।'
                      : 'Signed out. App continues running in online cloud-synced mode.'
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
                  <Sparkles size={18} style={{ color: '#5ED21C' }} />
                  <span style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                    {lang === 'bn' ? 'অটো ক্লাউড সিঙ্ক' : 'Auto Cloud Sync'}
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
                  {lang === 'bn' ? 'অথবা ১-ক্লিক ম্যাজিক লিংক' : 'or 1-click magic link'}
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
              </div>

              {/* 1-Click Magic Link Flow */}
              {step === 'input' ? (
                <form onSubmit={handleSendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    disabled={loading || !email.trim()}
                    className="btn btn-primary"
                    style={{
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    <span>{loading ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending link...') : (lang === 'bn' ? 'ম্যাজিক লিংক পাঠান' : 'Send Magic Link')}</span>
                  </button>
                </form>
              ) : (
                /* Magic Link Confirmation Card */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 12,
                    padding: '16px 14px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface)',
                    border: '1.5px solid rgba(94, 210, 28, 0.25)',
                    boxShadow: '0 4px 20px rgba(94, 210, 28, 0.08)',
                    animation: 'fadeIn 0.25s ease-out',
                  }}
                >
                  {/* Mail Icon Badge */}
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: 'rgba(94, 210, 28, 0.12)',
                      border: '1.5px solid rgba(94, 210, 28, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#5ED21C',
                      boxShadow: '0 0 16px rgba(94, 210, 28, 0.2)',
                    }}
                  >
                    <Mail size={22} />
                  </div>

                  {/* Header & Email Pill */}
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                      {lang === 'bn' ? 'আপনার ইনবক্স চেক করুন!' : 'Check your inbox!'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {lang === 'bn' ? 'আমরা একটি ১-ক্লিক সাইন ইন লিংক পাঠিয়েছি:' : 'We sent a 1-click sign-in link to:'}
                    </p>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 6,
                        padding: '3px 12px',
                        borderRadius: '999px',
                        background: 'var(--color-bg-secondary, rgba(255, 255, 255, 0.05))',
                        border: '1px solid var(--color-border)',
                        fontSize: '12px',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--color-text-primary)',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Mail size={12} style={{ color: '#5ED21C', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
                    </div>
                  </div>

                  {/* Direct Mail Inbox Button */}
                  {(() => {
                    const provider = getMailProvider(email);
                    if (!provider) return null;
                    return (
                      <a
                        href={provider.url}
                        target={provider.isWebmail ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          height: 44,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          fontSize: '13.5px',
                          fontWeight: 'var(--weight-semibold)',
                          textDecoration: 'none',
                          boxShadow: '0 2px 10px rgba(94, 210, 28, 0.25)',
                        }}
                      >
                        <span>
                          {lang === 'bn'
                            ? `${provider.name} খুলুন`
                            : `Open ${provider.name}`}
                        </span>
                        <ExternalLink size={15} />
                      </a>
                    );
                  })()}

                  {/* Live Listener Pulse Status */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(94, 210, 28, 0.08)',
                      fontSize: '11.5px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.3,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#5ED21C',
                        display: 'inline-block',
                        boxShadow: '0 0 8px #5ED21C',
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      {lang === 'bn'
                        ? 'লিংক ক্লিক করলেই অটোমেটিক লগইন হয়ে যাবে'
                        : 'Clicking the link in your email automatically signs you in'}
                    </span>
                  </div>

                  {/* Actions Row: Resend & Change Email */}
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      paddingTop: 8,
                      borderTop: '1px solid var(--color-border-light)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setStep('input');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {lang === 'bn' ? '← অন্য ইমেল' : '← Change email'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendMagicLink}
                      disabled={loading || resendCooldown > 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? 'var(--color-text-tertiary)' : '#5ED21C',
                        cursor: resendCooldown > 0 ? 'default' : 'pointer',
                        padding: 0,
                        fontWeight: 'var(--weight-medium)',
                      }}
                    >
                      {resendCooldown > 0
                        ? (lang === 'bn' ? `আবার পাঠান (${resendCooldown}s)` : `Resend link (${resendCooldown}s)`)
                        : (lang === 'bn' ? 'লিংক আবার পাঠান' : 'Resend link')}
                    </button>
                  </div>

                  {/* Deliverability Tip */}
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                    {lang === 'bn'
                      ? '💡 ইমেইল না পেলে Spam অথবা Promotions ফোল্ডার চেক করুন।'
                      : '💡 Can\'t find the email? Check your Spam or Promotions folder.'}
                  </p>
                </div>
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
        <div className="modal-footer auth-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            <CheckCircle2 size={13} style={{ color: '#5ED21C' }} />
            <span>Online: Supabase Cloud Synced</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '12px', minWidth: 80 }}
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

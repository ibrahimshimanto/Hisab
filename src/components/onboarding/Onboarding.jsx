import { useState, useRef, useEffect } from 'react';
import {
  Globe,
  User,
  ArrowRight,
  Check,
  AlertCircle,
  Camera,
  ShieldCheck,
  Mail,
  LogOut,
  RefreshCw,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import HisabLogo from '../common/HisabLogo.jsx';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase.js';

export default function Onboarding({ onComplete }) {
  const { t, lang, changeLanguage } = useTranslation();
  const {
    initializeOnboardingAccounts,
    updateProfile,
    setFinancialMode,
    completeOnboarding,
    syncToCloud,
    user,
    signOut,
    startTour,
  } = useStore();

  // Step 0: Language | Step 1: Sign In | Step 2: Profile Picture & Name
  // If user is already authenticated (e.g. returning from Google OAuth redirect),
  // jump straight to Step 2 (Profile Setup) so Language NEVER appears again after sign in.
  const [step, setStep] = useState(() => {
    return user ? 2 : 0;
  });

  // Authentication State
  const [authEmail, setAuthEmail] = useState('');
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [authStep, setAuthStep] = useState('input'); // 'input' | 'otp'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Profile Step State (Pre-filled with Google / auth metadata, fully editable)
  const initialName = user?.user_metadata?.full_name || (user?.email && user.email !== 'guest@hisab.app' ? user.email.split('@')[0] : '');
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.user_metadata?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const nameInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Pre-fill name and avatar if user logs in via Google OAuth
  useEffect(() => {
    if (user) {
      const googleName = user.user_metadata?.full_name || (user.email && user.email !== 'guest@hisab.app' ? user.email.split('@')[0] : '');
      const googleAvatar = user.user_metadata?.avatar_url || '';
      if (googleName && !name) setName(googleName);
      if (googleAvatar && !profilePhoto) setProfilePhoto(googleAvatar);
    }
  }, [user]);

  // If user is authenticated, guarantee they are on Step 2 (Profile Setup) and never on Language or Sign In
  useEffect(() => {
    if (user && step < 2) {
      setStep(2);
    }
  }, [user, step]);

  const steps = [
    { icon: Globe, title: t('onboarding.selectLanguage') },
    { icon: ShieldCheck, title: lang === 'bn' ? 'সাইন ইন করুন' : 'Sign In' },
    { icon: User, title: lang === 'bn' ? 'প্রোফাইল সাজান' : 'Setup Profile' },
  ];

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setAuthError(lang === 'bn' ? 'Supabase কনফিগারেশন পাওয়া যায়নি।' : 'Supabase configuration not found.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const redirectUrl = typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://hisab-psi-eight.vercel.app';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google sign in error:', err);
      setAuthError(err.message || 'Failed to start Google sign in');
      setAuthLoading(false);
    }
  };

  // Handle Send Email OTP
  const handleSendEmailOtp = async (e) => {
    e?.preventDefault();
    if (!authEmail || !authEmail.includes('@')) {
      setAuthError(lang === 'bn' ? 'অনুগ্রহ করে একটি সঠিক ইমেল অ্যাড্রেস লিখুন।' : 'Please enter a valid email address.');
      return;
    }
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setAuthError(lang === 'bn' ? 'Supabase কনফিগারেশন পাওয়া যায়নি।' : 'Supabase configuration not found.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const redirectUrl = typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://hisab-psi-eight.vercel.app';

      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      setAuthStep('otp');
      setAuthSuccess(
        lang === 'bn'
          ? `${authEmail} এ ৬-সংখ্যার লগইন কোড পাঠানো হয়েছে!`
          : `A 6-digit login code has been sent to ${authEmail}!`
      );
    } catch (err) {
      console.error('Send OTP error:', err);
      setAuthError(err.message || 'Failed to send login code');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Verify Email OTP
  const handleVerifyEmailOtp = async (e) => {
    e?.preventDefault();
    if (!authOtpCode || authOtpCode.trim().length < 6) {
      setAuthError(lang === 'bn' ? 'অনুগ্রহ করে ৬-সংখ্যার কোডটি প্রবেশ করান।' : 'Please enter the 6-digit code.');
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: authEmail.trim(),
        token: authOtpCode.trim(),
        type: 'email',
      });
      if (error) throw error;
      setAuthSuccess(lang === 'bn' ? 'সফলভাবে সাইন ইন সম্পন্ন হয়েছে!' : 'Successfully signed in!');
      const userMeta = data?.user?.user_metadata;
      if (userMeta?.full_name && !name) setName(userMeta.full_name);
      if (userMeta?.avatar_url && !profilePhoto) setProfilePhoto(userMeta.avatar_url);
      setTimeout(() => {
        setStep(2); // move to profile step
      }, 400);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setAuthError(err.message || 'Invalid or expired code');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Photo Upload from Device (with canvas resize to 256x256)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setProfilePhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Save and Proceed: commits profile, starter accounts, cloud sync, completes onboarding and triggers auto-tour
  const handleSaveAndProceed = async () => {
    if (!name.trim()) {
      setNameError(
        lang === 'bn'
          ? 'চালিয়ে যেতে আপনার নাম লেখা আবশ্যক।'
          : 'Your name is required to continue.'
      );
      nameInputRef.current?.focus();
      return;
    }
    setNameError('');
    setIsSaving(true);

    try {
      const finalName = name.trim() || (lang === 'bn' ? 'ব্যবহারকারী' : 'User');
      updateProfile({
        name: finalName,
        avatar: profilePhoto || '',
      });
      setFinancialMode('cruise');

      // Initialize starter accounts if none exist
      const currentAccounts = useStore.getState().accounts || [];
      if (currentAccounts.length === 0) {
        initializeOnboardingAccounts([
          {
            name: lang === 'bn' ? 'ক্যাশ ওয়ালেট' : 'Cash Wallet',
            type: 'wallet',
            balance: 0,
          },
        ]);
      }

      await syncToCloud();
      completeOnboarding();
      onComplete?.();
      window.scrollTo(0, 0);

      // Launch the platform auto-tour on Dashboard
      setTimeout(() => {
        startTour();
      }, 350);
    } catch (err) {
      console.error('Error completing profile setup:', err);
      completeOnboarding();
      onComplete?.();
      setTimeout(() => {
        startTour();
      }, 350);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = () => {
    // Step 0: Language -> advance to Step 1 (Sign In)
    if (step === 0) {
      setStep(1);
      return;
    }

    // Step 1: Sign In (Requires Authentication)
    if (step === 1) {
      if (!user) {
        setAuthError(
          lang === 'bn'
            ? 'চালিয়ে যেতে অনুগ্রহ করে গুগল বা ইমেইল দিয়ে সাইন ইন করুন।'
            : 'Please sign in with Google or Email to continue.'
        );
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: Profile Step -> Save & Proceed
    if (step === 2) {
      handleSaveAndProceed();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: 'var(--space-4)',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Ambient Radial Backdrop Glow */}
      <div style={{
        position: 'fixed',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(94, 210, 28, 0.16) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        width: '100%',
        maxWidth: 500,
        position: 'relative',
        zIndex: 2,
        animation: 'fadeInUp 0.35s ease',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <HisabLogo variant="charcoal" size={50} style={{ margin: '0 auto var(--space-2)' }} />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-extrabold)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {t('onboarding.welcome')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {t('onboarding.welcomeDesc')}
          </p>
        </div>

        {/* Step Indicator Progress Bar (3 steps: Language, Sign In, Profile) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 'var(--space-4)' }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 40 : 10,
                height: 7,
                borderRadius: 'var(--radius-full)',
                background: i <= step ? '#5ED21C' : 'var(--color-border)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ))}
        </div>

        {/* Main Step Container Card */}
        <div className="card" style={{
          padding: '26px 22px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--glass-border)',
        }}>
          {/* Step Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(94, 210, 28, 0.15)',
              color: '#207208',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {(() => { const Icon = steps[step].icon; return <Icon size={18} />; })()}
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
                {steps[step].title}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
                {t('onboarding.step')} {step + 1} {t('onboarding.of')} {steps.length}
              </p>
            </div>
          </div>

          {/* ==========================================================
              STEP 0: LANGUAGE SELECTION (First & Only Time)
              ========================================================== */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { code: 'en', label: 'English', flag: '🇬🇧', desc: 'Continue in English' },
                { code: 'bn', label: 'বাংলা', flag: '🇧🇩', desc: 'বাংলা ভাষায় চালিয়ে যান' },
              ].map(({ code, label, flag, desc }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => changeLanguage(code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${lang === code ? '#5ED21C' : 'var(--color-border)'}`,
                    background: lang === code ? 'rgba(94, 210, 28, 0.08)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    width: '100%',
                    textAlign: 'left',
                    boxShadow: lang === code ? '0 4px 14px rgba(94, 210, 28, 0.15)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{flag}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--weight-bold)', fontSize: '15px', color: 'var(--color-text-primary)', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{desc}</p>
                  </div>
                  {lang === code && (
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#5ED21C',
                      color: '#111411',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ==========================================================
              STEP 1: GOOGLE & EMAIL SIGN IN (Strictly Required)
              ========================================================== */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Authenticated State Display (if user is signed in) */}
              {user ? (
                <div style={{
                  padding: '18px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(94, 210, 28, 0.08)',
                  border: '1.5px solid rgba(94, 210, 28, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#111411',
                        border: '1.5px solid #5ED21C',
                        color: '#5ED21C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 16,
                      }}>
                        {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                          {user.user_metadata?.full_name || user.email}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 'var(--weight-bold)',
                      color: '#207208',
                      background: 'rgba(94, 210, 28, 0.18)',
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <CheckCircle2 size={12} />
                      <span>{lang === 'bn' ? 'সংযুক্ত' : 'Connected'}</span>
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {lang === 'bn'
                      ? 'আপনার অ্যাকাউন্টটি সফলভাবে সংযুক্ত রয়েছে। নিচের বাটনে ক্লিক করে প্রোফাইল সাজান।'
                      : 'Your account is linked. Click Next below to edit your name and profile picture.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={signOut}
                      style={{ fontSize: '11px', color: 'var(--color-expense)', gap: 5, padding: '0 8px' }}
                    >
                      <LogOut size={12} />
                      <span>{lang === 'bn' ? 'ভিন্ন অ্যাকাউন্টে সাইন ইন' : 'Switch account'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Unauthenticated View: Google Sign In + Email OTP Form */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ textAlign: 'center', padding: '0 4px 4px' }}>
                    <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {lang === 'bn'
                        ? 'আপনার হিসাব সুরক্ষিত রাখতে এবং যেকোনো ডিভাইস থেকে অটো-সিঙ্ক করতে সাইন ইন করুন:'
                        : 'Sign in to sync your finances in real time and backup your data securely across all devices:'}
                    </p>
                  </div>

                  {/* 1-Click Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      width: '100%',
                      height: 48,
                      borderRadius: 'var(--radius-lg)',
                      border: '1.5px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--weight-semibold)',
                      fontFamily: 'inherit',
                      cursor: authLoading ? 'not-allowed' : 'pointer',
                      transition: 'all var(--transition-fast)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#5ED21C';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(94, 210, 28, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                    }}
                  >
                    {authLoading ? (
                      <RefreshCw size={18} className="animate-spin" style={{ color: '#5ED21C' }} />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                    )}
                    <span>{lang === 'bn' ? 'গুগল দিয়ে সাইন ইন করুন' : 'Continue with Google'}</span>
                  </button>

                  {/* Clean Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border-light)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {lang === 'bn' ? 'অথবা ইমেইল কোড' : 'or email code'}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border-light)' }} />
                  </div>

                  {/* Email OTP Form */}
                  {authStep === 'input' ? (
                    <form onSubmit={handleSendEmailOtp} style={{ display: 'flex', gap: 8 }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Mail
                          size={16}
                          style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-text-tertiary)',
                            pointerEvents: 'none',
                          }}
                        />
                        <input
                          type="email"
                          className="form-input"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder={lang === 'bn' ? 'আপনার ইমেইল অ্যাড্রেস...' : 'Enter your email...'}
                          style={{ paddingLeft: 38, height: 44 }}
                          disabled={authLoading}
                          autoComplete="email"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-secondary"
                        disabled={authLoading || !authEmail.trim()}
                        style={{ height: 44, padding: '0 16px', fontSize: '13px', whiteSpace: 'nowrap', gap: 6 }}
                      >
                        {authLoading ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <KeyRound size={14} />
                        )}
                        <span>{lang === 'bn' ? 'কোড পাঠান' : 'Send Code'}</span>
                      </button>
                    </form>
                  ) : (
                    /* OTP Verification Box */
                    <form onSubmit={handleVerifyEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          className="form-input"
                          value={authOtpCode}
                          onChange={(e) => setAuthOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          style={{
                            height: 44,
                            fontSize: '18px',
                            letterSpacing: '0.25em',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            flex: 1,
                          }}
                          disabled={authLoading}
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={authLoading || authOtpCode.length < 6}
                          style={{ height: 44, padding: '0 18px', fontSize: '13px', whiteSpace: 'nowrap', gap: 6 }}
                        >
                          {authLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                          <span>{lang === 'bn' ? 'যাচাই করুন' : 'Verify'}</span>
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                        <button
                          type="button"
                          onClick={() => { setAuthStep('input'); setAuthError(''); setAuthSuccess(''); }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 0 }}
                        >
                          {lang === 'bn' ? '← ইমেইল পরিবর্তন' : '← Change email'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={authLoading}
                          style={{ background: 'none', border: 'none', color: '#5ED21C', cursor: 'pointer', padding: 0, fontWeight: 'var(--weight-medium)' }}
                        >
                          {lang === 'bn' ? 'আবার কোড পাঠান' : 'Resend code'}
                        </button>
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', margin: '4px 0 0', textAlign: 'center', lineHeight: 1.4 }}>
                        {lang === 'bn'
                          ? '💡 ইমেইল থেকে ৬-সংখ্যার কোডটি এখানে লিখুন, অথবা ইমেইলের সাইন-ইন লিংকে ক্লিক করেও সরাসরি লগইন করতে পারেন।'
                          : '💡 Enter the 6-digit code from your email, or click the direct sign-in link in the email to log in instantly.'}
                      </p>
                    </form>
                  )}

                  {/* Feedback Messages */}
                  {authError && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: 'var(--color-expense)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(94, 210, 28, 0.1)',
                      border: '1px solid rgba(94, 210, 28, 0.25)',
                      color: '#207208',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                      <span>{authSuccess}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================
              STEP 2: PROFILE SETUP (PHOTO UPLOAD & EDITABLE NAME)
              User is placed here after Google / Email authentication!
              ========================================================== */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 2 }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {lang === 'bn'
                    ? 'আপনার গুগল তথ্য প্রি-ফিল করা হয়েছে। প্রয়োজনে ছবি বা নাম পরিবর্তন করতে পারেন:'
                    : 'Your details were imported from Google. Review and edit your profile photo and name:'}
                </p>
              </div>

              {/* Profile Photo Upload Center */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '4px 0',
              }}>
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />

                {/* Avatar Preview Circle with Camera Button */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  title={lang === 'bn' ? 'ছবি পরিবর্তন করতে ক্লিক করুন' : 'Click to change photo'}
                  style={{
                    position: 'relative',
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'transform var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Avatar"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #5ED21C',
                        boxShadow: '0 4px 14px rgba(94, 210, 28, 0.25)',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #111411 0%, #2A302A 100%)',
                      border: '3px solid #5ED21C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#5ED21C',
                      fontSize: '34px',
                      fontWeight: 'var(--weight-extrabold)',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                    }}>
                      {name ? name.charAt(0).toUpperCase() : <User size={40} />}
                    </div>
                  )}

                  {/* Camera Action Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: '#111411',
                    border: '2px solid #5ED21C',
                    color: '#5ED21C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }}>
                    <Camera size={15} />
                  </div>
                </div>

                {/* Upload Action Label & Remove Link */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#207208',
                      fontSize: '13px',
                      fontWeight: 'var(--weight-bold)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {profilePhoto
                      ? (lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Photo')
                      : (lang === 'bn' ? 'প্রোফাইল ছবি আপলোড করুন' : 'Upload Profile Picture')}
                  </button>
                  {profilePhoto && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setProfilePhoto('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-expense)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: '3px 0 0',
                        }}
                      >
                        {lang === 'bn' ? 'ছবি মুছুন' : 'Remove Photo'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Name Input Field */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 'var(--weight-bold)' }}>
                  {t('onboarding.yourName')} <span style={{ color: 'var(--color-expense)' }}>*</span>
                </label>
                <input
                  ref={nameInputRef}
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveAndProceed();
                    }
                  }}
                  placeholder={lang === 'bn' ? 'যেমন: ইব্রাহিম' : 'e.g. Ibrahim'}
                  style={{
                    height: 46,
                    fontSize: '15px',
                    borderColor: nameError ? '#EF4444' : undefined,
                    boxShadow: nameError ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : undefined,
                  }}
                  autoFocus
                />

                {nameError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: 'var(--weight-medium)',
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{nameError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation & Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 16,
          gap: 12,
        }}>
          {/* Back button (Only available on step 1 before signing in) */}
          {step === 1 && !user ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep(0)}
              style={{ fontSize: '13px' }}
            >
              {t('onboarding.back')}
            </button>
          ) : <div />}

          {/* Next / Save and Proceed Button */}
          {step === 1 && !user ? null : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextStep}
              disabled={isSaving}
              style={{
                height: 46,
                padding: '0 26px',
                fontSize: '14px',
                fontWeight: 'var(--weight-bold)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : null}
              <span>
                {step === 2
                  ? (lang === 'bn' ? 'সংরক্ষণ করুন ও এগিয়ে যান' : 'Save & Proceed')
                  : t('onboarding.next')}
              </span>
              {!isSaving && <ArrowRight size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

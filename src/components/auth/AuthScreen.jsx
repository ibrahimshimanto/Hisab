import { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, Smartphone, Sparkles, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import HisabLogo from '../common/HisabLogo.jsx';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase.js';

export default function AuthScreen({ onAuthenticated }) {
  const { lang, changeLanguage } = useTranslation();
  const { setUser, setSession, setSyncStatus } = useStore();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const toggleLang = () => {
    changeLanguage(lang === 'en' ? 'bn' : 'en');
  };

  const handleGoogleSignIn = async () => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setErrorMsg(
        lang === 'bn'
          ? 'ক্লাউড সংযোগ ত্রুটি। অনুগ্রহ করে পরে চেষ্টা করুন।'
          : 'Cloud connection issue. Please try again.'
      );
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
          ? 'অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস লিখুন।'
          : 'Please enter a valid email address.'
      );
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase client unavailable');
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
          ? `${email} এ ৬-সংখ্যার লগইন কোড পাঠানো হয়েছে!`
          : `A 6-digit login code has been sent to ${email}!`
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
          ? 'অনুগ্রহ করে ৬-সংখ্যার কোডটি লিখুন।'
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

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        setSyncStatus('synced');
        onAuthenticated?.(data.user);
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setErrorMsg(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    // Generate a guest client session
    const guestUser = {
      id: 'guest-' + Date.now(),
      email: 'guest@hisab.app',
      isGuest: true,
    };
    setUser(guestUser);
    onAuthenticated?.(guestUser);
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
      {/* Ambient Top Luminous Glow */}
      <div style={{
        position: 'fixed',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(94, 210, 28, 0.18) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Language Switcher Pill */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <button
          type="button"
          onClick={toggleLang}
          style={{
            background: 'var(--glass-bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            color: 'var(--color-text-primary)',
            fontSize: '12px',
            fontWeight: 'var(--weight-bold)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            transition: 'all var(--transition-fast)',
          }}
        >
          <span>{lang === 'en' ? '🇬🇧 EN' : '🇧🇩 বাংলা'}</span>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>
            ({lang === 'en' ? 'বাং' : 'EN'})
          </span>
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 440,
        position: 'relative',
        zIndex: 2,
        animation: 'fadeInUp 0.4s ease',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <HisabLogo variant="charcoal" size={64} style={{ margin: '0 auto var(--space-3)' }} />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-extrabold)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {lang === 'bn' ? 'হিসাব' : 'Hisab'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {lang === 'bn'
              ? 'ব্যক্তিগত অর্থ ও স্বয়ংক্রিয় ক্লাউড সিঙ্ক প্ল্যাটফর্ম'
              : 'Smart Personal Finance & Cloud Sync'}
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="card" style={{
          padding: '28px 24px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--glass-border)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
              {lang === 'bn' ? 'সাইন ইন / সাইন আপ' : 'Sign In to Your Account'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {lang === 'bn'
                ? 'আপনার আর্থিক ডেটা সকল ডিভাইসে সুরক্ষিত রাখতে লগইন করুন'
                : 'Access your cloud-synced finances across phone & web'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              fontSize: '12px',
              fontWeight: 'var(--weight-medium)',
              marginBottom: 16,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(94, 210, 28, 0.12)',
              border: '1px solid rgba(94, 210, 28, 0.35)',
              color: '#207208',
              fontSize: '12px',
              fontWeight: 'var(--weight-medium)',
              marginBottom: 16,
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'input' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 1-Tap Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid #D1D5DB',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 'var(--weight-bold)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{lang === 'bn' ? 'গুগল দিয়ে প্রবেশ করুন' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--color-border-light)' }} />
                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase' }}>
                  {lang === 'bn' ? 'অথবা ইমেইল কোড' : 'or with email code'}
                </span>
                <span style={{ flex: 1, height: 1, background: 'var(--color-border-light)' }} />
              </div>

              {/* Email Form */}
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    {lang === 'bn' ? 'আপনার ইমেইল এড্রেস' : 'Email Address'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      style={{ paddingLeft: 40, height: 44 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', height: 44, justifyContent: 'center', fontSize: '13px' }}
                >
                  <span>{loading ? (lang === 'bn' ? 'কোড পাঠানো হচ্ছে...' : 'Sending code...') : (lang === 'bn' ? 'লগইন কোড পাঠান' : 'Send Login Code')}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          ) : (
            /* Step OTP Verification */
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>
                  {lang === 'bn' ? '৬-সংখ্যার কোডটি লিখুন' : 'Enter 6-Digit Code'}
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoFocus
                    required
                    style={{
                      paddingLeft: 40,
                      height: 46,
                      fontSize: '18px',
                      letterSpacing: '6px',
                      fontWeight: 'var(--weight-bold)',
                      textAlign: 'center',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="btn btn-primary"
                style={{ width: '100%', height: 44, justifyContent: 'center', fontSize: '13px' }}
              >
                <span>{loading ? (lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...') : (lang === 'bn' ? 'ভেরিফাই ও প্রবেশ করুন' : 'Verify & Continue')}</span>
                <CheckCircle2 size={15} />
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <button
                  type="button"
                  onClick={() => { setStep('input'); setOtpCode(''); }}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 0, color: 'var(--color-text-secondary)' }}
                >
                  ← {lang === 'bn' ? 'ইমেইল পরিবর্তন' : 'Change email'}
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 0, color: 'var(--color-primary)' }}
                >
                  {lang === 'bn' ? 'কোড পুনরায় পাঠান' : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* Guest / Offline Access Link */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--color-border-light)', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleGuestContinue}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                textDecoration: 'underline',
              }}
            >
              {lang === 'bn' ? 'গেস্ট হিসেবে চালিয়ে যান (অফলাইন মোড)' : 'Continue as Guest (Offline Mode)'}
            </button>
          </div>
        </div>

        {/* Security & Feature Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          marginTop: 18,
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={13} style={{ color: '#5ED21C' }} />
            <span>256-bit Encrypted</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} style={{ color: '#3B82F6' }} />
            <span>Auto Cloud Sync</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Smartphone size={13} style={{ color: '#F59E0B' }} />
            <span>Multi-Device</span>
          </span>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import {
  Globe,
  User,
  Wallet,
  Plus,
  Smartphone,
  Building2,
  ArrowRight,
  Check,
  Sparkles,
  AlertCircle,
  Banknote,
  Shield,
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import HisabLogo from '../common/HisabLogo.jsx';
import UserAvatar from '../common/UserAvatar.jsx';
import { AVATAR_OPTIONS, getAvatarConfig } from '../../lib/avatars.js';

const GOAL_OPTIONS = [
  { id: 'expenses', icon: '🎯', labelEn: 'Control Expenses', labelBn: 'খরচের হিসাব', descEn: 'Track daily spending', descBn: 'দৈনন্দিন কেনাকাটা অপ্টিমাইজ', mode: 'eco' },
  { id: 'savings', icon: '🏦', labelEn: 'Grow Savings', labelBn: 'সঞ্চয় বৃদ্ধি', descEn: 'Build emergency safety', descBn: 'জরুরি তহবিল তৈরি', mode: 'cruise' },
  { id: 'projects', icon: '🚀', labelEn: 'Future Projects', labelBn: 'ভবিষ্যতের প্রজেক্ট', descEn: 'Invest in goals & plans', descBn: 'বড় লক্ষ্য ও কেনাকাটা', mode: 'racing' },
  { id: 'bills', icon: '⚡', labelEn: 'Manage Bills', labelBn: 'বিল ও খরচ', descEn: 'Never miss due dates', descBn: 'সময়মতো বিল পরিশোধ', mode: 'cruise' },
];

const ACCOUNT_TEMPLATES = [
  { type: 'mfs', name: 'bKash', icon: Smartphone, defaultBal: '5000', color: '#E2136E', bg: 'rgba(226, 19, 110, 0.12)' },
  { type: 'mfs', name: 'Nagad', icon: Smartphone, defaultBal: '3000', color: '#F7941D', bg: 'rgba(247, 148, 29, 0.12)' },
  { type: 'bank', name: 'City Bank', icon: Building2, defaultBal: '25000', color: '#005A9C', bg: 'rgba(0, 90, 156, 0.12)' },
  { type: 'wallet', name: 'Cash Wallet', icon: Banknote, defaultBal: '2000', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
];

export default function Onboarding({ onComplete }) {
  const { t, lang, changeLanguage } = useTranslation();
  const { initializeOnboardingAccounts, updateProfile, setFinancialMode, completeOnboarding } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('fox');
  const [selectedGoal, setSelectedGoal] = useState('savings');

  // Account form
  const [accounts, setAccounts] = useState([]);
  const [addingAccount, setAddingAccount] = useState(false);
  const [accType, setAccType] = useState('mfs');
  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('');

  const nameInputRef = useRef(null);

  const steps = [
    { icon: Globe, title: t('onboarding.selectLanguage') },
    { icon: User, title: lang === 'bn' ? 'প্রোফাইল ও অ্যাভাটার' : 'Profile & Avatar' },
    { icon: Wallet, title: t('onboarding.setupAccounts') },
  ];

  const handleNextStep = () => {
    // Validation on Step 1 (Name is mandatory)
    if (step === 1) {
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
    }
    setStep(step + 1);
  };

  const handleAddTemplate = (tpl) => {
    const exists = accounts.some((a) => a.name.toLowerCase() === tpl.name.toLowerCase());
    if (exists) return;
    setAccounts([...accounts, {
      type: tpl.type,
      name: tpl.name,
      balance: parseFloat(tpl.defaultBal) || 0,
    }]);
  };

  const handleAddCustomAccount = () => {
    if (!accName.trim()) return;
    setAccounts([...accounts, {
      type: accType,
      name: accName.trim(),
      balance: parseFloat(accBalance) || 0,
    }]);
    setAccName('');
    setAccBalance('');
    setAddingAccount(false);
  };

  const handleRemoveAccount = (index) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleFinish = (isSkipping = false) => {
    // If user was typing an account when clicking finish, auto-commit it
    let finalAccounts = [...accounts];
    if (!isSkipping && accName.trim()) {
      finalAccounts.push({
        type: accType,
        name: accName.trim(),
        balance: parseFloat(accBalance) || 0,
      });
    }

    const chosenGoal = GOAL_OPTIONS.find((g) => g.id === selectedGoal);
    updateProfile({
      name: name.trim() || (lang === 'bn' ? 'ব্যবহারকারী' : 'User'),
      avatar: selectedAvatar,
    });

    if (chosenGoal?.mode) {
      setFinancialMode(chosenGoal.mode);
    }

    // Initialize user accounts cleanly (replaces demo data)
    initializeOnboardingAccounts(isSkipping ? [] : finalAccounts);

    // Complete onboarding in store & localStorage
    completeOnboarding();
    onComplete?.();
  };

  const activeAvatarObj = getAvatarConfig(selectedAvatar) || AVATAR_OPTIONS[0];

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
      {/* Top Ambient Glow */}
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
        maxWidth: 520,
        position: 'relative',
        zIndex: 2,
        animation: 'fadeInUp 0.35s ease',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <HisabLogo variant="charcoal" size={54} style={{ margin: '0 auto var(--space-2)' }} />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-extrabold)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {t('onboarding.welcome')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {t('onboarding.welcomeDesc')}
          </p>
        </div>

        {/* Step Indicator Progress Bar */}
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

        {/* Step Container Card */}
        <div className="card" style={{
          padding: '24px 22px',
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
              STEP 0: LANGUAGE SELECTION
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
              STEP 1: PROFILE & AVATAR (NAME MANDATORY, NO SALARY)
              ========================================================== */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Avatar Selector Section */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 'var(--weight-bold)' }}>
                    {lang === 'bn' ? 'প্রোফাইল অ্যাভাটার (DP) বেছে নিন' : 'Choose Your Profile Avatar (DP)'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#5ED21C', fontWeight: 'var(--weight-bold)', background: 'rgba(94, 210, 28, 0.12)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    {lang === 'bn' ? activeAvatarObj.labelBn : activeAvatarObj.labelEn}
                  </span>
                </label>

                {/* Hero Avatar Card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-xl)',
                  marginBottom: 12,
                  border: '1px solid var(--color-border-light)',
                  gap: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Subtle Ambient Radial Glow matching active avatar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 150,
                    height: '100%',
                    background: `radial-gradient(circle at right center, ${activeAvatarObj.shadowColor || 'rgba(94, 210, 28, 0.2)'} 0%, transparent 75%)`,
                    pointerEvents: 'none',
                  }} />

                  <div style={{ position: 'relative' }}>
                    <UserAvatar
                      avatar={selectedAvatar}
                      name={name}
                      size={66}
                      style={{
                        boxShadow: `0 0 0 3px #5ED21C, 0 8px 24px ${activeAvatarObj.shadowColor || 'rgba(94, 210, 28, 0.35)'}`,
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#5ED21C',
                      color: '#111411',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>
                  <div style={{ zIndex: 1, minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                      {name.trim() || (lang === 'bn' ? 'আপনার প্রোফাইল' : 'Your Profile')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--color-text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Sparkles size={13} style={{ color: '#5ED21C' }} />
                        {lang === 'bn' ? activeAvatarObj.labelBn : activeAvatarObj.labelEn}
                      </span>
                      {activeAvatarObj.traitEn && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 'var(--weight-bold)',
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(94, 210, 28, 0.12)',
                          color: '#207208',
                          border: '1px solid rgba(94, 210, 28, 0.25)',
                        }}>
                          {lang === 'bn' ? activeAvatarObj.traitBn : activeAvatarObj.traitEn}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 12-Avatar Tactile Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 8,
                }}>
                  {AVATAR_OPTIONS.map((opt) => {
                    const isSelected = selectedAvatar === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedAvatar(opt.id)}
                        style={{
                          background: opt.bg,
                          border: 'none',
                          borderRadius: 'var(--radius-lg)',
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: isSelected
                            ? `0 0 0 2px var(--color-surface), 0 0 0 4.5px #5ED21C, 0 8px 24px ${opt.shadowColor || 'rgba(94, 210, 28, 0.4)'}`
                            : 'inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 2px 6px rgba(0, 0, 0, 0.08)',
                          zIndex: isSelected ? 2 : 1,
                        }}
                        title={`${lang === 'bn' ? opt.labelBn : opt.labelEn} (${lang === 'bn' ? opt.traitBn : opt.traitEn})`}
                      >
                        <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))' }}>
                          {opt.emoji}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Input (MANDATORY with Live Validation) */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 'var(--weight-bold)' }}>
                    {lang === 'bn' ? 'আপনার নাম বা ডাকনাম' : 'What should we call you?'}
                  </label>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 'var(--weight-bold)',
                    color: '#DC2626',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}>
                    {lang === 'bn' ? 'আবশ্যক *' : 'Mandatory *'}
                  </span>
                </div>

                <input
                  ref={nameInputRef}
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNextStep();
                    }
                  }}
                  placeholder={lang === 'bn' ? 'যেমন: ইব্রাহিম' : 'e.g. Ibrahim'}
                  style={{
                    height: 44,
                    borderColor: nameError ? '#EF4444' : undefined,
                    boxShadow: nameError ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : undefined,
                  }}
                  autoFocus
                />

                {/* Inline Error Message */}
                {nameError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: 'var(--weight-medium)',
                    animation: 'shake 0.3s ease',
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{nameError}</span>
                  </div>
                )}
              </div>

              {/* Primary Goal Selector */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, fontWeight: 'var(--weight-bold)' }}>
                  {lang === 'bn' ? 'আপনার প্রধান আর্থিক লক্ষ্য কী?' : "What's your primary financial goal?"}
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                }}>
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = selectedGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(goal.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-lg)',
                          border: `1.5px solid ${isSelected ? '#5ED21C' : 'var(--color-border)'}`,
                          background: isSelected ? 'rgba(94, 210, 28, 0.08)' : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all var(--transition-fast)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                          boxShadow: isSelected ? '0 2px 10px rgba(94, 210, 28, 0.15)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '18px' }}>{goal.icon}</span>
                          {isSelected && (
                            <div style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: '#5ED21C',
                              color: '#111411',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                          {lang === 'bn' ? goal.labelBn : goal.labelEn}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', lineHeight: 1.2 }}>
                          {lang === 'bn' ? goal.descBn : goal.descEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              STEP 2: SETUP ACCOUNTS (RECHECKED & FULLY FUNCTIONAL)
              ========================================================== */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {lang === 'bn'
                  ? 'আপনার টাকা কোথায় আছে? দ্রুত যুক্ত করতে নিচের অপশনে ট্যাপ করুন অথবা কাস্টম অ্যাকাউন্ট তৈরি করুন:'
                  : 'Add your primary wallets or accounts to start tracking your net worth:'}
              </p>

              {/* 1-Tap Quick Add Template Chips */}
              <div>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
                  {lang === 'bn' ? '১-ট্যাপে অ্যাকাউন্ট যুক্ত করুন:' : '1-Tap Quick Add:'}
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                }}>
                  {ACCOUNT_TEMPLATES.map((tpl) => {
                    const isAdded = accounts.some((a) => a.name.toLowerCase() === tpl.name.toLowerCase());
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => handleAddTemplate(tpl)}
                        disabled={isAdded}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-lg)',
                          border: `1px solid ${isAdded ? '#5ED21C' : 'var(--color-border)'}`,
                          background: isAdded ? 'rgba(94, 210, 28, 0.08)' : 'var(--color-surface)',
                          cursor: isAdded ? 'default' : 'pointer',
                          textAlign: 'left',
                          opacity: isAdded ? 0.85 : 1,
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 'var(--radius-md)',
                          background: tpl.bg,
                          color: tpl.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                            {tpl.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                            ৳{Number(tpl.defaultBal).toLocaleString()}
                          </div>
                        </div>
                        {isAdded ? (
                          <Check size={14} style={{ color: '#5ED21C', flexShrink: 0 }} />
                        ) : (
                          <Plus size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Added Accounts List */}
              {accounts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0 }}>
                    {lang === 'bn' ? `সংযুক্ত অ্যাকাউন্টসমূহ (${accounts.length}টি):` : `Added Accounts (${accounts.length}):`}
                  </label>
                  {accounts.map((acc, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-surface-secondary)',
                        border: '1px solid var(--color-border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(94, 210, 28, 0.15)',
                          color: '#207208',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {acc.type === 'mfs' ? <Smartphone size={14} /> : acc.type === 'bank' ? <Building2 size={14} /> : <Banknote size={14} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                            {acc.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                            {acc.type}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '13px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                          ৳{Number(acc.balance).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(i)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-expense)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            padding: '2px 4px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Add Account Drawer */}
              {addingAccount ? (
                <div style={{
                  padding: 14,
                  background: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  border: '1px solid var(--color-border)',
                }}>
                  <div className="toggle-group" style={{ width: '100%' }}>
                    {['mfs', 'bank', 'wallet'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`toggle-option ${accType === type ? 'active' : ''}`}
                        onClick={() => setAccType(type)}
                        style={{ flex: 1, textAlign: 'center' }}
                      >
                        {t(`accounts.${type}`)}
                      </button>
                    ))}
                  </div>

                  <input
                    className="form-input"
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAccount();
                      }
                    }}
                    placeholder={accType === 'mfs' ? 'bKash / Nagad' : accType === 'bank' ? 'City Bank' : 'Cash'}
                    style={{ height: 40 }}
                  />

                  <input
                    className="form-input"
                    type="number"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAccount();
                      }
                    }}
                    placeholder="Initial Balance (৳0)"
                    style={{ height: 40 }}
                  />

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setAddingAccount(false)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleAddCustomAccount}
                    >
                      {t('common.add')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    border: '1.5px dashed var(--color-border)',
                    justifyContent: 'center',
                    height: 40,
                    fontSize: '12px',
                    fontWeight: 'var(--weight-bold)',
                  }}
                  onClick={() => setAddingAccount(true)}
                >
                  <Plus size={14} />
                  <span>{lang === 'bn' ? '+ কাস্টম অ্যাকাউন্ট যোগ করুন' : '+ Add Custom Account'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation & Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
          gap: 12,
        }}>
          {step > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep(step - 1)}
              style={{ fontSize: '13px' }}
            >
              {t('onboarding.back')}
            </button>
          ) : <div />}

          {step < steps.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextStep}
              style={{
                height: 46,
                padding: '0 24px',
                fontSize: '14px',
                fontWeight: 'var(--weight-bold)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{t('onboarding.next')}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            /* Step 2 Finish Button */
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleFinish(false)}
              style={{
                height: 46,
                padding: '0 26px',
                fontSize: '14px',
                fontWeight: 'var(--weight-bold)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <span>
                {accounts.length > 0 || accName.trim()
                  ? (lang === 'bn' ? 'সংরক্ষণ করুন ও ড্যাশবোর্ডে যান' : 'Save & Go to Dashboard')
                  : (lang === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Go to Dashboard')}
              </span>
              <Check size={16} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Skip Link for Step 2 */}
        {step === 2 && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                textDecoration: 'underline',
              }}
              onClick={() => handleFinish(true)}
            >
              {lang === 'bn' ? 'আপাতত এড়িয়ে যান, পরে অ্যাকাউন্ট যোগ করব' : "Skip for now, I'll add accounts later"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

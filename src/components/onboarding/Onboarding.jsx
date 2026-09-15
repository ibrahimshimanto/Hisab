import { useState } from 'react';
import { Globe, User, Wallet, Plus, Smartphone, Building2, ArrowRight, Check, Sparkles } from 'lucide-react';
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

export default function Onboarding({ onComplete }) {
  const { t, lang, changeLanguage } = useTranslation();
  const { addAccount, updateProfile, setFinancialMode, completeOnboarding } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('fox');
  const [selectedGoal, setSelectedGoal] = useState('savings');

  // Account form
  const [accounts, setAccounts] = useState([]);
  const [addingAccount, setAddingAccount] = useState(false);
  const [accType, setAccType] = useState('mfs');
  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('');

  const steps = [
    { icon: Globe, title: t('onboarding.selectLanguage') },
    { icon: User, title: lang === 'bn' ? 'প্রোফাইল ও অ্যাভাটার' : 'Profile & Avatar' },
    { icon: Wallet, title: t('onboarding.setupAccounts') },
  ];

  const handleAddAccount = () => {
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

  const handleFinish = () => {
    const chosenGoal = GOAL_OPTIONS.find((g) => g.id === selectedGoal);
    updateProfile({
      name: name.trim() || (lang === 'bn' ? 'ব্যবহারকারী' : 'User'),
      avatar: selectedAvatar,
    });
    if (chosenGoal?.mode) {
      setFinancialMode(chosenGoal.mode);
    }
    accounts.forEach((acc) => addAccount(acc));
    completeOnboarding();
    onComplete();
  };

  const canProceed = () => {
    if (step === 1 && !name.trim()) return false;
    return true;
  };

  const activeAvatarObj = getAvatarConfig(selectedAvatar) || AVATAR_OPTIONS[0];

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      padding: 'var(--space-4)',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 500,
        animation: 'fadeInUp 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <HisabLogo variant="charcoal" size={56} style={{ margin: '0 auto var(--space-3)' }} />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
            {t('onboarding.welcome')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
            {t('onboarding.welcomeDesc')}
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 36 : 8,
                height: 8,
                borderRadius: 'var(--radius-full)',
                background: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'all var(--transition-base)',
              }}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-lighter)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {(() => { const Icon = steps[step].icon; return <Icon size={20} />; })()}
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>
                {steps[step].title}
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                {t('onboarding.step')} {step + 1} {t('onboarding.of')} {steps.length}
              </p>
            </div>
          </div>

          {/* Step 0: Language */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { code: 'en', label: 'English', flag: '🇬🇧', desc: 'Continue in English' },
                { code: 'bn', label: 'বাংলা', flag: '🇧🇩', desc: 'বাংলায় চালিয়ে যান' },
              ].map(({ code, label, flag, desc }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => changeLanguage(code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${lang === code ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: lang === code ? 'var(--color-primary-lighter)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-2xl)' }}>{flag}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-md)' }}>{label}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{desc}</p>
                  </div>
                  {lang === code && (
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-primary)',
                      color: '#111411',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Check size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Profile & Avatar & Goal (No Salary required!) */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Avatar Selector Showcase */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{lang === 'bn' ? 'প্রোফাইল অবতার (DP) বেছে নিন' : 'Choose Your Profile Avatar'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'var(--weight-bold)' }}>
                    {lang === 'bn' ? activeAvatarObj.labelBn : activeAvatarObj.labelEn}
                  </span>
                </label>

                {/* Selected Hero Preview */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px',
                  background: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-xl)',
                  marginBottom: '10px',
                  border: '1px solid var(--color-border-light)',
                  gap: 14,
                }}>
                  <div style={{ position: 'relative' }}>
                    <UserAvatar
                      avatar={selectedAvatar}
                      name={name}
                      size={64}
                      style={{
                        boxShadow: '0 0 0 3px #5ED21C, 0 8px 24px rgba(94, 210, 28, 0.35)',
                        transition: 'all var(--transition-fast)',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#5ED21C',
                      color: '#111411',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                      {name.trim() || (lang === 'bn' ? 'আপনার প্রোফাইল' : 'Your Profile')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={12} style={{ color: '#5ED21C' }} />
                      <span>{lang === 'bn' ? activeAvatarObj.labelBn : activeAvatarObj.labelEn}</span>
                    </div>
                  </div>
                </div>

                {/* Avatar Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '8px',
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
                          border: isSelected ? '2.5px solid #111411' : '1px solid rgba(0, 0, 0, 0.1)',
                          outline: isSelected ? '2px solid #5ED21C' : 'none',
                          outlineOffset: '2px',
                          borderRadius: 'var(--radius-lg)',
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          transition: 'all var(--transition-fast)',
                          boxShadow: isSelected ? '0 4px 12px rgba(94, 210, 28, 0.3)' : '0 2px 5px rgba(0, 0, 0, 0.08)',
                        }}
                        title={lang === 'bn' ? opt.labelBn : opt.labelEn}
                      >
                        {opt.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  {lang === 'bn' ? 'আপনার নাম বা ডাকনাম' : 'What should we call you?'}
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: ইব্রাহিম' : 'e.g. Ibrahim'}
                  autoFocus
                />
              </div>

              {/* Primary Goal Selector (Fun Question instead of Salary) */}
              <div>
                <label className="form-label">
                  {lang === 'bn' ? 'আপনার প্রধান আর্থিক লক্ষ্য কী?' : 'Your Primary Financial Goal'}
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
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

          {/* Step 2: Accounts */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {t('onboarding.setupAccountsDesc')}
              </p>

              {/* Added accounts */}
              {accounts.map((acc, i) => (
                <div key={i} className="source-card">
                  <div className="source-icon" style={{
                    background: acc.type === 'mfs' ? 'var(--color-mfs-light)' : acc.type === 'bank' ? 'var(--color-bank-light)' : 'var(--color-wallet-light)',
                    color: acc.type === 'mfs' ? 'var(--color-mfs)' : acc.type === 'bank' ? 'var(--color-bank)' : 'var(--color-wallet)',
                  }}>
                    {acc.type === 'mfs' ? <Smartphone size={18} /> : acc.type === 'bank' ? <Building2 size={18} /> : <Wallet size={18} />}
                  </div>
                  <div className="source-info">
                    <div className="source-name">{acc.name}</div>
                    <div className="source-type"><span className={`badge badge-${acc.type}`}>{t(`accounts.${acc.type}`)}</span></div>
                  </div>
                  <div className="source-balance">৳{acc.balance.toLocaleString()}</div>
                </div>
              ))}

              {/* Add account form */}
              {addingAccount ? (
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div className="toggle-group">
                    {['mfs', 'bank', 'wallet'].map((type) => (
                      <button key={type} className={`toggle-option ${accType === type ? 'active' : ''}`} onClick={() => setAccType(type)}>
                        {t(`accounts.${type}`)}
                      </button>
                    ))}
                  </div>
                  <input className="form-input" type="text" value={accName} onChange={(e) => setAccName(e.target.value)} placeholder={accType === 'mfs' ? t('accounts.providerPlaceholder') : accType === 'bank' ? t('accounts.bankPlaceholder') : t('accounts.walletPlaceholder')} />
                  <input className="form-input" type="number" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} placeholder="0" />
                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setAddingAccount(false)}>{t('common.cancel')}</button>
                    <button className="btn btn-primary btn-sm" onClick={handleAddAccount}>{t('common.add')}</button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-secondary btn-lg"
                  style={{ width: '100%', border: '2px dashed var(--color-border)', justifyContent: 'center' }}
                  onClick={() => setAddingAccount(true)}
                >
                  <Plus size={18} />
                  {t('accounts.addAccount')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              {t('onboarding.back')}
            </button>
          ) : <div />}

          {step < steps.length - 1 ? (
            <button className="btn btn-primary btn-lg" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              {t('onboarding.next')}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleFinish}>
              {t('onboarding.finish')}
              <Check size={16} />
            </button>
          )}
        </div>

        {/* Skip link */}
        {step === 2 && (
          <p style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}
              onClick={handleFinish}
            >
              {t('onboarding.addLater')}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

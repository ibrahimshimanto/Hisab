import { useState, useRef } from 'react';
import {
  Globe,
  User,
  Wallet,
  Plus,
  ArrowRight,
  Check,
  AlertCircle,
  Camera,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import HisabLogo from '../common/HisabLogo.jsx';
import {
  MFS_PROVIDERS,
  BANK_PROVIDERS,
  WALLET_PROVIDERS,
  ProviderLogo,
} from '../../lib/accountProviders.jsx';

export default function Onboarding({ onComplete }) {
  const { t, lang, changeLanguage } = useTranslation();
  const { initializeOnboardingAccounts, updateProfile, setFinancialMode, completeOnboarding, syncToCloud, user } = useStore();

  const [step, setStep] = useState(0);

  // Profile Step State
  const initialName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : '');
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.user_metadata?.avatar_url || '');

  // Account Setup State
  const [accounts, setAccounts] = useState([]);
  const [accType, setAccType] = useState('mfs'); // 'mfs' | 'bank' | 'wallet'
  const [selectedProviderId, setSelectedProviderId] = useState('bkash');
  const [accName, setAccName] = useState('bKash');
  const [accBalance, setAccBalance] = useState('');

  const nameInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const steps = [
    { icon: Globe, title: t('onboarding.selectLanguage') },
    { icon: User, title: lang === 'bn' ? 'প্রোফাইল সাজান' : 'Setup Profile' },
    { icon: Wallet, title: t('onboarding.setupAccounts') },
  ];

  // Handle Photo Upload from Device with client-side canvas compression for smooth storage
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

  const handleNextStep = () => {
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

  // Handle Type Switch in Account Form
  const handleTypeChange = (type) => {
    setAccType(type);
    if (type === 'mfs') {
      setSelectedProviderId('bkash');
      setAccName(lang === 'bn' ? 'বিকাশ' : 'bKash');
    } else if (type === 'bank') {
      setSelectedProviderId('brac');
      setAccName(lang === 'bn' ? 'ব্র্যাক ব্যাংক' : 'BRAC Bank');
    } else {
      setSelectedProviderId('cash_wallet');
      setAccName(lang === 'bn' ? 'ক্যাশ ওয়ালেট' : 'Cash Wallet');
    }
  };

  // Handle Provider Dropdown Change
  const handleProviderChange = (e) => {
    const provId = e.target.value;
    setSelectedProviderId(provId);

    const providerList = accType === 'mfs'
      ? MFS_PROVIDERS
      : accType === 'bank'
      ? BANK_PROVIDERS
      : WALLET_PROVIDERS;

    const matched = providerList.find((p) => p.id === provId);
    if (matched) {
      setAccName(lang === 'bn' ? (matched.nameBn || matched.name) : matched.name);
    }
  };

  // Add Account to Local List
  const handleAddAccount = () => {
    const finalName = accName.trim() || (accType === 'mfs' ? 'bKash' : accType === 'bank' ? 'Bank Account' : 'Cash Wallet');
    setAccounts([
      ...accounts,
      {
        type: accType,
        providerId: selectedProviderId,
        name: finalName,
        balance: parseFloat(accBalance) || 0,
      },
    ]);
    setAccBalance('');
  };

  const handleRemoveAccount = (index) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleFinish = (isSkipping = false) => {
    let finalAccounts = [...accounts];

    // If user filled in an account without clicking "+ Add Account", commit it automatically
    if (!isSkipping && accName.trim() && (accBalance !== '' || accounts.length === 0)) {
      finalAccounts.push({
        type: accType,
        providerId: selectedProviderId,
        name: accName.trim(),
        balance: parseFloat(accBalance) || 0,
      });
    }

    // Save profile with name and uploaded device photo
    updateProfile({
      name: name.trim() || (lang === 'bn' ? 'ব্যবহারকারী' : 'User'),
      avatar: profilePhoto || '',
    });

    // Default to Balanced mode
    setFinancialMode('cruise');

    // Initialize user accounts cleanly
    initializeOnboardingAccounts(isSkipping ? [] : finalAccounts);

    // Complete onboarding in store & localStorage
    completeOnboarding();
    syncToCloud();
    window.scrollTo(0, 0);
    onComplete?.();
  };

  // Active providers based on selected tab
  const currentProviderList = accType === 'mfs'
    ? MFS_PROVIDERS
    : accType === 'bank'
    ? BANK_PROVIDERS
    : WALLET_PROVIDERS;

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
        maxWidth: 520,
        position: 'relative',
        zIndex: 2,
        animation: 'fadeInUp 0.35s ease',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <HisabLogo variant="charcoal" size={52} style={{ margin: '0 auto var(--space-2)' }} />
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

        {/* Main Step Container Card */}
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
              STEP 1: PROFILE SETUP (DEVICE PHOTO UPLOAD + NAME *)
              ========================================================== */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Profile Photo Upload Center */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '16px 0 4px',
              }}>
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />

                {/* Avatar Preview Circle */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                  style={{
                    position: 'relative',
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: '0 0 0 3px #5ED21C, 0 8px 25px rgba(94, 210, 28, 0.25)',
                    background: 'var(--color-surface-secondary)',
                    overflow: 'visible',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform var(--transition-fast)',
                  }}
                  title={lang === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন' : 'Click to upload photo'}
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #111411 0%, #2A302A 100%)',
                      color: '#FFFFFF',
                      fontSize: '32px',
                      fontWeight: 'var(--weight-black)',
                    }}>
                      {(name.trim() || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Camera Action Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    backgroundColor: '#5ED21C',
                    color: '#111411',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    border: '2px solid var(--color-surface)',
                  }}>
                    <Camera size={15} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Upload Action Label & Remove Option */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      fontSize: '13px',
                      fontWeight: 'var(--weight-bold)',
                      color: 'var(--color-primary-dark)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Camera size={14} />
                    <span>{profilePhoto ? (lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Photo') : (lang === 'bn' ? 'ডিভাইস থেকে ছবি আপলোড করুন' : 'Upload Photo from Device')}</span>
                  </button>

                  {profilePhoto && (
                    <div style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfilePhoto('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-expense)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Trash2 size={12} />
                        <span>{lang === 'bn' ? 'ছবি মুছে ফেলুন' : 'Remove Photo'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Name Input (* in label, NO mandatory tag badge) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ marginBottom: 6, fontWeight: 'var(--weight-bold)' }}>
                  {lang === 'bn' ? 'আপনার নাম *' : 'What should we call you? *'}
                </label>

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
            </div>
          )}

          {/* ==========================================================
              STEP 2: SETUP ACCOUNTS (AUTHENTIC BANGLADESH MFS & BANKS)
              ========================================================== */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {lang === 'bn'
                  ? 'আপনার ব্যাংক, বিকাশ, নগদ বা ক্যাশ ওয়ালেট যুক্ত করে সম্পদ পর্যবেক্ষণ শুরু করুন:'
                  : 'Add your primary bank, bKash, Nagad or cash wallets to track your total net worth:'}
              </p>

              {/* Account Creator Form Box */}
              <div style={{
                padding: 14,
                background: 'var(--color-surface-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                border: '1px solid var(--color-border)',
              }}>
                {/* 3 Account Type Selector Tabs */}
                <div className="toggle-group" style={{ width: '100%' }}>
                  {[
                    { id: 'mfs', label: lang === 'bn' ? 'মোবাইল ব্যাংকিং (MFS)' : 'MFS' },
                    { id: 'bank', label: lang === 'bn' ? 'ব্যাংক (Bank)' : 'Bank' },
                    { id: 'wallet', label: lang === 'bn' ? 'ক্যাশ ওয়ালেট' : 'Cash Wallet' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`toggle-option ${accType === tab.id ? 'active' : ''}`}
                      onClick={() => handleTypeChange(tab.id)}
                      style={{ flex: 1, textAlign: 'center', fontSize: '12px', padding: '6px 4px' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Provider Selection Row with Brand Logo */}
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', marginBottom: 4 }}>
                    {accType === 'mfs'
                      ? (lang === 'bn' ? 'MFS প্রোভাইডার নির্বাচন করুন:' : 'Select MFS Provider:')
                      : accType === 'bank'
                      ? (lang === 'bn' ? 'ব্যাংক নির্বাচন করুন:' : 'Select Bank:')
                      : (lang === 'bn' ? 'ক্যাশ ক্যাটাগরি:' : 'Wallet Type:')}
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Live Provider Logo Box */}
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <ProviderLogo providerId={selectedProviderId} type={accType} size={24} />
                    </div>

                    {/* Styled Select Dropdown */}
                    <div style={{ position: 'relative', flex: 1 }}>
                      <select
                        className="form-input form-select"
                        value={selectedProviderId}
                        onChange={handleProviderChange}
                        style={{
                          height: 42,
                          paddingRight: 32,
                          fontWeight: 'var(--weight-semibold)',
                          background: 'var(--color-surface)',
                        }}
                      >
                        {currentProviderList.map((prov) => (
                          <option key={prov.id} value={prov.id}>
                            {lang === 'bn' ? (prov.nameBn || prov.name) : prov.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: 'var(--color-text-tertiary)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Custom Label & Balance Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: 4 }}>
                      {lang === 'bn' ? 'অ্যাকাউন্টের নাম:' : 'Account Label:'}
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      value={accName}
                      onChange={(e) => setAccName(e.target.value)}
                      placeholder={accType === 'mfs' ? 'bKash Personal' : 'City Bank Salary'}
                      style={{ height: 38, fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: 4 }}>
                      {lang === 'bn' ? 'বর্তমান ব্যালেন্স (৳):' : 'Initial Balance (৳):'}
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      value={accBalance}
                      onChange={(e) => setAccBalance(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAccount();
                        }
                      }}
                      placeholder="0"
                      style={{ height: 38, fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Add Account Button */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddAccount}
                  style={{
                    height: 38,
                    fontSize: '12.5px',
                    fontWeight: 'var(--weight-bold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>{lang === 'bn' ? '+ অ্যাকাউন্ট তালিকায় যোগ করুন' : '+ Add Account to List'}</span>
                </button>
              </div>

              {/* Added Accounts List */}
              {accounts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {lang === 'bn' ? `যুক্তকৃত অ্যাকাউন্টসমূহ (${accounts.length}টি):` : `Added Accounts (${accounts.length}):`}
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
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <ProviderLogo providerId={acc.providerId} type={acc.type} size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                            {acc.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                            {acc.type === 'mfs' ? 'MFS' : acc.type === 'bank' ? 'Bank' : 'Cash'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '14px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                          ৳{Number(acc.balance).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(i)}
                          title="Remove"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-expense)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                {accounts.length > 0 || accBalance !== ''
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

import { useState, useMemo, useRef } from 'react';
import {
  Sun,
  Moon,
  Globe,
  Download,
  Trash2,
  Check,
  Leaf,
  Scale,
  Compass,
  Rocket,
  Flame,
  RotateCcw,
  Sparkles,
  User,
  Shield,
  CheckCircle2,
  HardDrive,
  LogOut,
  Sliders,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '../i18n/index.jsx';
import useStore from '../store/useStore.js';
import Modal from '../components/ui/Modal.jsx';
import HisabLogo from '../components/common/HisabLogo.jsx';
import UserAvatar from '../components/common/UserAvatar.jsx';

export default function Settings() {
  const { t, lang, changeLanguage, formatCurrency } = useTranslation();
  const {
    profile,
    settings,
    updateProfile,
    updateSettings,
    resetAll,
    transactions,
    accounts,
    financialMode,
    setFinancialMode,
    modeSettings,
    updateModeTarget,
    resetModeTarget,
    startTour,
    user,
    syncStatus,
    setAuthModalOpen,
    syncToCloud,
    signOut,
  } = useStore();

  const [name, setName] = useState(profile.name || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

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
        setAvatar(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const userName = profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User');
  const userInitial = userName.charAt(0).toUpperCase();

  const handleSaveProfile = () => {
    updateProfile({
      name: name.trim(),
      avatar,
      monthlySalary: profile?.monthlySalary || 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeChange = (theme) => {
    updateSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleLanguageChange = (newLang) => {
    changeLanguage(newLang);
  };

  const handleExport = () => {
    const data = {
      accounts,
      transactions,
      profile,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetAll();
    setName('');
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-8)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Symmetric 2-Column Balanced Dashboard (Zero Blank Space) */}
      <div className="settings-grid">
        {/* ========================================================
            COLUMN 1: PROFILE & FINANCIAL DRIVING MODE
            ======================================================== */}
        <div className="settings-col">
          {/* Card 1: Profile & Identity */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="settings-card-header">
                <div>
                  <h3 className="card-title">{t('settings.profile')}</h3>
                  <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                    {lang === 'bn' ? 'ব্যক্তিগত তথ্য ও প্রোফাইল' : 'Personal identity & account details'}
                  </p>
                </div>
                <div className="settings-user-badge">
                  <UserAvatar avatar={avatar} name={name || userName} size={28} />
                  <span style={{ fontSize: '11.5px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {displayName(name || userName)}
                  </span>
                </div>
              </div>

              {/* Profile Identity Row: Avatar with Camera Trigger + Name Input */}
              <div className="profile-identity-box">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <div
                  className="profile-avatar-trigger-box"
                  onClick={() => fileInputRef.current?.click()}
                  title={lang === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন' : 'Click to upload or change photo'}
                >
                  <UserAvatar avatar={avatar} name={name || userName} size={58} />
                  <div className="profile-avatar-camera-badge">
                    <Camera size={11} />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>{t('settings.name')}</label>
                    {avatar?.startsWith('data:') && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '11px',
                          color: 'var(--color-expense)',
                          cursor: 'pointer',
                          fontWeight: 'var(--weight-medium)',
                        }}
                      >
                        {lang === 'bn' ? 'ছবি মুছুন' : 'Remove Photo'}
                      </button>
                    )}
                  </div>
                  <input
                    className="form-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('settings.namePlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} style={{ color: '#5ED21C' }} />
                <span>{lang === 'bn' ? 'মুদ্রা: বাংলাদেশী টাকা (৳)' : 'Base Currency: BDT (৳)'}</span>
              </span>

              <button
                type="button"
                className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
                onClick={handleSaveProfile}
                style={{ minWidth: 90, height: 34, fontSize: '12px' }}
              >
                {saved ? <Check size={14} /> : null}
                <span>{saved ? t('settings.saved') : t('settings.save')}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Financial Driving Mode */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="settings-card-header">
              <div>
                <h3 className="card-title">{lang === 'bn' ? 'আর্থিক ইঞ্জিন মোড' : 'Financial Driving Mode'}</h3>
                <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                  {lang === 'bn' ? 'আপনার জীবনযাত্রার সাথে সঞ্চয় ও ব্যয়ের হার সমন্বয় করুন' : 'Calibrate your savings targets & spending velocity'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                {
                  id: 'eco',
                  name: lang === 'bn' ? 'সঞ্চয় মোড' : 'Saver Mode',
                  desc: lang === 'bn' ? 'কঠোর সঞ্চয় ও নিয়ন্ত্রিত খরচ। দ্রুত সম্পদ গড়ার জন্য আদর্শ।' : 'Maximum wealth accumulation with disciplined safe daily limits.',
                  icon: Leaf,
                  color: '#207208',
                  bg: 'rgba(94, 210, 28, 0.14)',
                },
                {
                  id: 'cruise',
                  name: lang === 'bn' ? 'ভারসাম্য মোড' : 'Balanced Mode',
                  desc: lang === 'bn' ? 'ভারসাম্যপূর্ণ জীবন ও স্বাভাবিক নিয়ন্ত্রিত বাজেট পেস।' : 'Balanced lifestyle with predictable monthly budgeting.',
                  icon: Scale,
                  color: '#2563EB',
                  bg: 'rgba(59, 130, 246, 0.12)',
                },
                {
                  id: 'racing',
                  name: lang === 'bn' ? 'গ্রোথ মোড' : 'Growth Mode',
                  desc: lang === 'bn' ? 'ভবিষ্যতের মূলধন বিনিয়োগ, ব্যবসা ও দ্রুত সম্প্রসারণ।' : 'Aggressive capital expansion & high investment velocity.',
                  icon: Rocket,
                  color: '#D97706',
                  bg: 'rgba(245, 158, 11, 0.15)',
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = financialMode === m.id;
                const config = modeSettings[m.id] || { savingRate: 20, defaultSavingRate: 20, minRate: 15, maxRate: 35 };

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${isSelected ? m.color : 'var(--color-border)'}`,
                      background: isSelected ? 'var(--color-surface)' : 'var(--color-surface-secondary)',
                      boxShadow: isSelected ? '0 4px 16px rgba(0, 0, 0, 0.04)' : 'none',
                      transition: 'all var(--transition-fast)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setFinancialMode(m.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: m.bg,
                            color: m.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                            {m.name}
                          </h4>
                          <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 1 }}>{m.desc}</p>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 'var(--weight-bold)',
                          color: m.color,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: m.bg,
                          flexShrink: 0,
                        }}
                      >
                        {config.savingRate}% {lang === 'bn' ? 'সঞ্চয়' : 'Save'}
                      </span>
                    </div>

                    {/* Tuning Slider for Selected Mode */}
                    {isSelected && (
                      <div
                        style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--color-border-light)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                            {lang === 'bn' ? 'সঞ্চয় লক্ষ্য সীমা:' : 'Target Savings:'} {config.savingRate}% ({lang === 'bn' ? 'ব্যয় সীমা:' : 'Expense:'} {100 - config.savingRate}%)
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => resetModeTarget(m.id)}
                            style={{ padding: '2px 6px', fontSize: '10px', height: 'auto', minHeight: 'unset', gap: 4 }}
                          >
                            <RotateCcw size={10} />
                            <span>{lang === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset Default'}</span>
                          </button>
                        </div>
                        <input
                          type="range"
                          min={config.minRate}
                          max={config.maxRate}
                          step={1}
                          value={config.savingRate}
                          onChange={(e) => updateModeTarget(m.id, e.target.value)}
                          className="mode-range-input"
                          style={{ width: '100%', accentColor: m.color }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          <span>{lang === 'bn' ? 'নূন্যতম:' : 'Min:'} {config.minRate}%</span>
                          <span>{lang === 'bn' ? 'ডিফল্ট:' : 'Default:'} {config.defaultSavingRate}%</span>
                          <span>{lang === 'bn' ? 'সর্বোচ্চ:' : 'Max:'} {config.maxRate}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================
            COLUMN 2: APPEARANCE & CLOUD DATA MANAGEMENT
            ======================================================== */}
        <div className="settings-col">
          {/* Card 1: Appearance & Experience (Theme, Language, Guided Tour) */}
          <div className="card" data-tour="settings-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="settings-card-header">
                <div>
                  <h3 className="card-title">{t('settings.appearance')}</h3>
                  <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                    {lang === 'bn' ? 'থিম, ভাষা ও প্ল্যাটফর্ম নির্দেশিকা' : 'Visual theme, language & guided platform tour'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Theme Selector with Stroke */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: 8 }}>{t('settings.theme')}</label>
                  <div className="stroke-toggle-grid">
                    <button
                      type="button"
                      className={`stroke-toggle-card ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Sun size={17} style={{ color: settings.theme === 'light' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)' }} />
                        <span>{t('settings.light')}</span>
                      </div>
                      <div className="stroke-toggle-indicator">
                        {settings.theme === 'light' && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`stroke-toggle-card ${settings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Moon size={17} style={{ color: settings.theme === 'dark' ? '#5ED21C' : 'var(--color-text-secondary)' }} />
                        <span>{t('settings.dark')}</span>
                      </div>
                      <div className="stroke-toggle-indicator">
                        {settings.theme === 'dark' && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Language Selector with Stroke */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: 8 }}>{t('settings.language')}</label>
                  <div className="stroke-toggle-grid">
                    <button
                      type="button"
                      className={`stroke-toggle-card ${lang === 'en' ? 'active' : ''}`}
                      onClick={() => handleLanguageChange('en')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: '16px', lineHeight: 1 }}>🇬🇧</span>
                        <span>{t('settings.english')}</span>
                      </div>
                      <div className="stroke-toggle-indicator">
                        {lang === 'en' && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`stroke-toggle-card ${lang === 'bn' ? 'active' : ''}`}
                      onClick={() => handleLanguageChange('bn')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: '16px', lineHeight: 1 }}>🇧🇩</span>
                        <span>{t('settings.bangla')}</span>
                      </div>
                      <div className="stroke-toggle-indicator">
                        {lang === 'bn' && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Tour Section */}
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                  {lang === 'bn' ? 'ইন্টারেক্টিভ প্ল্যাটফর্ম ট্যুর' : 'Interactive Platform Tour'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {lang === 'bn' ? 'মূল ফিচারসমূহ ঘুরে দেখুন' : 'Walk through key platform highlights & features'}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-lime"
                onClick={startTour}
                style={{ gap: 6 }}
              >
                <Sparkles size={14} />
                <span>{t('tour.start')}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Data Export & System */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="settings-card-header">
                <div>
                  <h3 className="card-title">{lang === 'bn' ? 'ডাটা ও সিস্টেম' : 'Data & System'}</h3>
                  <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                    {lang === 'bn' ? 'আপনার আর্থিক হিসাব এক্সপোর্ট ও ব্যাকআপ নিন' : 'Export your financial records & system details'}
                  </p>
                </div>
                {user && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'var(--color-surface-secondary)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <User size={12} style={{ color: '#5ED21C' }} />
                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                  </span>
                )}
              </div>

              {/* Export Data */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', margin: 0 }}>{t('settings.exportData')}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>{t('settings.exportDataDesc')}</p>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport} style={{ gap: 6 }}>
                  <Download size={14} />
                  <span>{t('transactions.exportCSV')}</span>
                </button>
              </div>

              {/* Sign out if logged in */}
              {user && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0 0', marginTop: 'var(--space-2)', borderTop: '1px dashed var(--color-border-light)' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {lang === 'bn' ? 'বর্তমান সেশন থেকে লগআউট' : 'Sign out of current account'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={signOut}
                    style={{ gap: 5, fontSize: '11.5px', color: 'var(--color-expense)', height: 30 }}
                  >
                    <LogOut size={13} />
                    <span>{lang === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hisab Brand & System Footer */}
            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <HisabLogo variant="charcoal" size={36} />
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {t('app.name')} v1.0.0
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    <HardDrive size={11} />
                    <span>Supabase Cloud Database • Online Active</span>
                  </div>
                </div>
              </div>
              <span className="badge badge-income" style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', padding: '3px 8px' }}>
                ONLINE ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* ========================================================
          ISOLATED DANGER ZONE CARD (System Data Reset Safety)
          ======================================================== */}
      <div className="card danger-zone-card animate-fade-in" style={{ marginTop: 'var(--space-6)' }}>
        <div className="danger-zone-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="danger-zone-icon-box">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="danger-zone-title" style={{ color: 'var(--color-expense)' }}>
                {lang === 'bn' ? 'সতর্কতা অঞ্চল (ডেঞ্জার জোন)' : 'Danger Zone • System Data Reset'}
              </h3>
              <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                {lang === 'bn'
                  ? 'সমস্ত হিসাব, লেনদেন, ব্যাংক অ্যাকাউন্ট ও বাজেট স্থায়ীভাবে মুছে ফেলুন'
                  : 'Permanently erase all local & cloud transactions, accounts, and financial schemes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setShowResetConfirm(true)}
            style={{ gap: 6, whiteSpace: 'nowrap' }}
          >
            <Trash2 size={14} />
            <span>{t('settings.resetData')}</span>
          </button>
        </div>
      </div>

      {/* Reset Confirm Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title={t('settings.resetData')}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-danger" onClick={handleReset}>{t('settings.reset')}</button>
          </>
        }
      >
        <p className="confirm-message">{t('settings.resetConfirm')}</p>
      </Modal>
    </div>
  );
}

function displayName(name) {
  if (!name) return 'User';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 2) return `${parts[0]} ${parts[1]}`;
  return name;
}

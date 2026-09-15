import { useState, useMemo } from 'react';
import {
  Sun,
  Moon,
  Globe,
  Download,
  Trash2,
  Check,
  Leaf,
  Compass,
  Flame,
  RotateCcw,
  Sparkles,
  User,
  Shield,
  CheckCircle2,
  HardDrive,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useTranslation } from '../i18n/index.jsx';
import useStore from '../store/useStore.js';
import Modal from '../components/ui/Modal.jsx';
import HisabLogo from '../components/common/HisabLogo.jsx';

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
  const [salary, setSalary] = useState(profile.monthlySalary ? String(profile.monthlySalary) : '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleManualSync = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setIsSyncing(true);
    await syncToCloud();
    setIsSyncing(false);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 2000);
  };

  const userName = profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User');
  const userInitial = userName.charAt(0).toUpperCase();

  const handleSaveProfile = () => {
    updateProfile({
      name: name.trim(),
      monthlySalary: parseFloat(salary) || 0,
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
    setSalary('');
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
            COLUMN 1: PROFILE & APPEARANCE / EXPERIENCE
            ======================================================== */}
        <div className="settings-col">
          {/* Card 1: Profile & Identity */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="settings-card-header">
                <div>
                  <h3 className="card-title">{t('settings.profile')}</h3>
                  <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                    {lang === 'bn' ? 'ব্যক্তিগত তথ্য ও আয়ের বিবরণ' : 'Personal identity & income parameters'}
                  </p>
                </div>
                <div className="settings-user-badge">
                  <div className="settings-user-avatar-mini">{userInitial}</div>
                  <span style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                    {displayName(userName)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('settings.name')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('settings.namePlaceholder')}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>{t('settings.monthlySalary')}</label>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>BDT (৳)</span>
                  </div>
                  <input
                    className="form-input"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder={t('settings.salaryPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} style={{ color: '#5ED21C' }} />
                <span>{lang === 'bn' ? 'মুদ্রা: বাংলাদেশী টাকা (৳)' : 'Base Currency: BDT (৳)'}</span>
              </span>

              <button
                type="button"
                className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
                onClick={handleSaveProfile}
                style={{ minWidth: 100 }}
              >
                {saved ? <Check size={16} /> : null}
                <span>{saved ? t('settings.saved') : t('settings.save')}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Appearance & Experience (Theme, Language, Guided Tour) */}
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
                {/* Theme Selector */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('settings.theme')}</label>
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-option ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                      {t('settings.light')}
                    </button>
                    <button
                      type="button"
                      className={`toggle-option ${settings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                      {t('settings.dark')}
                    </button>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('settings.language')}</label>
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-option ${lang === 'en' ? 'active' : ''}`}
                      onClick={() => handleLanguageChange('en')}
                    >
                      🇬🇧 {t('settings.english')}
                    </button>
                    <button
                      type="button"
                      className={`toggle-option ${lang === 'bn' ? 'active' : ''}`}
                      onClick={() => handleLanguageChange('bn')}
                    >
                      🇧🇩 {t('settings.bangla')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Tour Section */}
            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
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
        </div>

        {/* ========================================================
            COLUMN 2: FINANCIAL DRIVING MODE & DATA / SYSTEM STORAGE
            ======================================================== */}
        <div className="settings-col">
          {/* Card 1: Financial Driving Mode */}
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
                  name: lang === 'bn' ? 'ইকো সেভার মোড' : 'Eco-Saver Mode',
                  desc: lang === 'bn' ? 'কঠোর সঞ্চয় ও নিয়ন্ত্রিত খরচ। সম্পদ গড়ার জন্য আদর্শ।' : 'Maximum wealth accumulation with disciplined safe daily limits.',
                  icon: Leaf,
                  color: '#207208',
                  bg: 'rgba(94, 210, 28, 0.14)',
                },
                {
                  id: 'cruise',
                  name: lang === 'bn' ? 'ব্যালান্সড ক্রুজ মোড' : 'Daily Cruise Mode',
                  desc: lang === 'bn' ? 'ভারসাম্যপূর্ণ জীবন ও স্বাভাবিক বাজেট পেস।' : 'Balanced lifestyle with predictable monthly budgeting.',
                  icon: Compass,
                  color: '#2563EB',
                  bg: 'rgba(59, 130, 246, 0.12)',
                },
                {
                  id: 'racing',
                  name: lang === 'bn' ? 'রেসিং এক্সপ্যানশন মোড' : 'Racing Expansion Mode',
                  desc: lang === 'bn' ? 'উচ্চগতির মূলধন বিনিয়োগ ও দ্রুত সম্প্রসারণ।' : 'Aggressive capital expansion & high burn velocity.',
                  icon: Flame,
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

          {/* Card 2: Cloud Sync & Data Management */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="settings-card-header">
                <div>
                  <h3 className="card-title">{lang === 'bn' ? 'ক্লাউড সিঙ্ক ও ডাটা ম্যানেজমেন্ট' : 'Cloud Sync & Data Storage'}</h3>
                  <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                    {lang === 'bn' ? 'Supabase ব্যাকআপ, মাল্টি-ডিভাইস সিঙ্ক ও লোকাল স্টোরেজ' : 'Supabase cloud backup, cross-device sync & local data'}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 'var(--weight-bold)',
                    color: '#207208',
                    backgroundColor: 'rgba(94, 210, 28, 0.15)',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    border: '1px solid rgba(94, 210, 28, 0.3)',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#5ED21C', boxShadow: '0 0 6px #5ED21C' }} />
                  <Cloud size={12} />
                  <span>{lang === 'bn' ? 'অনলাইন ও সিঙ্কড' : 'Online & Synced'}</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* Cloud Sync Account Banner */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(94, 210, 28, 0.08)',
                    border: '1px solid rgba(94, 210, 28, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(94, 210, 28, 0.18)',
                        color: '#5ED21C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Cloud size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                        {user ? user.email : (lang === 'bn' ? 'সরাসরি ক্লাউড সিঙ্ক সক্রিয়' : 'Automatic Cloud Sync Active')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                        {user
                          ? (lang === 'bn' ? 'সরাসরি রিয়েল-টাইম ক্লাউড ব্যাকআপ চলছে' : 'Encrypted cloud backup linked to account')
                          : (lang === 'bn' ? 'Supabase ব্যাকএন্ডে রিয়েল-টাইম অটোমেটিক সিঙ্ক চলছে' : 'Auto-syncing in real-time with Supabase Cloud')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      style={{ gap: 5, fontSize: '11px', height: 32 }}
                    >
                      <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                      <span>{syncSuccess ? (lang === 'bn' ? 'সিঙ্কড!' : 'Synced!') : (lang === 'bn' ? 'সিঙ্ক করুন' : 'Sync Now')}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAuthModalOpen(true)}
                      style={{ fontSize: '11px', height: 32, padding: '0 8px' }}
                    >
                      <span>{user ? (lang === 'bn' ? 'ম্যানেজ' : 'Manage') : (lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account')}</span>
                    </button>
                  </div>
                </div>

                {/* Export Data */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border-light)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', margin: 0 }}>{t('settings.exportData')}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>{t('settings.exportDataDesc')}</p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport} style={{ gap: 6 }}>
                    <Download size={14} />
                    <span>{t('transactions.exportCSV')}</span>
                  </button>
                </div>

                {/* Reset Data */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-expense)', margin: 0 }}>{t('settings.resetData')}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>{t('settings.resetDataDesc')}</p>
                  </div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setShowResetConfirm(true)} style={{ gap: 6 }}>
                    <Trash2 size={14} />
                    <span>{t('settings.reset')}</span>
                  </button>
                </div>
              </div>
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
                CLOUD SYNC ACTIVE
              </span>
            </div>
          </div>
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

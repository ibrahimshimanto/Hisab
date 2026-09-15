import { useState } from 'react';
import { Globe, User, Wallet, Plus, Smartphone, Building2, ArrowRight, Check } from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import HisabLogo from '../common/HisabLogo.jsx';

export default function Onboarding({ onComplete }) {
  const { t, lang, changeLanguage } = useTranslation();
  const { addAccount, updateProfile, completeOnboarding } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');

  // Account form
  const [accounts, setAccounts] = useState([]);
  const [addingAccount, setAddingAccount] = useState(false);
  const [accType, setAccType] = useState('mfs');
  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('');

  const steps = [
    { icon: Globe, title: t('onboarding.selectLanguage') },
    { icon: User, title: t('onboarding.setupProfile') },
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
    updateProfile({ name: name.trim(), monthlySalary: parseFloat(salary) || 0 });
    accounts.forEach((acc) => addAccount(acc));
    completeOnboarding();
    onComplete();
  };

  const canProceed = () => {
    if (step === 1 && !name.trim()) return false;
    return true;
  };

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
        maxWidth: 480,
        animation: 'fadeInUp 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <HisabLogo variant="charcoal" size={64} style={{ margin: '0 auto var(--space-4)' }} />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
            {t('onboarding.welcome')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
            {t('onboarding.welcomeDesc')}
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 32 : 8,
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

          {/* Step 1: Profile */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {t('onboarding.setupProfileDesc')}
              </p>
              <div className="form-group">
                <label className="form-label">{t('settings.name')}</label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.namePlaceholder')}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('settings.monthlySalary')}</label>
                <input
                  className="form-input"
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder={t('settings.salaryPlaceholder')}
                />
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

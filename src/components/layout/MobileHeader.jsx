import { useMemo } from 'react';
import { Sun, Moon, Globe, Settings as SettingsIcon, Leaf, Compass, Flame, Cloud, CloudOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import UserAvatar from '../common/UserAvatar.jsx';

export default function MobileHeader() {
  const navigate = useNavigate();
  const { lang, changeLanguage } = useTranslation();
  const { profile, settings, updateSettings, financialMode, user, setAuthModalOpen } = useStore();

  const isDark = settings.theme === 'dark';

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const toggleLang = () => {
    changeLanguage(lang === 'en' ? 'bn' : 'en');
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (lang === 'bn') {
      if (hour < 12) return 'শুভ সকাল';
      if (hour < 17) return 'শুভ দুপুর';
      return 'শুভ সন্ধ্যা';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [lang]);

  const userName = profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User');

  const displayName = useMemo(() => {
    if (!profile?.name) return lang === 'bn' ? 'ব্যবহারকারী' : 'User';
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length > 2) return `${parts[0]} ${parts[1]}`;
    return profile.name;
  }, [profile?.name, lang]);

  const modeBadge = {
    eco: { label: lang === 'bn' ? 'ইকো' : 'Eco', icon: Leaf, color: '#207208', bg: 'rgba(94, 210, 28, 0.15)' },
    cruise: { label: lang === 'bn' ? 'ক্রুজ' : 'Cruise', icon: Compass, color: '#2563EB', bg: 'rgba(59, 130, 246, 0.12)' },
    racing: { label: lang === 'bn' ? 'রেসিং' : 'Racing', icon: Flame, color: '#D97706', bg: 'rgba(245, 158, 11, 0.15)' },
  }[financialMode] || { label: 'Cruise', icon: Compass, color: '#2563EB', bg: 'rgba(59, 130, 246, 0.12)' };

  const ModeIcon = modeBadge.icon;

  return (
    <header className="mobile-header">
      {/* Left: User Profile & Mode Pill */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0, flex: '1 1 auto' }}
        onClick={() => navigate('/settings')}
        title={lang === 'bn' ? 'প্রোফাইল ও সেটিংস' : 'Profile & Settings'}
      >
        <UserAvatar
          avatar={profile?.avatar}
          name={userName}
          size={38}
        />
        <div className="mobile-greeting" style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="mobile-greeting-sub">{greeting}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: modeBadge.bg,
                color: modeBadge.color,
                fontSize: '9px',
                fontWeight: 'var(--weight-bold)',
                flexShrink: 0,
              }}
            >
              <ModeIcon size={10} />
              <span>{modeBadge.label}</span>
            </span>
          </div>
          <span className="mobile-greeting-name">{displayName}</span>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Cloud Sync Status Pill */}
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 9px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(94, 210, 28, 0.14)',
            border: '1px solid rgba(94, 210, 28, 0.32)',
            color: '#207208',
            fontSize: '11px',
            fontWeight: 'var(--weight-bold)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          }}
          title={lang === 'bn' ? 'ক্লাউড স্বয়ংক্রিয়ভাবে সিঙ্কড (অনলাইন)' : 'Cloud Auto-Synced • Online'}
        >
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#5ED21C',
            boxShadow: '0 0 6px #5ED21C',
            display: 'inline-block',
          }} />
          <Cloud size={13} style={{ color: '#5ED21C' }} />
          <span>{lang === 'bn' ? 'সিঙ্কড' : 'Synced'}</span>
        </button>

        {/* Unified Controls Pill (Language + Theme) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--glass-bg-card)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-full)',
          padding: '2px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}>
          <button
            type="button"
            onClick={toggleLang}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
              fontSize: '11px',
              fontWeight: 'var(--weight-bold)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)',
            }}
            title={lang === 'en' ? 'বাংলা ভাষায় পরিবর্তন' : 'Switch to English'}
          >
            {lang === 'en' ? 'বাং' : 'EN'}
          </button>

          <span style={{ width: 1, height: 14, background: 'var(--glass-border)', opacity: 0.8 }} />

          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px 7px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)',
            }}
            title={lang === 'bn' ? 'থিম পরিবর্তন' : 'Toggle Theme'}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}

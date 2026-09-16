import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  PiggyBank,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Globe,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import HisabLogo from '../common/HisabLogo.jsx';
import UserAvatar from '../common/UserAvatar.jsx';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/accounts', icon: Wallet, labelKey: 'nav.accounts' },
  { path: '/transactions', icon: ArrowLeftRight, labelKey: 'nav.transactions' },
  { path: '/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { path: '/budgets', icon: PieChart, labelKey: 'nav.budgets' },
  { path: '/savings', icon: PiggyBank, labelKey: 'nav.savings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, changeLanguage } = useTranslation();
  const { profile, settings, updateSettings, sidebarCollapsed, toggleSidebar, user, setAuthModalOpen } = useStore();

  const isSettingsActive = location.pathname === '/settings';
  const isDark = settings.theme === 'dark';

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const toggleLang = () => {
    changeLanguage(lang === 'en' ? 'bn' : 'en');
  };

  const userName = profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User');
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Logo & Collapse/Expand Button */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
          <div
            onClick={sidebarCollapsed ? toggleSidebar : undefined}
            style={{ cursor: sidebarCollapsed ? 'pointer' : 'default', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            title={sidebarCollapsed ? 'Expand Sidebar' : undefined}
          >
            <HisabLogo variant="charcoal" size={sidebarCollapsed ? 36 : 38} />
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-logo-text-wrap" style={{ minWidth: 0, overflow: 'hidden' }}>
              <span className="sidebar-logo-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em' }}>{t('app.name')}</span>
              <div className="sidebar-logo-sub" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.12em' }}>PERSONAL FINANCE</div>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          className="btn btn-icon btn-sm btn-ghost sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
          style={{ width: 32, height: 32, flexShrink: 0 }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, labelKey }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? t(labelKey) : undefined}
          >
            <Icon size={20} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span>{t(labelKey)}</span>}
          </NavLink>
        ))}

        {/* Quick Toggles: Language & Theme */}
        <div className="sidebar-quick-toggles">

          <button
            type="button"
            className="sidebar-toggle-action"
            onClick={toggleLang}
            title={sidebarCollapsed ? (lang === 'en' ? 'বাংলা (BN)' : 'English (EN)') : (lang === 'en' ? 'Switch to বাংলা' : 'Switch to English')}
            aria-label="Switch Language"
          >
            <Globe size={16} className="sidebar-toggle-icon" />
            {!sidebarCollapsed && (
              <span className="sidebar-toggle-label">
                {lang === 'en' ? 'বাংলা' : 'English'}
              </span>
            )}
          </button>

          <button
            type="button"
            className="sidebar-toggle-action"
            onClick={toggleTheme}
            title={sidebarCollapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode')}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun size={16} className="sidebar-toggle-icon theme-sun" />
            ) : (
              <Moon size={16} className="sidebar-toggle-icon theme-moon" />
            )}
            {!sidebarCollapsed && (
              <span className="sidebar-toggle-label">
                {isDark ? (lang === 'bn' ? 'লাইট' : 'Light') : (lang === 'bn' ? 'ডার্ক' : 'Dark')}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* User Profile Footer -> Click to open Settings */}
      <div className="sidebar-footer">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className={`sidebar-profile-wrap sidebar-profile-btn ${isSettingsActive ? 'active' : ''}`}
          title={lang === 'bn' ? 'সেটিংস ও প্রোফাইল' : 'Settings & Profile'}
          aria-label={lang === 'bn' ? 'সেটিংস ও প্রোফাইল' : 'Settings & Profile'}
        >
          <div className="sidebar-profile-avatar-box">
            <UserAvatar
              avatar={profile?.avatar}
              name={userName}
              size={36}
            />
            <div className="sidebar-profile-gear-pill" title="Settings">
              <Settings size={10} />
            </div>
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-footer-info" style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-bold)',
                  color: isSettingsActive ? '#5ED21C' : 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 4,
                }}
              >
                <span>{userName}</span>
                <Settings size={12} style={{ color: isSettingsActive ? '#5ED21C' : 'var(--color-text-tertiary)', flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                <span>{lang === 'bn' ? 'সেটিংস ও প্রোফাইল' : 'Settings & Profile'}</span>
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

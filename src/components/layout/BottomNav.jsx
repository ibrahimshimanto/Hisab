import { NavLink } from 'react-router-dom';
import { Home, Wallet, ArrowLeftRight, Target, BarChart3 } from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

export default function BottomNav() {
  const { lang } = useTranslation();
  const { quickAddModal, savingsModal, depositModal, calculatorModal, voiceModal, isTourOpen } = useStore();

  const isStoreModalOpen =
    Boolean(quickAddModal?.isOpen) ||
    Boolean(savingsModal?.isOpen) ||
    Boolean(depositModal?.isOpen) ||
    Boolean(calculatorModal?.isOpen) ||
    Boolean(voiceModal?.isOpen) ||
    Boolean(isTourOpen);

  if (isStoreModalOpen) return null;

  const navItems = [
    { to: '/', end: true, label: lang === 'bn' ? 'হোম' : 'Home', icon: Home },
    { to: '/accounts', end: false, label: lang === 'bn' ? 'অ্যাকাউন্ট' : 'Accounts', icon: Wallet },
    { to: '/transactions', end: false, label: lang === 'bn' ? 'লেনদেন' : 'History', icon: ArrowLeftRight },
    { to: '/analytics', end: false, label: lang === 'bn' ? 'অ্যানালিটিক্স' : 'Analytics', icon: BarChart3 },
    { to: '/budgets', end: false, label: lang === 'bn' ? 'বাজেট' : 'Budgets', icon: Target },
  ];

  return (
    <nav className="floating-capsule-nav" aria-label="Mobile Navigation">
      <div className="floating-capsule-track">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `capsule-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              title={item.label}
            >
              <div className="capsule-icon-wrap">
                <Icon size={17} strokeWidth={2.4} />
              </div>
              <span className="capsule-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

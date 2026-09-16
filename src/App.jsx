import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/index.jsx';
import useStore from './store/useStore.js';
import Layout from './components/layout/Layout.jsx';
import AuthScreen from './components/auth/AuthScreen.jsx';
import Onboarding from './components/onboarding/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Accounts from './pages/Accounts.jsx';
import Transactions from './pages/Transactions.jsx';
import Budgets from './pages/Budgets.jsx';
import Savings from './pages/Savings.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import HisabLogo from './components/common/HisabLogo.jsx';
import './index.css';
import './styles/components.css';

function AppContent() {
  const {
    user,
    onboardingComplete,
    settings,
    initAuth,
    isAuthLoading,
  } = useStore();

  useEffect(() => {
    // Initialize Supabase auth & cloud sync listener
    initAuth();

    // Apply saved theme on mount
    if (settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    // Apply saved language
    const savedLang = localStorage.getItem('hisab-lang');
    if (savedLang) {
      document.documentElement.setAttribute('data-lang', savedLang);
    }
  }, []);

  // 1. Cold start / checking session loading screen
  if (isAuthLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'var(--color-bg)',
      }}>
        <HisabLogo variant="charcoal" size={56} style={{ animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          fontWeight: 'var(--weight-semibold)',
          letterSpacing: '0.02em',
        }}>
          Hisab • হিসাব
        </div>
      </div>
    );
  }

  // 2. Not logged in: Show AuthScreen (Google Sign In / Email OTP)
  if (!user) {
    return <AuthScreen />;
  }

  // 3. Logged in, but hasn't completed onboarding: Show Onboarding
  if (!onboardingComplete) {
    return <Onboarding />;
  }

  // 4. Authenticated & Onboarded: Show Main App
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

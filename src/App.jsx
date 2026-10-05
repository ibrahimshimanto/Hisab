import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/index.jsx';
import SaveNotice from './components/common/SaveNotice.jsx';
import useStore from './store/useStore.js';
import Layout from './components/layout/Layout.jsx';
import HisabLogo from './components/common/HisabLogo.jsx';
import './index.css';
import './styles/components.css';

// Lazy-loaded pages for granular bundle splitting & performance
const Onboarding = lazy(() => import('./components/onboarding/Onboarding.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Accounts = lazy(() => import('./pages/Accounts.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const Budgets = lazy(() => import('./pages/Budgets.jsx'));
const Savings = lazy(() => import('./pages/Savings.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

function FullscreenLoadingFallback() {
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
  }, [settings.theme]);

  // 1. Cold start / checking session loading screen
  if (isAuthLoading) {
    return <FullscreenLoadingFallback />;
  }

  // 2. If not authenticated or onboarding not completed yet: Show Onboarding directly
  if (!user || !onboardingComplete) {
    return (
      <Suspense fallback={<FullscreenLoadingFallback />}>
        <Onboarding />
      </Suspense>
    );
  }

  // 3. Authenticated & Onboarded: Show Main App
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
      <SaveNotice />
      <AppContent />
    </I18nProvider>
  );
}

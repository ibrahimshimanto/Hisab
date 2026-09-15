import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/index.jsx';
import useStore from './store/useStore.js';
import Layout from './components/layout/Layout.jsx';
import Onboarding from './components/onboarding/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Accounts from './pages/Accounts.jsx';
import Transactions from './pages/Transactions.jsx';
import Budgets from './pages/Budgets.jsx';
import Savings from './pages/Savings.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import './index.css';
import './styles/components.css';

function AppContent() {
  const { onboardingComplete, settings, initAuth } = useStore();
  const [showOnboarding, setShowOnboarding] = useState(!onboardingComplete);

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

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

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

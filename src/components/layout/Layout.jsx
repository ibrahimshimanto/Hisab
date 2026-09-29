import { Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import MobileHeader from './MobileHeader.jsx';
import useStore from '../../store/useStore.js';

// Lazy-load all heavy overlay modals and guided tour for on-demand chunk delivery
const QuickTransactionModal = lazy(() => import('../modals/QuickTransactionModal.jsx'));
const SavingsModal = lazy(() => import('../savings/SavingsModal.jsx'));
const SavingsDepositModal = lazy(() => import('../savings/SavingsDepositModal.jsx'));
const PurchaseCalculatorModal = lazy(() => import('../projections/PurchaseCalculatorModal.jsx'));
const TourGuide = lazy(() => import('../tour/TourGuide.jsx'));
const AuthModal = lazy(() => import('../auth/AuthModal.jsx'));

function PageLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid var(--color-border)',
        borderTopColor: '#5ED21C',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', letterSpacing: '0.01em' }}>
        লোড হচ্ছে... • Loading...
      </span>
    </div>
  );
}

export default function Layout() {
  const {
    sidebarCollapsed,
    quickAddModal,
    savingsModal,
    depositModal,
    calculatorModal,
    isTourOpen,
    authModalOpen,
  } = useStore();

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />
      <MobileHeader />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />

      {/* Conditionally rendered lazy modals: 0 initial weight */}
      <Suspense fallback={null}>
        {quickAddModal?.isOpen && <QuickTransactionModal />}
        {savingsModal?.isOpen && <SavingsModal />}
        {depositModal?.isOpen && <SavingsDepositModal />}
        {calculatorModal?.isOpen && <PurchaseCalculatorModal />}
        {isTourOpen && <TourGuide />}
        {authModalOpen && <AuthModal />}
      </Suspense>
    </div>
  );
}

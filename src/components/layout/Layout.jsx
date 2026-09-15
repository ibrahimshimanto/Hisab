import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import MobileHeader from './MobileHeader.jsx';
import QuickTransactionModal from '../modals/QuickTransactionModal.jsx';
import SavingsModal from '../savings/SavingsModal.jsx';
import SavingsDepositModal from '../savings/SavingsDepositModal.jsx';
import PurchaseCalculatorModal from '../projections/PurchaseCalculatorModal.jsx';
import TourGuide from '../tour/TourGuide.jsx';
import AuthModal from '../auth/AuthModal.jsx';
import useStore from '../../store/useStore.js';

export default function Layout() {
  const { sidebarCollapsed } = useStore();

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />
      <MobileHeader />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Outlet />
      </main>
      <BottomNav />
      <QuickTransactionModal />
      <SavingsModal />
      <SavingsDepositModal />
      <PurchaseCalculatorModal />
      <TourGuide />
      <AuthModal />
    </div>
  );
}

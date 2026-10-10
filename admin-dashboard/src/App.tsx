import React, { useState, Suspense, lazy } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginView } from './views/LoginView';
import { AcceptInviteView } from './views/AcceptInviteView';
import type { NavView } from './components/layout/Sidebar';
import { Zap, Loader2 } from 'lucide-react';

// Lazy-loaded Views for High-Performance Code Splitting
const DashboardOverview = lazy(() => import('./views/DashboardOverview').then((m) => ({ default: m.DashboardOverview })));
const CarsInventory = lazy(() => import('./views/CarsInventory').then((m) => ({ default: m.CarsInventory })));
const OrdersManagement = lazy(() => import('./views/OrdersManagement').then((m) => ({ default: m.OrdersManagement })));
const CustomersView = lazy(() => import('./views/CustomersView').then((m) => ({ default: m.CustomersView })));
const MarketingView = lazy(() => import('./views/MarketingView').then((m) => ({ default: m.MarketingView })));
const SystemSettings = lazy(() => import('./views/SystemSettings').then((m) => ({ default: m.SystemSettings })));

const ViewLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-100 space-y-3">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    <span className="text-xs font-semibold text-slate-500">Đang tải phân hệ...</span>
  </div>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [hasDismissedInvite, setHasDismissedInvite] = useState(false);

  const handleOpenAddCar = () => {
    setCurrentView('cars');
    setIsAddCarModalOpen(true);
  };

  const isInvite = !hasDismissedInvite && (() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return Boolean(p.get('invite_token') || p.get('invited'));
    } catch {
      return false;
    }
  })();

  // Luxury Fullscreen Loading State (Light Mode Admin Standard)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 space-y-4 select-none">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 animate-pulse">
          <Zap className="w-7 h-7 fill-current" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-extrabold text-lg tracking-tight text-slate-900">AutoMatch AI Executive</h3>
          <p className="text-xs text-slate-500 font-medium">Đang khởi tạo phiên làm việc bảo mật Supabase RLS...</p>
        </div>
      </div>
    );
  }

  // Handle invitation URL first
  if (isInvite) {
    return <AcceptInviteView onDismiss={() => setHasDismissedInvite(true)} />;
  }

  // Not authenticated as Owner/Manager -> Render Admin Login Portal
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <DataProvider>
      <AdminLayout
        currentView={currentView}
        onSelectView={setCurrentView}
        onQuickAddCar={handleOpenAddCar}
      >
        <Suspense fallback={<ViewLoadingFallback />}>
          {currentView === 'dashboard' && (
            <DashboardOverview
              onNavigate={setCurrentView}
              onOpenAddCar={handleOpenAddCar}
            />
          )}
          {currentView === 'cars' && (
            <CarsInventory
              isAddModalOpen={isAddCarModalOpen}
              onCloseAddModal={() => setIsAddCarModalOpen(false)}
            />
          )}
          {currentView === 'orders' && <OrdersManagement />}
          {currentView === 'customers' && <CustomersView />}
          {currentView === 'marketing' && <MarketingView />}
          {currentView === 'settings' && <SystemSettings />}
        </Suspense>
      </AdminLayout>
    </DataProvider>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
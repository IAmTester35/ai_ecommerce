import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginView } from './views/LoginView';
import type { NavView } from './components/layout/Sidebar';
import { Zap } from 'lucide-react';

// Views
import { DashboardOverview } from './views/DashboardOverview';
import { CarsInventory } from './views/CarsInventory';
import { OrdersManagement } from './views/OrdersManagement';
import { TestDrivesView } from './views/TestDrivesView';
import { ShowroomsView } from './views/ShowroomsView';
import { VouchersView } from './views/VouchersView';
import { CustomersView } from './views/CustomersView';
import { ReviewsQAView } from './views/ReviewsQAView';
import { AiSearchInspector } from './views/AiSearchInspector';
import { NotificationsView } from './views/NotificationsView';
import { SystemSettings } from './views/SystemSettings';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);

  const handleOpenAddCar = () => {
    setCurrentView('cars');
    setIsAddCarModalOpen(true);
  };

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
        {currentView === 'test_drives' && <TestDrivesView />}
        {currentView === 'showrooms' && <ShowroomsView />}
        {currentView === 'vouchers' && <VouchersView />}
        {currentView === 'customers' && <CustomersView />}
        {currentView === 'reviews_qa' && <ReviewsQAView />}
        {currentView === 'ai_inspector' && <AiSearchInspector />}
        {currentView === 'notifications' && <NotificationsView />}
        {currentView === 'settings' && <SystemSettings />}
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
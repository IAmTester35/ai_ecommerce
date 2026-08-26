import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AdminLayout } from './components/layout/AdminLayout';
import type { NavView } from './components/layout/Sidebar';

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
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);

  const handleOpenAddCar = () => {
    setCurrentView('cars');
    setIsAddCarModalOpen(true);
  };

  return (
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
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
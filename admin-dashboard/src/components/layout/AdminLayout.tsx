import React, { useState } from 'react';
import { Sidebar, type NavView } from './Sidebar';
import { TopHeader } from './TopHeader';
import { X } from 'lucide-react';

interface AdminLayoutProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onQuickAddCar?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentView,
  onSelectView,
  onQuickAddCar,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A]">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden md:block">
        <Sidebar currentView={currentView} onSelectView={onSelectView} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 bg-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              currentView={currentView}
              onSelectView={(view) => {
                onSelectView(view);
                setMobileOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <TopHeader
          currentView={currentView}
          onSelectView={onSelectView}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onQuickAddCar={onQuickAddCar}
        />

        <main className="flex-1 px-6 py-8 sm:px-10 sm:py-9 lg:px-12 lg:py-10 max-w-384 w-full mx-auto space-y-8 sm:space-y-10">
          {children}
        </main>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ViewState } from './types';
import { useApp } from './context/AppContext';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, LayoutDashboard, Calculator, Package, FileText, Settings } from 'lucide-react';

const DashboardView = React.lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const POSView = React.lazy(() => import('./views/POSView').then(m => ({ default: m.POSView })));
const InventoryView = React.lazy(() => import('./views/InventoryView').then(m => ({ default: m.InventoryView })));
const ReportsView = React.lazy(() => import('./views/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

const LoadingView = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
  </div>
);

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'pos', label: 'Kasir', icon: Calculator },
  { id: 'inventory', label: 'Stok', icon: Package },
  { id: 'reports', label: 'Laporan', icon: FileText },
  { id: 'settings', label: 'Setelan', icon: Settings },
];

const ToastNotification = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const styles = {
    SUCCESS: { icon: CheckCircle, color: 'text-green-500', border: 'bg-green-500', bg: 'bg-green-50' },
    WARNING: { icon: AlertTriangle, color: 'text-orange-500', border: 'bg-orange-500', bg: 'bg-orange-50' },
    ERROR: { icon: AlertCircle, color: 'text-red-500', border: 'bg-red-500', bg: 'bg-red-50' },
    INFO: { icon: Info, color: 'text-blue-500', border: 'bg-blue-500', bg: 'bg-blue-50' },
  };

  const style = styles[toast.type];
  const Icon = style.icon;

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm w-full px-4 md:px-0 animate-bounce-in">
      <div className={`bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100 flex items-stretch transform transition-all duration-300 ease-in-out`}>
        <div className={`w-2 ${style.border}`}></div>
        <div className="flex-1 p-4 flex items-start">
          <div className={`mr-3 mt-0.5 ${style.color}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{toast.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={hideToast} className="text-gray-400 hover:text-gray-600 ml-3 self-start">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginView = React.lazy(() => import('./views/LoginView'));

const App: React.FC = () => {
  const { user, loading } = useApp();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleViewChange = React.useCallback((view: ViewState) => {
    setCurrentView(view);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 animate-pulse">Menyiapkan sistem...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#0f172a]" />}>
        <LoginView />
      </React.Suspense>
    );
  }

  const renderView = () => {
    return (
      <React.Suspense fallback={<LoadingView />}>
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'pos' && <POSView />}
        {currentView === 'inventory' && <InventoryView />}
        {currentView === 'reports' && <ReportsView />}
        {currentView === 'settings' && <SettingsView />}
      </React.Suspense>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 w-full relative overflow-hidden">
      {/* Global Toast Notification */}
      <ToastNotification />

      {/* Sidebar - Hidden on mobile, sticky on desktop */}
      <Sidebar currentView={currentView} onChangeView={handleViewChange} isOpen={isSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300">
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Main View Container */}
        <main className="flex-1 overflow-hidden relative pb-20 md:pb-0">
          {renderView()}
        </main>

        {/* Mobile Bottom Navigation Bar - Fixed at bottom */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-40 pb-safe print:hidden">
          <div className="flex justify-around items-center">
            {NAV_ITEMS.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id as ViewState)}
                  className={`flex-1 py-3 flex flex-col items-center justify-center transition-colors ${isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <Icon size={20} className={`mb-1 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
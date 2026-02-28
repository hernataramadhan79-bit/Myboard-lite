import React from 'react';
import { LayoutDashboard, Calculator, Package, FileText, Settings, LogOut } from 'lucide-react';
import { ViewState } from '../types';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen?: boolean;
}

export const Sidebar = React.memo(({ currentView, onChangeView, isOpen = true }: SidebarProps) => {
  const { logout } = useApp();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Transaksi', icon: Calculator },
    { id: 'inventory', label: 'Stok', icon: Package },
    { id: 'reports', label: 'Laporan', icon: FileText },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div
      className={`
        hidden md:flex flex-col bg-slate-900 text-white h-full shadow-xl print:hidden 
        transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? 'w-64' : 'w-0'}
      `}
    >
      <div className="p-6 border-b border-slate-800 whitespace-nowrap">
        <h1 className="text-xl font-bold tracking-tight text-teal-400">MyBoard Lite</h1>
        <span className="text-xs text-slate-400 uppercase tracking-widest">Premium Package</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 w-64">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`flex items-center w-full px-4 py-3.5 rounded-xl transition-all duration-200 group whitespace-nowrap ${isActive
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon size={22} className={`mr-3 min-w-[22px] ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 whitespace-nowrap w-64">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} className="mr-3 min-w-[20px]" />
          <span className="font-medium">Keluar</span>
        </button>
      </div>
    </div>
  );
});
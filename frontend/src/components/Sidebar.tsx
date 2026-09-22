import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  Database,
  Box
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'dbms', label: 'DBMS Inspector', icon: Database, badge: 'ACID' },
  ];

  return (
    <aside className="w-64 bg-[#0B132B] border-r border-slate-800/70 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-20">
      <div>
        {/* Brand Header */}
        <div className="px-6 py-6 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-500 flex items-center justify-center shadow-md shadow-sky-950 text-white shrink-0">
            <Box className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">StockFlow</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-400/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Real-Time Inventory DBMS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2">
            System Modules
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600/35 via-sky-500/20 to-blue-600/10 border border-sky-400/50 text-white shadow-lg shadow-sky-950/60 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-300' : 'text-slate-400'}`} />
                  <span className="tracking-wide">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isActive ? 'bg-sky-900/60 text-sky-200 border border-sky-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* College DBMS Project Footer Card */}
      <div className="p-4 m-3 rounded-2xl bg-[#0e162b]/90 border border-slate-800/90 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
            College DBMS Project
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Demonstrating 3NF schema, ACID transactions, B-Tree indexes, & WebSocket broadcasting.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {['PostgreSQL', 'FastAPI', 'WebSockets', 'React'].map((tag) => (
            <span 
              key={tag} 
              className="text-[10px] py-1 px-1.5 rounded-md bg-[#16203d] text-slate-300 border border-slate-700/60 font-mono text-center font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};

import React from 'react';
import { LiveBadge } from './LiveBadge';
import { Plus, ArrowLeftRight, Search, Bell, ChevronDown } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onOpenCreateOrder: () => void;
  onOpenAddStock: () => void;
  onOpenTransfer: () => void;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenCreateOrder,
  onOpenAddStock,
  onOpenTransfer,
  globalSearch,
  setGlobalSearch,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Overview', subtitle: 'Live inventory metrics & warehouse activities' },
    inventory: { title: 'Inventory Directory', subtitle: 'Multi-warehouse stock control with real-time sync' },
    orders: { title: 'Orders & Fulfillment', subtitle: 'Atomic transactional order creation & history' },
    products: { title: 'Product Catalog', subtitle: 'Manage SKUs, categories, and pricing' },
    warehouses: { title: 'Warehouses', subtitle: 'Storage hubs, locations, and capacity utilization' },
    dbms: { title: 'DBMS Architecture Inspector', subtitle: 'Live demonstration of normalization, transactions & indexes' },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 bg-transparent">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{current.title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{current.subtitle}</p>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Search Pill */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search SKU or item..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="bg-white border border-slate-200/90 text-slate-700 placeholder-slate-400 text-xs rounded-full pl-9 pr-4 py-2 w-52 shadow-2xs focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
          />
        </div>

        {/* Live WebSocket Status Pill */}
        <LiveBadge />

        {/* Transfer Button */}
        <button
          onClick={onOpenTransfer}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
          <span>Transfer</span>
        </button>

        {/* Add Stock Button */}
        <button
          onClick={onOpenAddStock}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>Add Stock</span>
        </button>

        {/* New Order Button */}
        <button
          onClick={onOpenCreateOrder}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-medium shadow-sm transition-all active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Order</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          title="Notifications"
          className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white/80 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 absolute top-1.5 right-1.5" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs cursor-pointer select-none hover:bg-slate-50 transition-colors">
          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-semibold text-xs flex items-center justify-center">
            P
          </div>
          <span className="text-xs font-medium text-slate-700">Parshwa</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </div>
    </header>
  );
};

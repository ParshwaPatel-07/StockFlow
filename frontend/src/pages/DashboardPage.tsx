import React, { useState, useEffect } from 'react';
import { 
  DashboardStats, WarehouseBreakdown, InventoryItem, Order 
} from '../types';
import { analyticsApi, inventoryApi, ordersApi } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Package, 
  BarChart2, 
  AlertTriangle, 
  ShoppingCart, 
  Warehouse as WarehouseIcon, 
  ArrowUpRight,
  ArrowRight,
  Plus, 
  Minus,
  MoreVertical,
  Network
} from 'lucide-react';
import { 
  KpiHeadphonesAsset, 
  KpiGlowingCubeAsset, 
  KpiStorageCrateAsset, 
  KpiParcelAsset 
} from '../components/KpiVisuals';
import { getProductImageUrl, getWarehouseMeta, handleImageError, handleWarehouseImageError } from '../utils/productImages';

interface DashboardPageProps {
  onOpenCreateOrder: () => void;
  onOpenAddStock: (productId?: number, warehouseId?: number, item?: InventoryItem) => void;
  onOpenTransfer: (productId?: number, warehouseId?: number) => void;
  onOpenRemoveStock: (item: InventoryItem) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenCreateOrder,
  onOpenAddStock,
  onOpenTransfer,
  onOpenRemoveStock,
  setActiveTab,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseBreakdown[]>([]);
  const [recentInventory, setRecentInventory] = useState<InventoryItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const { subscribe, isItemHighlighted } = useWebSocket();

  const loadData = async () => {
    try {
      const [statsData, whData, invData, ordersData] = await Promise.all([
        analyticsApi.getDashboardStats(),
        analyticsApi.getWarehouseBreakdown(),
        inventoryApi.getInventory(),
        ordersApi.getOrders({ limit: 6 }),
      ]);
      if (statsData) setStats(statsData);
      if (Array.isArray(whData)) setWarehouses(whData);
      if (Array.isArray(invData)) setRecentInventory(invData.slice(0, 5));
      if (Array.isArray(ordersData)) setRecentOrders(ordersData.slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time events to auto-refresh data smoothly
    const unsubInv = subscribe('INVENTORY_UPDATED', () => loadData());
    const unsubTransfer = subscribe('STOCK_TRANSFERRED', () => loadData());
    const unsubOrder = subscribe('ORDER_CREATED', () => loadData());
    const unsubOrderStatus = subscribe('ORDER_STATUS_CHANGED', () => loadData());
    const unsubProd = subscribe('PRODUCT_CREATED', () => loadData());
    const unsubWh = subscribe('WAREHOUSE_CREATED', () => loadData());

    return () => {
      unsubInv();
      unsubTransfer();
      unsubOrder();
      unsubOrderStatus();
      unsubProd();
      unsubWh();
    };
  }, [subscribe]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-slate-500">Loading live inventory metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL PRODUCTS */}
        <div className="bg-white rounded-[22px] p-5 border border-slate-100/90 shadow-card relative overflow-hidden flex flex-col justify-between h-36 select-none">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg text-sky-500">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Products
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="z-10 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats?.total_products || 20}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
              <span>↑</span>
              <span>+{stats?.active_warehouses_count || 4} Warehouses in network</span>
            </div>
          </div>

          {/* Floating Decorative 3D Over-ear Headphones Asset */}
          <KpiHeadphonesAsset className="absolute -right-1 bottom-1" />
        </div>

        {/* Card 2: TOTAL IN STOCK UNITS */}
        <div className="bg-white rounded-[22px] p-5 border border-slate-100/90 shadow-card relative overflow-hidden flex flex-col justify-between h-36 select-none">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg text-sky-500">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total In Stock Units
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="z-10 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {(stats?.total_inventory_units ?? 2840).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span>Real-time cross-facility aggregate</span>
            </div>
          </div>

          {/* Floating Glowing 3D Isometric Blue Cube Asset */}
          <KpiGlowingCubeAsset className="absolute -right-1 bottom-1" />
        </div>

        {/* Card 3: STOCK ATTENTION */}
        <div className="bg-white rounded-[22px] p-5 border border-slate-100/90 shadow-card relative overflow-hidden flex flex-col justify-between h-36 select-none">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg text-amber-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Stock Attention
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="z-10 mt-1">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-3xl font-extrabold text-slate-900">
                {stats?.low_stock_count ?? 5}
              </span>
              <span className="text-xs font-medium text-slate-500 font-sans">low</span>
              <span className="text-slate-400 text-sm font-light">/</span>
              <span className="text-3xl font-extrabold text-slate-900 ml-1">
                {stats?.out_of_stock_count ?? 2}
              </span>
              <span className="text-xs font-medium text-slate-500 font-sans">out</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span>Requires replenishment</span>
            </div>
          </div>

          {/* Floating Translucent 3D Storage Crate Asset */}
          <KpiStorageCrateAsset className="absolute -right-1 bottom-1" />
        </div>

        {/* Card 4: TODAY'S ORDERS */}
        <div className="bg-white rounded-[22px] p-5 border border-slate-100/90 shadow-card relative overflow-hidden flex flex-col justify-between h-36 select-none">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg text-sky-500">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Today's Orders
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="z-10 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats?.todays_orders_count || 2}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span>Atomic checkout fulfillment</span>
            </div>
          </div>

          {/* Floating 3D Delivery Parcel Asset */}
          <KpiParcelAsset className="absolute -right-1 bottom-1" />
        </div>
      </div>

      {/* Middle Section: WAREHOUSE STORAGE & CAPACITY UTILIZATION */}
      <div className="bg-white rounded-[22px] p-6 border border-slate-100/90 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <WarehouseIcon className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Warehouse Storage & Capacity Utilization
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('warehouses')}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 transition-colors group"
          >
            <span>View All Warehouses</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {warehouses.map((wh) => {
            const meta = getWarehouseMeta(wh.code, wh.name);
            const clampedPct = Math.min(wh.utilization_percentage, 100);

            return (
              <div 
                key={wh.warehouse_id} 
                className="bg-[#F8FAFC] hover:bg-slate-100/70 transition-all rounded-2xl p-3.5 border border-slate-200/50 flex flex-col group"
              >
                {/* Photo container */}
                <div className="relative w-full h-28 rounded-xl overflow-hidden mb-3 shadow-2xs bg-slate-200">
                  <img
                    src={meta.imageUrl}
                    alt={wh.name}
                    onError={handleWarehouseImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Circular Arrow Button */}
                  <button
                    onClick={() => setActiveTab('warehouses')}
                    title={`View ${wh.name}`}
                    className="w-7 h-7 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all absolute top-2 right-2 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </button>
                </div>

                {/* Warehouse Name & Code */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-bold text-slate-900 truncate" title={wh.name}>
                    {wh.name}
                  </span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 shrink-0">
                    {wh.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mb-3">
                  {meta.locationDetail}
                </p>

                {/* Progress Bar with Glowing Dot */}
                <div className="w-full h-1.5 rounded-full bg-slate-200/80 mb-2 relative overflow-visible">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-700 relative"
                    style={{ width: `${clampedPct}%` }}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500 ring-4 ring-sky-300/40 absolute -right-1 -top-[1px] shadow-sm" />
                  </div>
                </div>

                {/* Capacity Stats Footer */}
                <div className="flex items-center justify-between text-xs font-mono mt-1">
                  <span className="text-slate-500">
                    {(wh.current_stock ?? 0).toLocaleString()} / {(wh.capacity ?? 0).toLocaleString()}
                  </span>
                  <span className="font-bold text-sky-600">
                    {(wh.utilization_percentage ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lower Dashboard: Asymmetric 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: LIVE INVENTORY TABLE (65% width / col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-[22px] p-6 border border-slate-100/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Network className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Live Inventory Table
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 transition-colors group"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-2 w-8">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500/20" 
                        readOnly 
                      />
                    </th>
                    <th className="pb-3 pl-2">Product & SKU</th>
                    <th className="pb-3">Warehouse</th>
                    <th className="pb-3 text-center">Quantity</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {recentInventory.map((item) => {
                    const isHighlighted = isItemHighlighted(`inv-${item.product_id}-${item.warehouse_id}`);
                    const prodImg = getProductImageUrl(item.sku, item.product_name);

                    return (
                      <tr
                        key={`inv-row-${item.id || item.product_id}-${item.warehouse_id}`}
                        className={`transition-colors duration-500 ${
                          isHighlighted ? 'bg-sky-50/80' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 pl-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500/20" 
                          />
                        </td>
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={prodImg}
                              alt={item.product_name}
                              onError={handleImageError}
                              className="w-9 h-9 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100 shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 leading-tight">
                                {item.product_name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                {item.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">
                          {item.warehouse_name}
                        </td>
                        <td className="py-3 text-center font-mono font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium inline-block ${
                              item.status === 'In Stock'
                                ? 'bg-sky-50 text-sky-600 border border-sky-100'
                                : item.status === 'Low Stock'
                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenAddStock(item.product_id, item.warehouse_id, item)}
                              title={`Add stock to ${item.product_name} at ${item.warehouse_name}`}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-600 flex items-center justify-center font-bold text-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenRemoveStock(item)}
                              title={`Deduct stock from ${item.product_name} at ${item.warehouse_name}`}
                              disabled={item.quantity === 0}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 disabled:opacity-30 flex items-center justify-center font-bold text-xs transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: RECENT ORDERS (35% width / col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-[22px] p-6 border border-slate-100/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Recent Orders
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 transition-colors group"
              >
                <span>All Orders</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="space-y-3">
              {recentOrders.map((ord) => {
                const isHighlighted = isItemHighlighted(`order-${ord.id}`);
                // Select an illustrative hardware image based on first order item, or order number fallback
                const firstItem = ord.items && ord.items.length > 0 ? ord.items[0] : null;
                const orderImg = firstItem
                  ? getProductImageUrl(firstItem.sku, firstItem.product_name)
                  : getProductImageUrl(undefined, ord.order_number);

                return (
                  <div
                    key={ord.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-500 ${
                      isHighlighted 
                        ? 'bg-sky-50/80 border-sky-200' 
                        : 'bg-[#F8FAFC] border-slate-100 hover:border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={orderImg}
                        alt={ord.order_number}
                        onError={handleImageError}
                        className="w-12 h-12 rounded-xl object-contain bg-white p-1.5 border border-slate-100 shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-xs text-slate-900 truncate">
                          {ord.order_number}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {ord.customer_name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {ord.warehouse_name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          ${(ord.total_amount ?? 0).toFixed(2)}
                        </span>
                        <MoreVertical className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

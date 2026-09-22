import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, Product, Warehouse } from '../types';
import { inventoryApi } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Search, Plus, Minus, ArrowLeftRight, 
  AlertTriangle, CheckCircle2, XCircle, RefreshCw 
} from 'lucide-react';
import { getProductImageUrl, handleImageError } from '../utils/productImages';

interface InventoryPageProps {
  products: Product[];
  warehouses: Warehouse[];
  onOpenAddStock: (productId?: number, warehouseId?: number, item?: InventoryItem) => void;
  onOpenRemoveStock: (item: InventoryItem) => void;
  onOpenTransfer: (productId?: number, warehouseId?: number) => void;
  globalSearch: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  products,
  warehouses,
  onOpenAddStock,
  onOpenRemoveStock,
  onOpenTransfer,
  globalSearch,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState('');

  const { subscribe, isItemHighlighted } = useWebSocket();

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getInventory();
      setItems(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();

    const unsubInv = subscribe('INVENTORY_UPDATED', (payload) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.product_id === payload.product_id && it.warehouse_id === payload.warehouse_id) {
            return {
              ...it,
              quantity: payload.new_quantity,
              status: payload.status,
              last_updated: new Date().toISOString(),
            };
          }
          return it;
        })
      );
    });

    const unsubTransfer = subscribe('STOCK_TRANSFERRED', () => {
      loadInventory();
    });

    const unsubOrder = subscribe('ORDER_CREATED', () => {
      loadInventory();
    });

    return () => {
      unsubInv();
      unsubTransfer();
      unsubOrder();
    };
  }, [subscribe]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return Array.from(set);
  }, [items]);

  // Filtering
  const filteredItems = useMemo(() => {
    const searchTerm = (globalSearch || localSearch).toLowerCase().trim();

    return items.filter((item) => {
      const matchWh = selectedWarehouse === 'all' || item.warehouse_id.toString() === selectedWarehouse;
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || item.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.product_name.toLowerCase().includes(searchTerm) ||
        item.sku.toLowerCase().includes(searchTerm) ||
        item.warehouse_name.toLowerCase().includes(searchTerm);

      return matchWh && matchCat && matchStatus && matchSearch;
    });
  }, [items, selectedWarehouse, selectedCategory, selectedStatus, localSearch, globalSearch]);

  const inStockCount = items.filter((i) => i.status === 'In Stock').length;
  const lowStockCount = items.filter((i) => i.status === 'Low Stock').length;
  const outOfStockCount = items.filter((i) => i.status === 'Out of Stock').length;

  return (
    <div className="space-y-6">
      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-card flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Total Stock Rows</span>
          <span className="text-base font-bold font-mono text-slate-900">{items.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-sky-600 font-medium">
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
            <span>In Stock</span>
          </div>
          <span className="text-base font-bold font-mono text-sky-600">{inStockCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Low Stock</span>
          </div>
          <span className="text-base font-bold font-mono text-amber-600">{lowStockCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-rose-600 font-medium">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Out of Stock</span>
          </div>
          <span className="text-base font-bold font-mono text-rose-600">{outOfStockCount}</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter product or SKU..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
          />
        </div>

        {/* Right: Dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Warehouse Dropdown */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
          >
            <option value="all">All Statuses</option>
            <option value="in stock">In Stock</option>
            <option value="low stock">Low Stock</option>
            <option value="out of stock">Out of Stock</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={loadInventory}
            title="Refresh from database"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3.5 pl-3">Product Name</th>
                <th className="pb-3.5">SKU</th>
                <th className="pb-3.5">Category</th>
                <th className="pb-3.5">Warehouse Location</th>
                <th className="pb-3.5 text-right">Price</th>
                <th className="pb-3.5 text-right">In Stock</th>
                <th className="pb-3.5 text-center">Status</th>
                <th className="pb-3.5 text-right pr-3">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isHighlighted = isItemHighlighted(`inv-${item.product_id}-${item.warehouse_id}`);
                const prodImg = getProductImageUrl(item.sku, item.product_name);

                return (
                  <tr
                    key={`inv-table-${item.id || item.product_id}-${item.warehouse_id}`}
                    className={`transition-colors duration-500 ${
                      isHighlighted ? 'bg-sky-50/80' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prodImg}
                          alt={item.product_name}
                          onError={handleImageError}
                          className="w-9 h-9 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100 shrink-0"
                        />
                        <span className="font-semibold text-slate-900 text-sm">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-sky-700 font-medium">{item.sku}</td>
                    <td className="py-3.5 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600">
                      <div className="font-medium text-slate-900">{item.warehouse_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.warehouse_code}</div>
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-800">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-sm text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide ${
                          item.status === 'In Stock'
                            ? 'bg-sky-50 text-sky-600 border border-sky-100'
                            : item.status === 'Low Stock'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'In Stock'
                              ? 'bg-sky-500'
                              : item.status === 'Low Stock'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenAddStock(item.product_id, item.warehouse_id, item)}
                          title={`Add stock to ${item.product_name} at ${item.warehouse_name}`}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-semibold transition-colors flex items-center gap-1 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                        <button
                          onClick={() => onOpenRemoveStock(item)}
                          title={`Deduct stock from ${item.product_name} at ${item.warehouse_name}`}
                          disabled={item.quantity === 0}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold disabled:opacity-30 transition-colors flex items-center gap-1 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                          <span>Deduct</span>
                        </button>
                        <button
                          onClick={() => onOpenTransfer(item.product_id, item.warehouse_id)}
                          title={`Transfer ${item.product_name} from ${item.warehouse_name}`}
                          disabled={item.quantity === 0}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 font-semibold disabled:opacity-30 transition-colors flex items-center gap-1 text-xs"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No matching inventory items found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

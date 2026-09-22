import React, { useState, useEffect } from 'react';
import { Product, Warehouse, InventoryItem } from '../../types';
import { inventoryApi } from '../../services/api';
import { X, ArrowLeftRight, AlertTriangle } from 'lucide-react';

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  onSuccess: () => void;
  initialProductId?: number;
  initialWarehouseId?: number;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({
  isOpen,
  onClose,
  products,
  warehouses,
  inventory,
  onSuccess,
  initialProductId,
  initialWarehouseId,
}) => {
  const [productId, setProductId] = useState<number>(initialProductId || products[0]?.id || 1);
  const [sourceWarehouseId, setSourceWarehouseId] = useState<number>(initialWarehouseId || warehouses[0]?.id || 1);
  const [destWarehouseId, setDestWarehouseId] = useState<number>(warehouses[1]?.id || 2);
  const [quantity, setQuantity] = useState<number>(5);
  const [notes, setNotes] = useState<string>('Inter-warehouse balance transfer');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const prodId = initialProductId || products[0]?.id || 1;
      const srcWhId = initialWarehouseId || warehouses[0]?.id || 1;
      setProductId(prodId);
      setSourceWarehouseId(srcWhId);
      
      const altWh = warehouses.find((w) => w.id !== srcWhId);
      setDestWarehouseId(altWh ? altWh.id : (srcWhId === 1 ? 2 : 1));
      setQuantity(5);
      setError(null);
    }
  }, [isOpen, initialProductId, initialWarehouseId, products, warehouses]);

  if (!isOpen) return null;

  // Find source warehouse available stock for selected product
  const sourceStockItem = inventory.find(
    (inv) => inv.product_id === productId && inv.warehouse_id === sourceWarehouseId
  );
  const availableStock = sourceStockItem?.quantity ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceWarehouseId === destWarehouseId) {
      setError('Source and destination warehouses must be different');
      return;
    }
    if (quantity <= 0) {
      setError('Transfer quantity must be greater than 0');
      return;
    }
    if (quantity > availableStock) {
      setError(`Transfer quantity (${quantity}) exceeds source stock (${availableStock})`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryApi.transferStock({
        product_id: productId,
        source_warehouse_id: sourceWarehouseId,
        destination_warehouse_id: destWarehouseId,
        quantity,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Stock transfer transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Atomic Stock Transfer</h3>
              <p className="text-xs text-slate-500">Atomic relocation between fulfillment centers</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product to Transfer</label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-400"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Source Warehouse</label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-400"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination Warehouse</label>
              <select
                value={destWarehouseId}
                onChange={(e) => setDestWarehouseId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-400"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === sourceWarehouseId}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Available at Source:</span>
            <span className="font-mono font-bold text-sky-600">
              {availableStock} units
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity to Transfer
            </label>
            <input
              type="number"
              min="1"
              max={availableStock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transfer Reason / Audit Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regional rebalancing, West Coast stock fulfillment"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableStock === 0}
              className="px-5 py-2 rounded-full bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Transferring...' : 'Execute Atomic Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

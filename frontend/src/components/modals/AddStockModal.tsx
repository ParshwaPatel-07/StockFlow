import React, { useState, useEffect } from 'react';
import { Product, Warehouse, InventoryItem } from '../../types';
import { inventoryApi } from '../../services/api';
import { X, Plus, Minus, AlertTriangle } from 'lucide-react';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  warehouses: Warehouse[];
  onSuccess: () => void;
  initialProductId?: number;
  initialWarehouseId?: number;
  initialAction?: 'add' | 'remove';
  selectedItem?: InventoryItem | null;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  products,
  warehouses,
  onSuccess,
  initialProductId,
  initialWarehouseId,
  initialAction = 'add',
  selectedItem,
}) => {
  const [actionType, setActionType] = useState<'add' | 'remove'>(initialAction);
  const [productId, setProductId] = useState<number>(initialProductId || products[0]?.id || 1);
  const [warehouseId, setWarehouseId] = useState<number>(initialWarehouseId || warehouses[0]?.id || 1);
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Supplier Delivery');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state every time modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const targetProdId = selectedItem?.product_id ?? initialProductId ?? products[0]?.id ?? 1;
      const targetWhId = selectedItem?.warehouse_id ?? initialWarehouseId ?? warehouses[0]?.id ?? 1;
      const mode = initialAction || 'add';

      setProductId(targetProdId);
      setWarehouseId(targetWhId);
      setActionType(mode);
      setQuantity(mode === 'remove' ? 1 : 10);
      setReason(mode === 'remove' ? 'Stock Reduction / Audit Discrepancy' : 'Supplier Delivery');
      setError(null);
    }
  }, [isOpen, initialProductId, initialWarehouseId, selectedItem, initialAction, products, warehouses]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === productId);
  const currentWarehouse = warehouses.find((w) => w.id === warehouseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const adjustment = actionType === 'add' ? quantity : -quantity;
      await inventoryApi.adjustStock({
        product_id: productId,
        warehouse_id: warehouseId,
        adjustment,
        reason,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${actionType === 'add' ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600'}`}>
              {actionType === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {actionType === 'add' ? 'Add Inventory Stock' : 'Deduct Inventory Stock'}
              </h3>
              <p className="text-xs text-slate-500">
                {actionType === 'add' ? 'Increment stock quantity in a designated warehouse' : 'Deduct units from current warehouse stock'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Type Segmented Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 mt-4 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActionType('add');
              setReason('Supplier Delivery');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              actionType === 'add'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>Add Stock (+)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActionType('remove');
              setReason('Stock Reduction / Audit Discrepancy');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              actionType === 'remove'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Minus className="w-3.5 h-3.5 text-rose-600" />
            <span>Deduct Stock (-)</span>
          </button>
        </div>

        {selectedItem && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex justify-between text-slate-500 mb-1">
              <span>Selected Item:</span>
              <span className="font-semibold text-slate-900">{selectedItem.product_name}</span>
            </div>
            <div className="flex justify-between text-slate-500 mb-1">
              <span>Warehouse:</span>
              <span className="font-semibold text-slate-900">{selectedItem.warehouse_name}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Current Stock:</span>
              <span className="font-bold text-sky-600 font-mono">{selectedItem.quantity} units</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {actionType === 'add' ? 'Quantity to Add' : 'Quantity to Deduct'}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Audit Reason / Notes</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Supplier Shipment, Physical inventory audit"
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
              disabled={loading}
              className="px-5 py-2 rounded-full bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : actionType === 'add' ? 'Confirm Addition' : 'Confirm Deduction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

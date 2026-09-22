import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';
import { inventoryApi } from '../../services/api';
import { X, Minus, AlertTriangle } from 'lucide-react';

interface RemoveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

export const RemoveStockModal: React.FC<RemoveStockModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('Damaged / Written-off');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setError(null);
      setReason('Damaged / Written-off');
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (quantity > item.quantity) {
      setError(`Cannot remove more than available stock (${item.quantity})`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryApi.adjustStock({
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        adjustment: -quantity,
        reason,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Minus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Deduct Stock</h3>
              <p className="text-xs text-slate-500">Deduct units from current warehouse stock</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Product:</span>
            <span className="font-semibold text-slate-900">{item.product_name}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>SKU:</span>
            <span className="font-mono text-sky-700 font-semibold">{item.sku}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Warehouse:</span>
            <span className="font-semibold text-slate-900">{item.warehouse_name}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Available Stock:</span>
            <span className="font-bold text-sky-600 font-mono">{item.quantity} units</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity to Deduct (Max: {item.quantity})
            </label>
            <input
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Audit Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged during handling, Physical audit discrepancy"
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
              disabled={loading || item.quantity === 0}
              className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Deducting...' : 'Confirm Deduction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

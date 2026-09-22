import React, { useState } from 'react';
import { Product, Warehouse, InventoryItem } from '../../types';
import { ordersApi } from '../../services/api';
import { X, ShoppingCart, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  onSuccess: () => void;
}

interface OrderItemRow {
  productId: number;
  quantity: number;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  warehouses,
  inventory,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [warehouseId, setWarehouseId] = useState<number>(warehouses[0]?.id ?? 1);
  const [items, setItems] = useState<OrderItemRow[]>([
    { productId: products[0]?.id ?? 1, quantity: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getProductStock = (prodId: number, whId: number): number => {
    const found = inventory.find((inv) => inv.product_id === prodId && inv.warehouse_id === whId);
    return found?.quantity ?? 0;
  };

  const addItemRow = () => {
    const usedIds = new Set(items.map((i) => i.productId));
    const nextProd = products.find((p) => !usedIds.has(p.id)) || products[0];
    if (nextProd) {
      setItems([...items, { productId: nextProd.id, quantity: 1 }]);
    }
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const updateItemRow = (index: number, field: keyof OrderItemRow, value: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calculate Order Total
  const totalAmount = items.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.productId);
    return sum + (prod ? prod.price * item.quantity : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (items.length === 0) {
      setError('At least one item is required');
      return;
    }

    // Check stock for every item
    for (const item of items) {
      const stock = getProductStock(item.productId, warehouseId);
      const prod = products.find((p) => p.id === item.productId);
      if (item.quantity > stock) {
        setError(`Insufficient stock for '${prod?.name}'. Available: ${stock}, Requested: ${item.quantity}`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await ordersApi.createOrder({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || undefined,
        warehouse_id: warehouseId,
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Atomic order placement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-xl shadow-2xl p-6 text-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Place New Order</h3>
              <p className="text-xs text-slate-500">Atomic transactional order creation & stock fulfillment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ACID Callout */}
        <div className="mt-3 p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-800 flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong>ACID Guaranteed:</strong> Stock deductions and order records commit atomically. If any item is out of stock, the entire transaction rolls back.
          </span>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Acme Logistics, John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="purchasing@acme.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fulfillment Warehouse *</label>
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

          {/* Line items section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Order Line Items
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((row, index) => {
                const selectedProd = products.find((p) => p.id === row.productId);
                const availableStock = getProductStock(row.productId, warehouseId);
                const subtotal = (selectedProd?.price ?? 0) * row.quantity;
                const isOutOfStock = availableStock < row.quantity;

                return (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-xs"
                  >
                    {/* Product Select */}
                    <div className="flex-1">
                      <select
                        value={row.productId}
                        onChange={(e) => updateItemRow(index, 'productId', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-400"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${p.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          updateItemRow(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center font-mono focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    {/* Stock indicator */}
                    <div className="w-24 text-right">
                      <span className={`font-mono ${isOutOfStock ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                        {availableStock} avail
                      </span>
                    </div>

                    {/* Subtotal */}
                    <div className="w-20 text-right font-mono font-bold text-slate-900">
                      ${subtotal.toFixed(2)}
                    </div>

                    {/* Delete item */}
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => removeItemRow(index)}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Breakdown */}
          <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Order Grand Total:</span>
            <span className="text-base font-extrabold font-mono text-slate-900">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
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
              {loading ? 'Executing Transaction...' : 'Confirm & Fulfill Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

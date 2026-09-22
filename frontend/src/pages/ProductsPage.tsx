import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { productsApi } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { Search, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { getProductImageUrl, handleImageError } from '../utils/productImages';

interface ProductsPageProps {
  onOpenAddProduct: () => void;
  onOpenEditProduct: (p: Product) => void;
  globalSearch: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onOpenAddProduct,
  onOpenEditProduct,
  globalSearch,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');

  const { subscribe } = useWebSocket();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getProducts({
        search: globalSearch || localSearch || undefined,
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    const unsubCreate = subscribe('PRODUCT_CREATED', () => loadProducts());
    const unsubUpdate = subscribe('PRODUCT_UPDATED', () => loadProducts());
    const unsubDelete = subscribe('PRODUCT_DELETED', () => loadProducts());
    const unsubInv = subscribe('INVENTORY_UPDATED', () => loadProducts());

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
      unsubInv();
    };
  }, [subscribe, globalSearch, localSearch]);

  const handleDelete = async (prod: Product) => {
    if (confirm(`Are you sure you want to delete '${prod.name}' (${prod.sku})? Associated inventory records will be removed.`)) {
      try {
        await productsApi.deleteProduct(prod.id);
        loadProducts();
      } catch (err) {
        alert('Failed to delete product. Ensure it is not linked to active orders.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by name or SKU..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={loadProducts}
            title="Refresh Products"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3.5 pl-3">Product Name</th>
                <th className="pb-3.5">SKU</th>
                <th className="pb-3.5">Category</th>
                <th className="pb-3.5 text-right">Price</th>
                <th className="pb-3.5 text-right">Total Network Stock</th>
                <th className="pb-3.5 text-right">Min Threshold</th>
                <th className="pb-3.5 text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const prodImg = getProductImageUrl(p.sku, p.name);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prodImg}
                          alt={p.name}
                          onError={handleImageError}
                          className="w-9 h-9 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                          {p.description && (
                            <div className="text-[11px] text-slate-400 truncate max-w-sm">{p.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-sky-700 font-medium">{p.sku}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-slate-900">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right font-mono font-extrabold text-sm text-slate-900">
                      {p.total_stock ?? 0}
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-400">
                      {p.reorder_threshold}
                    </td>
                    <td className="py-3.5 text-right pr-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenEditProduct(p)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          title="Delete Product"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No products found in catalog.
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

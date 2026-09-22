import React, { useState, useEffect } from 'react';
import { Warehouse } from '../types';
import { warehousesApi } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { Plus, MapPin, Edit2, RefreshCw } from 'lucide-react';
import { getWarehouseMeta, handleWarehouseImageError } from '../utils/productImages';

interface WarehousesPageProps {
  onOpenAddWarehouse: () => void;
  onOpenEditWarehouse: (w: Warehouse) => void;
}

export const WarehousesPage: React.FC<WarehousesPageProps> = ({
  onOpenAddWarehouse,
  onOpenEditWarehouse,
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const { subscribe } = useWebSocket();

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehousesApi.getWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();

    const unsubCreate = subscribe('WAREHOUSE_CREATED', () => loadWarehouses());
    const unsubUpdate = subscribe('WAREHOUSE_UPDATED', () => loadWarehouses());
    const unsubInv = subscribe('INVENTORY_UPDATED', () => loadWarehouses());
    const unsubTransfer = subscribe('STOCK_TRANSFERRED', () => loadWarehouses());

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubInv();
      unsubTransfer();
    };
  }, [subscribe]);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Fulfillment Center Network</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage distribution hubs and monitor regional capacity</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadWarehouses}
            title="Refresh Warehouses"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
          <button
            onClick={onOpenAddWarehouse}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map((wh) => {
          const meta = getWarehouseMeta(wh.code, wh.name);
          const clampedPct = Math.min(wh.utilization_rate, 100);

          return (
            <div
              key={wh.id}
              className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card relative overflow-hidden group hover:border-slate-200 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo banner */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden mb-4 shadow-2xs bg-slate-100">
                  <img
                    src={meta.imageUrl}
                    alt={wh.name}
                    onError={handleWarehouseImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => onOpenEditWarehouse(wh)}
                    title="Edit Facility"
                    className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 shadow-sm hover:scale-105 active:scale-95 transition-all absolute top-2.5 right-2.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{wh.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-sky-700 font-bold px-1.5 py-0.5 rounded bg-sky-50 border border-sky-100">
                        {wh.code}
                      </span>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{meta.locationDetail || wh.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Stats */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Storage Utilization</span>
                  <span className="font-mono font-bold text-sky-600">
                    {wh.utilization_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-visible relative">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-700 relative"
                    style={{ width: `${clampedPct}%` }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-sky-200 absolute -right-1 -top-[1px] shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    Stored: <strong className="text-slate-900 font-mono">{wh.current_stock.toLocaleString()} units</strong>
                  </span>
                  <span className="text-slate-500">
                    Max Capacity: <strong className="text-slate-900 font-mono">{wh.capacity.toLocaleString()} units</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

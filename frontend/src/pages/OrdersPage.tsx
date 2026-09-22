import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { ordersApi } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Search, Plus, ChevronDown, ChevronUp, 
  CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw 
} from 'lucide-react';

interface OrdersPageProps {
  onOpenCreateOrder: () => void;
  globalSearch: string;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onOpenCreateOrder,
  globalSearch,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [localSearch, setLocalSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const { subscribe, isItemHighlighted } = useWebSocket();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getOrders({
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        search: globalSearch || localSearch || undefined,
      });
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const unsubOrder = subscribe('ORDER_CREATED', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
    });

    const unsubStatus = subscribe('ORDER_STATUS_CHANGED', (data) => {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === data.order_id ? { ...ord, status: data.new_status } : ord))
      );
    });

    return () => {
      unsubOrder();
      unsubStatus();
    };
  }, [subscribe, statusFilter, globalSearch, localSearch]);

  const toggleExpand = (id: number) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleCancelOrder = async (order: Order) => {
    if (confirm(`Are you sure you want to cancel order ${order.order_number}? Stock will be automatically restocked into ${order.warehouse_name}.`)) {
      try {
        await ordersApi.updateOrderStatus(order.id, 'CANCELLED');
        loadOrders();
      } catch (err) {
        alert('Failed to cancel order');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-200">
            <Clock className="w-3 h-3" />
            <span>Processing</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order number or customer..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={loadOrders}
            title="Refresh Orders"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateOrder}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3.5 pl-3">Order Number</th>
                <th className="pb-3.5">Customer</th>
                <th className="pb-3.5">Warehouse</th>
                <th className="pb-3.5">Date & Time</th>
                <th className="pb-3.5 text-center">Items</th>
                <th className="pb-3.5 text-right">Total Amount</th>
                <th className="pb-3.5 text-center">Status</th>
                <th className="pb-3.5 text-right pr-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const isHighlighted = isItemHighlighted(`order-${order.id}`);

                return (
                  <React.Fragment key={order.id}>
                    <tr
                      className={`transition-colors duration-500 cursor-pointer ${
                        isHighlighted
                          ? 'bg-sky-50/80'
                          : isExpanded
                          ? 'bg-slate-50/90'
                          : 'hover:bg-slate-50/70'
                      }`}
                      onClick={() => toggleExpand(order.id)}
                    >
                      <td className="py-3.5 pl-3 font-mono font-bold text-slate-900">
                        {order.order_number}
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-900">{order.customer_name}</div>
                        {order.customer_email && (
                          <div className="text-[10px] text-slate-400">{order.customer_email}</div>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">{order.warehouse_name}</td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(order.order_date).toLocaleString()}
                      </td>
                      <td className="py-3.5 text-center font-mono font-bold text-slate-900">
                        {order.items_count || order.items.length}
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-sm text-slate-900">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 text-center">{getStatusBadge(order.status)}</td>
                      <td className="py-3.5 text-right pr-3">
                        <button className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Line Items View */}
                    {isExpanded && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={8} className="p-4 pl-8 pr-6 border-b border-slate-100">
                          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 text-xs font-semibold text-slate-600">
                              <span>Order Line Items (Subtotal Breakdown)</span>
                              {order.status !== 'CANCELLED' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelOrder(order);
                                  }}
                                  className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] underline"
                                >
                                  Cancel Order & Restock Inventory
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-900">{item.product_name}</span>
                                    <span className="font-mono text-[10px] text-slate-400 ml-2">({item.sku})</span>
                                  </div>
                                  <div className="flex items-center gap-6 font-mono">
                                    <span className="text-slate-500">
                                      {item.quantity} × ${item.unit_price.toFixed(2)}
                                    </span>
                                    <span className="font-bold text-slate-900">${item.subtotal.toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No orders matching the specified criteria.
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

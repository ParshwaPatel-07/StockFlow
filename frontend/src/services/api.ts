import axios from 'axios';
import { 
  Product, Warehouse, InventoryItem, Order, 
  DashboardStats, WarehouseBreakdown 
} from '../types';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) {
      let trimmed = String(envUrl).trim().replace(/\/+$/, '');
      if (trimmed.endsWith('/api')) {
        trimmed = trimmed.slice(0, -4);
      }
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = `https://${trimmed}`;
      }
      return trimmed;
    }
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
  }
  return '';
};

export const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const inventoryApi = {
  getInventory: async (params?: { warehouse_id?: number; category?: string; status_filter?: string; search?: string }) => {
    const res = await api.get<InventoryItem[]>('/inventory', { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  adjustStock: async (data: { product_id: number; warehouse_id: number; adjustment: number; reason?: string }) => {
    const res = await api.post('/inventory/adjust', data);
    return res.data;
  },

  transferStock: async (data: { product_id: number; source_warehouse_id: number; destination_warehouse_id: number; quantity: number; notes?: string }) => {
    const res = await api.post('/inventory/transfer', data);
    return res.data;
  },
};

export const productsApi = {
  getProducts: async (params?: { category?: string; search?: string }) => {
    const res = await api.get<Product[]>('/products', { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  getProduct: async (id: number) => {
    const res = await api.get<Product>(`/products/${id}`);
    return res.data;
  },

  createProduct: async (data: Partial<Product>) => {
    const res = await api.post<Product>('/products', data);
    return res.data;
  },

  updateProduct: async (id: number, data: Partial<Product>) => {
    const res = await api.put<Product>(`/products/${id}`, data);
    return res.data;
  },

  deleteProduct: async (id: number) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
};

export const warehousesApi = {
  getWarehouses: async () => {
    const res = await api.get<Warehouse[]>('/warehouses');
    return Array.isArray(res.data) ? res.data : [];
  },

  getWarehouse: async (id: number) => {
    const res = await api.get<Warehouse>(`/warehouses/${id}`);
    return res.data;
  },

  createWarehouse: async (data: Partial<Warehouse>) => {
    const res = await api.post<Warehouse>('/warehouses', data);
    return res.data;
  },

  updateWarehouse: async (id: number, data: Partial<Warehouse>) => {
    const res = await api.put<Warehouse>(`/warehouses/${id}`, data);
    return res.data;
  },
};

export const ordersApi = {
  getOrders: async (params?: { status_filter?: string; search?: string; limit?: number }) => {
    const res = await api.get<Order[]>('/orders', { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  getOrder: async (id: number) => {
    const res = await api.get<Order>(`/orders/${id}`);
    return res.data;
  },

  createOrder: async (data: {
    customer_name: string;
    customer_email?: string;
    warehouse_id: number;
    items: { product_id: number; quantity: number }[];
  }) => {
    const res = await api.post<Order>('/orders', data);
    return res.data;
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    const res = await api.patch<Order>(`/orders/${orderId}/status`, { status });
    return res.data;
  },
};

export const analyticsApi = {
  getDashboardStats: async () => {
    const res = await api.get<DashboardStats>('/analytics/dashboard');
    return (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) ? res.data : null;
  },

  getWarehouseBreakdown: async () => {
    const res = await api.get<WarehouseBreakdown[]>('/analytics/warehouse-breakdown');
    return Array.isArray(res.data) ? res.data : [];
  },
};

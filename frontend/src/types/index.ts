export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  description?: string;
  reorder_threshold: number;
  total_stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  location: string;
  capacity: number;
  current_stock: number;
  utilization_rate: number;
  created_at?: string;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  warehouse_id: number;
  product_name: string;
  sku: string;
  category: string;
  price: number;
  warehouse_name: string;
  warehouse_code: string;
  warehouse_location: string;
  quantity: number;
  reorder_point: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  last_updated?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  warehouse_id: number;
  warehouse_name: string;
  total_amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  order_date: string;
  items_count: number;
  items: OrderItem[];
}

export interface DashboardStats {
  total_products: number;
  total_inventory_units: number;
  low_stock_count: number;
  out_of_stock_count: number;
  todays_orders_count: number;
  todays_revenue: number;
  active_warehouses_count: number;
}

export interface WarehouseBreakdown {
  warehouse_id: number;
  name: string;
  code: string;
  location: string;
  capacity: number;
  current_stock: number;
  utilization_percentage: number;
  low_stock_items: number;
  out_of_stock_items: number;
}

export interface WSEventMessage {
  event: string;
  data: any;
  timestamp: string;
}

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { DBMSInspectorPage } from './pages/DBMSInspectorPage';

import { AddStockModal } from './components/modals/AddStockModal';
import { RemoveStockModal } from './components/modals/RemoveStockModal';
import { TransferStockModal } from './components/modals/TransferStockModal';
import { CreateOrderModal } from './components/modals/CreateOrderModal';
import { ProductModal } from './components/modals/ProductModal';
import { WarehouseModal } from './components/modals/WarehouseModal';

import { Product, Warehouse, InventoryItem } from './types';
import { productsApi, warehousesApi, inventoryApi } from './services/api';
import { useWebSocket } from './context/WebSocketContext';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Modals state
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isRemoveStockOpen, setIsRemoveStockOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);

  // Selected item targets
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [initialProductId, setInitialProductId] = useState<number | undefined>(undefined);
  const [initialWarehouseId, setInitialWarehouseId] = useState<number | undefined>(undefined);
  const [initialStockAction, setInitialStockAction] = useState<'add' | 'remove'>('add');

  // Global shared data
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const { subscribe } = useWebSocket();

  const loadSharedData = async () => {
    try {
      const [pData, wData, iData] = await Promise.all([
        productsApi.getProducts(),
        warehousesApi.getWarehouses(),
        inventoryApi.getInventory(),
      ]);
      setProducts(pData);
      setWarehouses(wData);
      setInventory(iData);
    } catch (err) {
      console.error('Failed to load shared app data:', err);
    }
  };

  useEffect(() => {
    loadSharedData();

    const unsubInv = subscribe('INVENTORY_UPDATED', () => loadSharedData());
    const unsubTransfer = subscribe('STOCK_TRANSFERRED', () => loadSharedData());
    const unsubOrder = subscribe('ORDER_CREATED', () => loadSharedData());
    const unsubProd = subscribe('PRODUCT_CREATED', () => loadSharedData());
    const unsubWh = subscribe('WAREHOUSE_CREATED', () => loadSharedData());

    return () => {
      unsubInv();
      unsubTransfer();
      unsubOrder();
      unsubProd();
      unsubWh();
    };
  }, [subscribe]);

  // Handler helpers - EXACT product_id and warehouse_id preservation
  const handleOpenAddStock = (prodId?: number, whId?: number, item?: InventoryItem) => {
    setInitialProductId(prodId);
    setInitialWarehouseId(whId);
    setSelectedInventoryItem(item || null);
    setInitialStockAction('add');
    setIsAddStockOpen(true);
  };

  const handleOpenRemoveStock = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setInitialProductId(item.product_id);
    setInitialWarehouseId(item.warehouse_id);
    setInitialStockAction('remove');
    setIsRemoveStockOpen(true);
  };

  const handleOpenTransfer = (prodId?: number, whId?: number) => {
    setInitialProductId(prodId);
    setInitialWarehouseId(whId);
    setIsTransferOpen(true);
  };

  const handleOpenAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenAddWarehouse = () => {
    setSelectedWarehouse(null);
    setIsWarehouseModalOpen(true);
  };

  const handleOpenEditWarehouse = (wh: Warehouse) => {
    setSelectedWarehouse(wh);
    setIsWarehouseModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#0B132B] font-sans selection:bg-sky-500/20 selection:text-sky-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Surface */}
      <div className="flex-1 flex flex-col min-w-0 bg-ambient-canvas h-screen overflow-y-auto">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
          onOpenAddStock={() => handleOpenAddStock()}
          onOpenTransfer={() => handleOpenTransfer()}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        {/* Main Content Pages */}
        <main className="flex-1 px-8 pb-10">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onOpenAddStock={handleOpenAddStock}
              onOpenTransfer={handleOpenTransfer}
              onOpenRemoveStock={handleOpenRemoveStock}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              products={products}
              warehouses={warehouses}
              onOpenAddStock={handleOpenAddStock}
              onOpenRemoveStock={handleOpenRemoveStock}
              onOpenTransfer={handleOpenTransfer}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersPage
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'products' && (
            <ProductsPage
              onOpenAddProduct={handleOpenAddProduct}
              onOpenEditProduct={handleOpenEditProduct}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'warehouses' && (
            <WarehousesPage
              onOpenAddWarehouse={handleOpenAddWarehouse}
              onOpenEditWarehouse={handleOpenEditWarehouse}
            />
          )}

          {activeTab === 'dbms' && <DBMSInspectorPage />}
        </main>
      </div>

      {/* Real-Time Live Notification Toasts */}
      <ToastContainer />

      {/* Modals with accurate product & warehouse preservation */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => {
          setIsAddStockOpen(false);
          setSelectedInventoryItem(null);
          setInitialProductId(undefined);
          setInitialWarehouseId(undefined);
        }}
        products={products}
        warehouses={warehouses}
        initialProductId={initialProductId}
        initialWarehouseId={initialWarehouseId}
        initialAction={initialStockAction}
        selectedItem={selectedInventoryItem}
        onSuccess={loadSharedData}
      />

      <RemoveStockModal
        isOpen={isRemoveStockOpen}
        onClose={() => {
          setIsRemoveStockOpen(false);
          setSelectedInventoryItem(null);
        }}
        item={selectedInventoryItem}
        onSuccess={loadSharedData}
      />

      <TransferStockModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setInitialProductId(undefined);
          setInitialWarehouseId(undefined);
        }}
        products={products}
        warehouses={warehouses}
        inventory={inventory}
        initialProductId={initialProductId}
        initialWarehouseId={initialWarehouseId}
        onSuccess={loadSharedData}
      />

      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        products={products}
        warehouses={warehouses}
        inventory={inventory}
        onSuccess={loadSharedData}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={loadSharedData}
      />

      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => {
          setIsWarehouseModalOpen(false);
          setSelectedWarehouse(null);
        }}
        warehouse={selectedWarehouse}
        onSuccess={loadSharedData}
      />
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { Database, ShieldCheck, Key, GitCommit, Search, Layers, Radio } from 'lucide-react';

export const DBMSInspectorPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'transactions' | 'schema' | 'constraints' | 'indexes' | 'realtime'>('transactions');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              DBMS Architectural Concepts Inspector
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                Evaluation Guide
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive demonstration of relational database design, ACID transactions, constraints, and indexes in StockFlow.
            </p>
          </div>
        </div>

        {/* Concept Selector Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
          {[
            { id: 'transactions', label: 'ACID Transactions', icon: ShieldCheck },
            { id: 'schema', label: '3NF Relational Schema', icon: Layers },
            { id: 'constraints', label: 'Integrity Constraints', icon: Key },
            { id: 'indexes', label: 'B-Tree Indexes', icon: Search },
            { id: 'realtime', label: 'Real-Time Sync Engine', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0B132B] text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      {activeSection === 'transactions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card space-y-4">
            <div className="flex items-center gap-2 text-sky-600">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                1. Order Placement ACID Transaction
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When an order is created, the system guarantees that stock reduction and order insertion either <strong>both succeed</strong> or <strong>both fail</strong>. StockFlow uses an explicit transaction boundary with pessimistic locking:
            </p>
            <div className="p-4 rounded-xl bg-[#0B132B] font-mono text-xs text-sky-300 border border-slate-800 overflow-x-auto shadow-inner">
              <pre>{`-- Order Creation Transaction
BEGIN;
  -- 1. Lock and validate stock for product in warehouse
  SELECT quantity FROM inventory 
  WHERE product_id = 3 AND warehouse_id = 1 
  FOR UPDATE;

  -- 2. If available_qty < requested_qty: ROLLBACK!

  -- 3. Create Order Record
  INSERT INTO orders (order_number, customer_name, warehouse_id, total_amount, status)
  VALUES ('ORD-2026-1042', 'Acme Labs', 1, 699.98, 'COMPLETED');

  -- 4. Create Order Line Items
  INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
  VALUES (42, 3, 2, 349.99, 699.98);

  -- 5. Atomically decrease inventory
  UPDATE inventory 
  SET quantity = quantity - 2, last_updated = CURRENT_TIMESTAMP
  WHERE product_id = 3 AND warehouse_id = 1;

COMMIT;`}</pre>
            </div>
          </div>

          <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <GitCommit className="w-5 h-5" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                2. Warehouse Transfer Transaction
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Moving stock between two physical facilities must prevent race conditions and "phantom inventory". The transfer endpoint wraps both updates in a single atomic transaction:
            </p>
            <div className="p-4 rounded-xl bg-[#0B132B] font-mono text-xs text-sky-300 border border-slate-800 overflow-x-auto shadow-inner">
              <pre>{`-- Inter-Warehouse Transfer Transaction
BEGIN;
  -- 1. Verify and lock source warehouse inventory
  SELECT quantity FROM inventory 
  WHERE product_id = 1 AND warehouse_id = 1 
  FOR UPDATE;

  -- 2. Deduct transferred quantity from source
  UPDATE inventory 
  SET quantity = quantity - 10, last_updated = CURRENT_TIMESTAMP
  WHERE product_id = 1 AND warehouse_id = 1;

  -- 3. Increment destination inventory
  UPDATE inventory 
  SET quantity = quantity + 10, last_updated = CURRENT_TIMESTAMP
  WHERE product_id = 1 AND warehouse_id = 3;

COMMIT;`}</pre>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'schema' && (
        <div className="space-y-4">
          <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
              Third Normal Form (3NF) Relational Architecture
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              All tables satisfy 1NF (atomic values, PKs), 2NF (no partial dependencies on composite keys), and 3NF (no transitive functional dependencies).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                {
                  name: 'products',
                  pk: 'id (PK)',
                  columns: ['name', 'sku (UNIQUE)', 'category', 'price', 'reorder_threshold'],
                },
                {
                  name: 'warehouses',
                  pk: 'id (PK)',
                  columns: ['name', 'code (UNIQUE)', 'location', 'capacity'],
                },
                {
                  name: 'inventory',
                  pk: 'id (PK)',
                  columns: ['product_id (FK)', 'warehouse_id (FK)', 'quantity', 'reorder_point', 'UNIQUE(prod, wh)'],
                },
                {
                  name: 'orders',
                  pk: 'id (PK)',
                  columns: ['order_number (UNIQUE)', 'customer_name', 'warehouse_id (FK)', 'total_amount', 'status'],
                },
                {
                  name: 'order_items',
                  pk: 'id (PK)',
                  columns: ['order_id (FK)', 'product_id (FK)', 'quantity', 'unit_price', 'subtotal'],
                },
              ].map((table) => (
                <div key={table.name} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold font-mono text-sky-700 pb-2 mb-2 border-b border-slate-200">
                    {table.name}
                  </div>
                  <div className="text-[11px] font-mono text-amber-600 font-semibold mb-1">
                    🔑 {table.pk}
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600 font-mono">
                    {table.columns.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'constraints' && (
        <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card space-y-4">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Integrity Constraints & Declarative Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-sky-700">CHECK CONSTRAINTS</span>
              <ul className="text-xs text-slate-700 font-mono space-y-1.5">
                <li>• CHECK (price &gt;= 0)</li>
                <li>• CHECK (quantity &gt;= 0) — Prevents negative inventory</li>
                <li>• CHECK (capacity &gt; 0) — Non-zero warehouse limits</li>
                <li>• CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'))</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-blue-700">FOREIGN KEY ACTIONS</span>
              <ul className="text-xs text-slate-700 font-mono space-y-1.5">
                <li>• inventory.product_id → ON DELETE CASCADE</li>
                <li>• inventory.warehouse_id → ON DELETE RESTRICT</li>
                <li>• order_items.order_id → ON DELETE CASCADE</li>
                <li>• order_items.product_id → ON DELETE RESTRICT</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'indexes' && (
        <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card space-y-4">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            B-Tree Indexes for High Performance Queries
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Without indexes, looking up products by SKU or filtering orders by date requires O(N) full table scans. PostgreSQL B-Tree indexes reduce this to O(log N).
          </p>
          <div className="p-4 rounded-xl bg-[#0B132B] font-mono text-xs text-sky-300 border border-slate-800 overflow-x-auto shadow-inner">
            <pre>{`CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_orders_warehouse ON orders(warehouse_id);
CREATE INDEX idx_orders_date ON orders(order_date DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);`}</pre>
          </div>
        </div>
      )}

      {activeSection === 'realtime' && (
        <div className="p-6 rounded-[22px] bg-white border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-sky-600">
            <Radio className="w-5 h-5" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Real-Time Push Architecture (FastAPI WebSockets)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike traditional polling which floods the database with redundant queries, StockFlow utilizes an event-driven pub/sub model via WebSockets:
          </p>
          <div className="p-4 rounded-xl bg-[#0B132B] font-mono text-xs text-slate-200 border border-slate-800 leading-loose shadow-inner">
            <span className="text-sky-400 font-bold">[Browser 1]</span> User modifies stock or creates order<br />
            &nbsp;&nbsp;↓ HTTP POST /api/orders<br />
            <span className="text-blue-400 font-bold">[FastAPI Engine]</span> ACID Transaction verifies stock & commits to PostgreSQL<br />
            &nbsp;&nbsp;↓ ConnectionManager.broadcast("INVENTORY_UPDATED", payload)<br />
            <span className="text-amber-400 font-bold">[WebSocket Bus]</span> Non-blocking broadcast across active client sockets<br />
            &nbsp;&nbsp;↓ ws.send_json(...)<br />
            <span className="text-sky-400 font-bold">[Browser 2]</span> Receives event within milliseconds → Triggers row flash animation & updates state without reload!
          </div>
        </div>
      )}
    </div>
  );
};

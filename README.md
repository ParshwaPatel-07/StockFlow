# StockFlow — Real-Time Inventory Management System
> **College DBMS Project** demonstrating Relational Database Normalization (3NF), ACID Transactions, Integrity Constraints, B-Tree Indexes, and Real-Time WebSocket Synchronization.

---

## 1. Project Overview

**StockFlow** is a modern, high-performance inventory management dashboard designed to model real-world supply chain and warehouse distribution. Built as a college DBMS project, it strikes a balance between academic database rigor and modern software engineering.

The centerpiece of StockFlow is **real-time bi-directional synchronization**: when inventory or order data changes in one browser window (or facility terminal), all other connected clients immediately reflect the change with visual highlight animations and notifications without needing a page refresh.

---

## 2. Core Features

### 📦 Product Catalog Management
- Full CRUD operations: create, read, update, delete products.
- Fields: Product Name, Unique SKU, Category, Price, Description, Reorder Threshold.
- Automatic inventory row allocation across existing warehouses on product creation.

### 🏭 Multi-Warehouse Facility Management
- Multi-location warehouse tracking: New York Hub, Chicago Logistics, Los Angeles Depot, Austin Regional.
- Capacity monitoring with dynamic utilization percentage gauges.
- Location and facility code tracking.

### 🔄 Real-Time Inventory Operations
- **Real-Time Stock Directory**: Live view of stock for every product in every warehouse.
- **Add Stock**: Increment quantity with reason logging and instant multi-client broadcast.
- **Remove Stock**: Validated stock deduction (enforcing non-negative stock constraints).
- **Inter-Warehouse Stock Transfer**: Single atomic ACID transaction that decreases stock in the source warehouse and increments it in the destination warehouse.
- **Visual Status Badges**:
  - `🟢 In Stock`: Quantity > Reorder Point
  - `🟡 Low Stock`: 0 < Quantity ≤ Reorder Point
  - `🔴 Out of Stock`: Quantity = 0

### 🛒 Orders & Atomic Fulfillment
- Dynamic multi-product order creation wizard.
- Real-time stock validation: guarantees requested quantities do not exceed available facility inventory before order confirmation.
- Atomic stock deduction upon order placement.
- Order history with line item subtotal breakdowns.
- Order cancellation with automatic inventory restock.

### ⚡ Real-Time WebSocket Synchronization
- Persistent WebSocket connection with automatic exponential backoff reconnection.
- Visual **"LIVE"** status pill indicator in the top navbar (`🟢 LIVE` / `🟡 Reconnecting...` / `🔴 Disconnected`).
- Row flashing animations (green glow for stock increase, red/orange glow for stock deduction/transfer) when modified remotely.
- Live toast notifications describing the remote modification.

### 🔍 Interactive DBMS Concepts Inspector
- Dedicated panel demonstrating 3NF schema design, ACID transaction mechanics, CHECK constraints, and B-Tree indexes for academic grading and presentation.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Primary Database** | PostgreSQL | Enterprise relational database with ACID compliance, constraints, and indexes |
| **ORM / Migration** | SQLAlchemy 2.0 | Type-safe declarative models & transaction session management |
| **Backend API** | FastAPI (Python 3.14) | High throughput, asynchronous endpoint execution, native WebSocket support |
| **Real-Time Engine**| FastAPI WebSockets | Event-driven pub/sub broadcast without Redis/Kafka overhead |
| **Frontend UI** | React 18 + TypeScript | Component-based state management, strong typing |
| **Bundler & Build** | Vite 5 | Sub-second hot module replacement & fast compilation |
| **Styling** | Tailwind CSS | Modern, SaaS-grade dark theme interface with custom animations |
| **Icons** | Lucide React | Clean, scalable visual indicators |

---

## 4. Database Architecture & Schema

### Entity Relationship (ER) Diagram Description

The database is strictly normalized to **Third Normal Form (3NF)**:
1. `products` **(1) — (M)** `inventory` **(M) — (1)** `warehouses`
2. `warehouses` **(1) — (M)** `orders`
3. `orders` **(1) — (M)** `order_items` **(M) — (1)** `products`

```
  +--------------------+               +--------------------+
  |      products      |               |     warehouses     |
  +--------------------+               +--------------------+
  | id (PK)            |               | id (PK)            |
  | name               |               | name               |
  | sku (UQ)           |               | code (UQ)          |
  | category           |               | location           |
  | price              |               | capacity           |
  | reorder_threshold  |               | created_at         |
  +--------+-----------+               +---------+----------+
           | 1                                   | 1
           |                                     |
           | M                                   | M
  +--------v-------------------------------------v----------+
  |                        inventory                        |
  +---------------------------------------------------------+
  | id (PK)                                                 |
  | product_id (FK -> products.id ON DELETE CASCADE)        |
  | warehouse_id (FK -> warehouses.id ON DELETE RESTRICT)   |
  | quantity (CHECK >= 0)                                   |
  | reorder_point (CHECK >= 0)                              |
  | UNIQUE (product_id, warehouse_id)                       |
  +---------------------------------------------------------+

           +--------------------+
           |       orders       |
           +--------------------+
           | id (PK)            |
           | order_number (UQ)  |
           | customer_name      |
           | customer_email     |
           | warehouse_id (FK)  |
           | total_amount       |
           | status             |
           | order_date         |
           +---------+----------+
                     | 1
                     |
                     | M
           +---------v----------+
           |    order_items     |
           +--------------------+
           | id (PK)            |
           | order_id (FK)      |
           | product_id (FK)    |
           | quantity (CHECK > 0)|
           | unit_price         |
           | subtotal           |
           +--------------------+
```

### Relational Constraints

- **Primary Keys**: Surrogate auto-incrementing integer PKs on all entities.
- **Unique Constraints**:
  - `products(sku)`: Disallows duplicate product SKUs.
  - `warehouses(code)`: Enforces unique warehouse codes.
  - `orders(order_number)`: Guarantees unique order identifiers.
  - `inventory(product_id, warehouse_id)`: Composite uniqueness ensuring a single inventory tracking row per product-warehouse pair.
- **Check Constraints**:
  - `CHECK (price >= 0)`
  - `CHECK (quantity >= 0)`: Database-level guarantee preventing negative inventory.
  - `CHECK (capacity > 0)`: Enforces positive warehouse capacity.
  - `CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'))`
- **Foreign Key Referentials**:
  - `inventory.product_id` → `CASCADE` delete.
  - `inventory.warehouse_id` → `RESTRICT` delete (cannot delete a warehouse holding stock).
  - `order_items.order_id` → `CASCADE` delete.

### Performance Indexes

```sql
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_orders_warehouse ON orders(warehouse_id);
CREATE INDEX idx_orders_date ON orders(order_date DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

---

## 5. ACID Transaction Demonstration

### Transaction Example: Order Placement

Order fulfillment requires atomic coordination between 3 database tables (`orders`, `order_items`, and `inventory`):

```
BEGIN TRANSACTION;

  -- Step 1: Validate and lock inventory row to prevent concurrent race conditions
  SELECT quantity FROM inventory 
  WHERE product_id = :p_id AND warehouse_id = :w_id 
  FOR UPDATE;

  -- Step 2: If available_quantity < requested_quantity:
  --         Raise Error and ROLLBACK;

  -- Step 3: Insert order header record
  INSERT INTO orders (order_number, customer_name, warehouse_id, total_amount, status)
  VALUES ('ORD-2026-1042', 'Acme Labs', 1, 649.95, 'COMPLETED');

  -- Step 4: Insert order line items
  INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
  VALUES (42, 1, 5, 129.99, 649.95);

  -- Step 5: Atomically deduct inventory
  UPDATE inventory 
  SET quantity = quantity - 5, last_updated = CURRENT_TIMESTAMP
  WHERE product_id = 1 AND warehouse_id = 1;

COMMIT TRANSACTION;
```

If any step fails (e.g., product out of stock or network interruption), the database executes an automatic **`ROLLBACK`**, ensuring no partial orders or inconsistent inventory deductions occur.

---

## 6. How Real-Time Synchronization Works

StockFlow uses an event-driven architecture powered by FastAPI WebSockets:

```
[Browser Window A]                   [FastAPI Server]                 [Browser Window B]
        |                                    |                                 |
        |--- 1. POST /api/inventory/adjust ->|                                 |
        |    (+20 units of KB-PRO-01)        |                                 |
        |                                    |-- 2. Execute SQL & COMMIT       |
        |                                    |-- 3. WebSocket Broadcast -------+---> Receives Event:
        |                                    |      (event: INVENTORY_UPDATED) |     INVENTORY_UPDATED
        |<-- 4. Receives broadcast ----------|                                 |
        |                                                                      |-- Triggers green row flash
        |-- Triggers green row flash                                           |-- Updates stock: 51 -> 71
        |-- Toast: "Stock Added (+20)"                                         |-- Toast: "Stock Added (+20)"
```

- **No page refresh required**.
- **Lightweight payload**: Sends only changed fields.
- **Resilient Heartbeat**: Background ping/pong keeps the connection active and recovers within 3 seconds if disconnected.

---

## 7. How to Run the Project Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) PostgreSQL installed and running (or use automatic local SQLite fallback mode)

### Quick One-Click Launch

Simply run the launch script from the project root:

```bash
./start.sh
```

Or execute with Python:

```bash
python3 run.py
```

This automatically:
1. Creates the Python virtual environment and installs dependencies.
2. Seeds the database with 20 realistic products, 4 warehouses, and historical orders.
3. Starts the FastAPI backend at `http://localhost:8000` (docs at `http://localhost:8000/docs`).
4. Starts the Vite React frontend at `http://localhost:5173`.

### Connecting to PostgreSQL

To connect directly to a live PostgreSQL instance, set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/stockflow"
./start.sh
```

Or manually initialize with the pure SQL schema:
```bash
psql -U postgres -d stockflow -f database/schema.sql
psql -U postgres -d stockflow -f database/seed.sql
```

---

## 8. College Presentation & Evaluation Steps (Two-Browser Demo)

To demonstrate the real-time capabilities to an instructor or evaluator:

1. **Open two browser windows side-by-side**:
   - Window A: `http://localhost:5173`
   - Window B: `http://localhost:5173`
2. Notice the **`🟢 LIVE`** indicator in the top navbar of both windows.
3. **In Window A (Inventory Tab)**:
   - Locate **"UltraPro Mechanical Keyboard"** in **New York Central Hub**.
   - Click **Add Stock** and enter `20` units.
   - Click **Confirm Stock Addition**.
4. **Observe Window B**:
   - The stock instantly updates from `51` to `71`.
   - The table row briefly highlights in emerald green.
   - A real-time toast notification appears in the bottom-right corner.
5. **In Window B (Orders Tab or Navbar)**:
   - Click **+ New Order**.
   - Select **Customer**: "Evaluator Presentation Corp".
   - Select **Warehouse**: "New York Central Hub".
   - Select Product: "UltraPro Mechanical Keyboard", Quantity: `5`.
   - Click **Place Order & Deduct Stock**.
6. **Observe Window A**:
   - The order immediately appears at the top of the Orders list.
   - In the Inventory tab, the stock immediately decreases from `71` to `66` with a live visual animation.
7. **Navigate to the "DBMS Inspector" Tab**:
   - Show the 3NF schema, the transaction SQL logs, and check constraint definitions to demonstrate comprehensive DBMS knowledge.

---

## 9. Directory Structure

```
StockFlow/
├── database/
│   ├── schema.sql              # Pure PostgreSQL DDL schema with constraints & indexes
│   └── seed.sql                # 20 products, 4 warehouses, stock matrix & orders
├── backend/
│   ├── app/
│   │   ├── config.py           # Application settings & environment configuration
│   │   ├── database.py         # SQLAlchemy engine, session pool & fallback logic
│   │   ├── models.py           # 3NF relational SQLAlchemy models
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── websocket_manager.py# Real-time WebSocket connection manager & broadcast
│   │   ├── main.py             # FastAPI entrypoint, CORS & WebSocket route
│   │   └── routers/
│   │       ├── analytics.py    # Aggregate metrics & warehouse capacity stats
│   │       ├── inventory.py    # Live inventory directory, adjust & transfer endpoints
│   │       ├── orders.py       # ACID transactional order placement & status
│   │       ├── products.py     # Product catalog CRUD
│   │       └── warehouses.py   # Warehouse management
│   ├── init_db.py              # Standalone database initialization & seeder
│   ├── test_api.py             # Pytest automated API suite
│   ├── test_ws.py              # WebSocket broadcast unit test
│   └── test_e2e_realtime.py    # Full multi-client real-time simulation test
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx      # Header with Live status pill & quick order button
│   │   │   ├── Sidebar.tsx     # Navigation sidebar with DBMS branding
│   │   │   ├── LiveBadge.tsx   # Visual WebSocket connection status indicator
│   │   │   ├── ToastContainer.tsx # Live incoming broadcast toast alerts
│   │   │   └── modals/         # Modals for Add Stock, Remove, Transfer, Order
│   │   ├── context/
│   │   │   └── WebSocketContext.tsx # Persistent WS connection & event dispatcher
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Executive KPIs, capacity bars & live feed
│   │   │   ├── InventoryPage.tsx    # Filterable stock directory with live row glow
│   │   │   ├── OrdersPage.tsx       # Transactional order stream & subtotal drawer
│   │   │   ├── ProductsPage.tsx     # Catalog management
│   │   │   ├── WarehousesPage.tsx   # Storage facilities & utilization
│   │   │   └── DBMSInspectorPage.tsx# Educational DBMS concepts & SQL inspector
│   │   ├── services/
│   │   │   └── api.ts          # Axios client methods
│   │   └── types/
│   │       └── index.ts        # TypeScript data definitions
│   └── vite.config.ts          # Vite build & proxy configuration
├── run.py                      # Python cross-platform runner script
├── start.sh                    # Bash launcher script
└── README.md                   # Complete documentation
```

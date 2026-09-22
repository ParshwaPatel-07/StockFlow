-- ============================================================================
-- StockFlow Seed Data
-- 20 Products, 4 Warehouses, Distributed Stock & Realistic Historical Orders
-- ============================================================================

-- Warehouses
INSERT INTO warehouses (id, name, code, location, capacity) VALUES
(1, 'New York Central Hub', 'WH-NYC-01', 'Jersey City, NJ (Building A)', 25000),
(2, 'Chicago Midwest Logistics', 'WH-CHI-02', 'Des Plaines, IL (Bay 4)', 30000),
(3, 'Los Angeles West Depot', 'WH-LAX-03', 'Long Beach, CA (Dock 12)', 40000),
(4, 'Austin Tech Warehouse', 'WH-ATX-04', 'Round Rock, TX (Suite 100)', 18000)
ON CONFLICT (id) DO NOTHING;

-- Products (20 realistic items)
INSERT INTO products (id, name, sku, category, price, description, reorder_threshold) VALUES
(1, 'UltraPro Mechanical Keyboard', 'KB-PRO-01', 'Electronics', 129.99, 'Custom RGB mechanical keyboard with hot-swappable tactile switches', 15),
(2, 'ErgoFlow Wireless Mouse', 'MS-ERGO-02', 'Electronics', 79.50, 'Ergonomic 4000 DPI wireless mouse with dual Bluetooth & 2.4G', 20),
(3, 'ProVision 27" 4K Monitor', 'MON-4K-27', 'Displays', 349.99, '27-inch IPS UHD 4K panel with 99% sRGB and USB-C 65W charging', 10),
(4, 'StudioSound ANC Headphones', 'AUD-ANC-04', 'Audio', 199.00, 'Over-ear active noise cancelling headphones with 30-hour battery', 12),
(5, 'Thunderbolt 4 Docking Station', 'DOCK-TB4-05', 'Accessories', 189.95, '12-in-1 multi-port docking station with dual 4K video outputs', 8),
(6, 'SmartDesk Motorized Sit-Stand Desk', 'DSK-STAND-06', 'Furniture', 499.00, 'Dual-motor electric height adjustable standing desk (60x30 inch)', 5),
(7, 'AeroMesh High-Back Ergonomic Chair', 'CHR-AERO-07', 'Furniture', 299.99, 'Breathable mesh executive office chair with lumbar and headrest', 6),
(8, 'OmniCharge 100W GaN Charger', 'PWR-GAN-08', 'Accessories', 59.99, 'Compact 4-port 100W USB-C GaN fast wall charger', 25),
(9, 'SuperFast 2TB NVMe M.2 SSD', 'SSD-NVME-09', 'Storage', 159.00, 'PCIe Gen 4x4 high performance SSD with heatsink (7450 MB/s)', 15),
(10, 'Rugged 4TB External USB-C Drive', 'HDD-EXT-10', 'Storage', 119.50, 'Shock-resistant ruggedized external hard drive for field backups', 10),
(11, 'StreamCam 1080p 60FPS Webcam', 'CAM-STR-11', 'Electronics', 89.99, 'Full HD streaming webcam with dual beamforming microphones', 15),
(12, 'Cat8 Shielded Ethernet Cable (25ft)', 'CBL-CAT8-12', 'Networking', 18.50, '2000MHz 40Gbps braided high-speed gigabit patch cable', 30),
(13, 'Wi-Fi 7 Tri-Band Mesh Router', 'NET-WF7-13', 'Networking', 329.00, 'Tri-band BE9300 whole-home mesh Wi-Fi system covers 5000 sq ft', 8),
(14, 'Aluminum Laptop Stand (Adjustable)', 'ACC-LST-14', 'Accessories', 39.99, 'Heavy-duty foldable aluminum riser for 11" to 17" laptops', 20),
(15, 'Precision Desk Pad (900x400mm)', 'MAT-DESK-15', 'Accessories', 24.99, 'Water-resistant anti-fray micro-textured stitched edge desk mat', 30),
(16, 'AirPure Desktop HEPA Purifier', 'APP-AIR-16', 'Appliances', 89.00, 'H13 true HEPA air cleaner for offices with quiet sleep mode', 10),
(17, 'Smart LED Light Bar for Monitor', 'LGT-BAR-17', 'Lighting', 45.00, 'Screen hanging desk lamp with auto-dimming and zero screen glare', 15),
(18, 'Heavy-Duty Anti-Fatigue Floor Mat', 'MAT-FATG-18', 'Furniture', 55.00, 'High-density foam standing comfort cushion for workstations', 12),
(19, 'Executive Leather Cable Organizer', 'ORG-CBL-19', 'Accessories', 19.99, 'Travel cord storage case with zip compartments and elastic bands', 25),
(20, 'Rapid Thermal Label Barcode Printer', 'PRT-THM-20', 'Electronics', 149.99, 'Commercial 4x6 thermal shipping and inventory barcode printer', 7)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for postgres
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('warehouses_id_seq', (SELECT MAX(id) FROM warehouses));

-- Inventory (Realistic distribution: high, low, and out-of-stock states)
INSERT INTO inventory (product_id, warehouse_id, quantity, reorder_point) VALUES
-- Warehouse 1: New York Hub
(1, 1, 45, 15),
(2, 1, 60, 20),
(3, 1, 18, 10),
(4, 1, 28, 12),
(5, 1, 14, 8),
(6, 1, 4, 5),    -- Low stock!
(7, 1, 8, 6),
(8, 1, 85, 25),
(9, 1, 32, 15),
(10, 1, 22, 10),
(11, 1, 12, 15),  -- Low stock!
(12, 1, 120, 30),
(13, 1, 9, 8),
(14, 1, 55, 20),
(15, 1, 75, 30),
(16, 1, 15, 10),
(17, 1, 38, 15),
(18, 1, 20, 12),
(19, 1, 65, 25),
(20, 1, 16, 7),

-- Warehouse 2: Chicago Midwest Logistics
(1, 2, 30, 15),
(2, 2, 40, 20),
(3, 2, 7, 10),    -- Low stock!
(4, 2, 19, 12),
(5, 2, 3, 8),     -- Low stock!
(6, 2, 11, 5),
(7, 2, 14, 6),
(8, 2, 90, 25),
(9, 2, 0, 15),    -- OUT OF STOCK!
(10, 2, 18, 10),
(11, 2, 25, 15),
(12, 2, 80, 30),
(13, 2, 14, 8),
(14, 2, 35, 20),
(15, 2, 45, 30),
(16, 2, 6, 10),   -- Low stock!
(17, 2, 22, 15),
(18, 2, 16, 12),
(19, 2, 40, 25),
(20, 2, 5, 7),    -- Low stock!

-- Warehouse 3: Los Angeles West Depot
(1, 3, 50, 15),
(2, 3, 75, 20),
(3, 3, 25, 10),
(4, 3, 35, 12),
(5, 3, 20, 8),
(6, 3, 8, 5),
(7, 3, 12, 6),
(8, 3, 110, 25),
(9, 3, 40, 15),
(10, 3, 30, 10),
(11, 3, 0, 15),   -- OUT OF STOCK!
(12, 3, 150, 30),
(13, 3, 18, 8),
(14, 3, 60, 20),
(15, 3, 90, 30),
(16, 3, 24, 10),
(17, 3, 45, 15),
(18, 3, 22, 12),
(19, 3, 80, 25),
(20, 3, 18, 7),

-- Warehouse 4: Austin Tech Facility
(1, 4, 22, 15),
(2, 4, 35, 20),
(3, 4, 12, 10),
(4, 4, 16, 12),
(5, 4, 9, 8),
(6, 4, 6, 5),
(7, 4, 5, 6),     -- Low stock!
(8, 4, 50, 25),
(9, 4, 20, 15),
(10, 4, 15, 10),
(11, 4, 18, 15),
(12, 4, 65, 30),
(13, 4, 10, 8),
(14, 4, 28, 20),
(15, 4, 35, 30),
(16, 4, 12, 10),
(17, 4, 20, 15),
(18, 4, 10, 12),  -- Low stock!
(19, 4, 30, 25),
(20, 4, 8, 7)
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- Historical Orders
INSERT INTO orders (id, order_number, customer_name, customer_email, warehouse_id, total_amount, status, order_date) VALUES
(1, 'ORD-2026-1001', 'Acme Tech Solutions', 'orders@acmetech.com', 1, 959.47, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 'ORD-2026-1002', 'NextGen Startup Labs', 'ops@nextgenlabs.io', 3, 1428.98, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 'ORD-2026-1003', 'Apex Design Studio', 'sarah@apexdesign.co', 1, 549.98, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(4, 'ORD-2026-1004', 'CloudScale Infrastructure', 'devops@cloudscale.net', 2, 796.95, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '18 hours'),
(5, 'ORD-2026-1005', 'Horizon Media Group', 'procurement@horizon.media', 4, 478.99, 'PROCESSING', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(6, 'ORD-2026-1006', 'DevSprint Academy', 'finance@devsprint.org', 1, 1099.00, 'PROCESSING', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(7, 'ORD-2026-1007', 'QuantEdge Capital', 'techdesk@quantedge.com', 3, 899.97, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '35 minutes')
ON CONFLICT (id) DO NOTHING;

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- Order Items for historical orders
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
-- Order 1 (Acme)
(1, 1, 3, 129.99, 389.97),
(1, 2, 4, 79.50, 318.00),
(1, 8, 3, 59.99, 179.97),
(1, 12, 3, 23.84, 71.53),
-- Order 2 (NextGen)
(2, 3, 2, 349.99, 699.98),
(2, 5, 2, 189.95, 379.90),
(2, 4, 1, 199.00, 199.00),
(2, 20, 1, 149.99, 149.99),
-- Order 3 (Apex)
(3, 7, 1, 299.99, 299.99),
(3, 1, 1, 129.99, 129.99),
(3, 8, 2, 59.99, 119.98),
-- Order 4 (CloudScale)
(4, 9, 3, 159.00, 477.00),
(4, 13, 1, 329.00, 329.00),
(4, 12, 5, 18.50, 92.50),
-- Order 5 (Horizon)
(5, 4, 1, 199.00, 199.00),
(5, 11, 2, 89.99, 179.98),
(5, 14, 2, 39.99, 79.98),
(5, 17, 1, 45.00, 45.00),
-- Order 6 (DevSprint)
(6, 6, 2, 499.00, 998.00),
(6, 15, 4, 24.99, 99.96),
-- Order 7 (QuantEdge)
(7, 3, 2, 349.99, 699.98),
(7, 4, 1, 199.00, 199.00);

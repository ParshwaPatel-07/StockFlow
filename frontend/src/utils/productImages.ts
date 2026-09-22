// Offline-first local product & warehouse asset system for StockFlow
// All images are served locally from public/assets/ to guarantee 100% offline uptime and zero broken image icons.

export interface WarehouseImageMeta {
  code: string;
  name: string;
  imageUrl: string;
  locationDetail: string;
}

// 1. Warehouse local images extracted directly from reference design (media_1790083297596.png)
export const WAREHOUSE_IMAGES: Record<string, WarehouseImageMeta> = {
  'WH-NYC-01': {
    code: 'WH-NYC-01',
    name: 'New York Central Hub',
    imageUrl: '/assets/warehouses/new-york.jpg',
    locationDetail: 'Jersey City, NJ (Building A)',
  },
  'WH-CHI-02': {
    code: 'WH-CHI-02',
    name: 'Chicago Midwest Logistics',
    imageUrl: '/assets/warehouses/chicago.jpg',
    locationDetail: 'Des Plaines, IL (Bay 4)',
  },
  'WH-LAX-03': {
    code: 'WH-LAX-03',
    name: 'Los Angeles West Depot',
    imageUrl: '/assets/warehouses/los-angeles.jpg',
    locationDetail: 'Long Beach, CA (Dock 12)',
  },
  'WH-ATX-04': {
    code: 'WH-ATX-04',
    name: 'Austin Tech Warehouse',
    imageUrl: '/assets/warehouses/austin.jpg',
    locationDetail: 'Round Rock, TX (Suite 100)',
  },
};

export const DEFAULT_WAREHOUSE_IMAGE = '/assets/warehouses/new-york.jpg';

// 2. Complete mapping for all 20 seeded PostgreSQL product SKUs + reference design mockup aliases
export const PRODUCT_IMAGES: Record<string, string> = {
  // All 20 Seeded PostgreSQL Database SKUs:
  'KB-PRO-01': '/assets/products/kb-pro-01.svg',       // UltraPro Mechanical Keyboard
  'MS-ERGO-02': '/assets/products/ms-ergo-02.svg',     // ErgoFlow Wireless Mouse
  'MON-4K-27': '/assets/products/mon-4k-27.svg',       // ProVision 27" 4K Monitor
  'AUD-ANC-04': '/assets/products/aud-anc-04.svg',     // StudioSound ANC Headphones
  'DOCK-TB4-05': '/assets/products/dock-tb4-05.svg',   // Thunderbolt 4 Docking Station
  'DSK-STAND-06': '/assets/products/dsk-stand-06.svg', // SmartDesk Sit-Stand Desk
  'CHR-AERO-07': '/assets/products/chr-aero-07.svg',   // AeroMesh Ergonomic Chair
  'PWR-GAN-08': '/assets/products/pwr-gan-08.svg',     // OmniCharge 100W GaN Charger
  'SSD-NVME-09': '/assets/products/ssd-nvme-09.svg',   // SuperFast 2TB NVMe SSD
  'HDD-EXT-10': '/assets/products/hdd-ext-10.svg',     // Rugged 4TB External Drive
  'CAM-STR-11': '/assets/products/cam-str-11.svg',     // StreamCam 1080p Webcam
  'CBL-CAT8-12': '/assets/products/cbl-cat8-12.svg',   // Cat8 Shielded Ethernet Cable
  'NET-WF7-13': '/assets/products/net-wf7-13.svg',     // Wi-Fi 7 Tri-Band Mesh Router
  'ACC-LST-14': '/assets/products/acc-lst-14.svg',     // Aluminum Laptop Stand
  'MAT-DESK-15': '/assets/products/mat-desk-15.svg',   // Precision Desk Pad
  'APP-AIR-16': '/assets/products/app-air-16.svg',     // AirPure Desktop HEPA Purifier
  'LGT-BAR-17': '/assets/products/lgt-bar-17.svg',     // Smart LED Light Bar
  'MAT-FATG-18': '/assets/products/mat-fatg-18.svg',   // Anti-Fatigue Floor Mat
  'ORG-CBL-19': '/assets/products/org-cbl-19.svg',     // Leather Cable Organizer
  'PRT-THM-20': '/assets/products/prt-thm-20.svg',     // Thermal Label Barcode Printer

  // Reference mockup & legacy aliases:
  'LAP-UBP-14': '/assets/products/lap-ubp-14.svg',     // UltraBook Pro
  'MOU-ET-01': '/assets/products/ms-ergo-02.svg',      // ErgoTrack Mouse
  'ACC-MST-04': '/assets/products/mon-4k-27.svg',      // 4K Monitor Stand
  'AUD-HPH-02': '/assets/products/aud-anc-04.svg',     // Studio Headphones
  'KB-MECH-01': '/assets/products/kb-pro-01.svg',      // Mechanical Keyboard
  'CAM-PRO-4K': '/assets/products/cam-str-11.svg',     // 4K Webcam
  'DSK-PAD-XL': '/assets/products/mat-desk-15.svg',    // Desk Mat
  'HUB-USBC-10': '/assets/products/dock-tb4-05.svg',   // USB-C Hub
  'CHG-GAN-100': '/assets/products/pwr-gan-08.svg',    // GaN Charger
  'SSD-NVME-2TB': '/assets/products/ssd-nvme-09.svg',  // NVMe SSD
  'LGT-BAR-LED': '/assets/products/lgt-bar-17.svg',    // Light Bar
};

export const DEFAULT_PRODUCT_IMAGE = '/assets/products/product-placeholder.svg';

export function getProductImageUrl(sku?: string, name?: string): string {
  if (sku && PRODUCT_IMAGES[sku]) {
    return PRODUCT_IMAGES[sku];
  }

  const s = (sku || '').toUpperCase();
  if (PRODUCT_IMAGES[s]) return PRODUCT_IMAGES[s];

  const n = (name || '').toLowerCase();
  if (n.includes('keyboard') || n.includes('mech')) return PRODUCT_IMAGES['KB-PRO-01'];
  if (n.includes('mouse') || n.includes('ergo')) return PRODUCT_IMAGES['MS-ERGO-02'];
  if (n.includes('monitor') || n.includes('display')) return PRODUCT_IMAGES['MON-4K-27'];
  if (n.includes('headphone') || n.includes('audio') || n.includes('anc')) return PRODUCT_IMAGES['AUD-ANC-04'];
  if (n.includes('dock') || n.includes('hub') || n.includes('thunderbolt')) return PRODUCT_IMAGES['DOCK-TB4-05'];
  if (n.includes('desk') && n.includes('stand')) return PRODUCT_IMAGES['DSK-STAND-06'];
  if (n.includes('chair') || n.includes('aeromesh')) return PRODUCT_IMAGES['CHR-AERO-07'];
  if (n.includes('charge') || n.includes('gan')) return PRODUCT_IMAGES['PWR-GAN-08'];
  if (n.includes('ssd') || n.includes('nvme')) return PRODUCT_IMAGES['SSD-NVME-09'];
  if (n.includes('drive') || n.includes('hdd') || n.includes('hard')) return PRODUCT_IMAGES['HDD-EXT-10'];
  if (n.includes('cam') || n.includes('webcam')) return PRODUCT_IMAGES['CAM-STR-11'];
  if (n.includes('cable') || n.includes('cat8') || n.includes('ethernet')) return PRODUCT_IMAGES['CBL-CAT8-12'];
  if (n.includes('router') || n.includes('mesh') || n.includes('wifi') || n.includes('wi-fi')) return PRODUCT_IMAGES['NET-WF7-13'];
  if (n.includes('laptop') || n.includes('stand') || n.includes('riser')) return PRODUCT_IMAGES['ACC-LST-14'];
  if (n.includes('pad') || n.includes('mat')) return PRODUCT_IMAGES['MAT-DESK-15'];
  if (n.includes('purifier') || n.includes('airpure') || n.includes('hepa')) return PRODUCT_IMAGES['APP-AIR-16'];
  if (n.includes('light') || n.includes('lamp') || n.includes('bar')) return PRODUCT_IMAGES['LGT-BAR-17'];
  if (n.includes('fatigue') || n.includes('cushion')) return PRODUCT_IMAGES['MAT-FATG-18'];
  if (n.includes('organizer') || n.includes('leather')) return PRODUCT_IMAGES['ORG-CBL-19'];
  if (n.includes('printer') || n.includes('barcode') || n.includes('thermal')) return PRODUCT_IMAGES['PRT-THM-20'];

  return DEFAULT_PRODUCT_IMAGE;
}

export function getWarehouseMeta(code?: string, name?: string): WarehouseImageMeta {
  if (code && WAREHOUSE_IMAGES[code]) {
    return WAREHOUSE_IMAGES[code];
  }
  // Match by code prefix or name
  for (const key of Object.keys(WAREHOUSE_IMAGES)) {
    if (code && code.toUpperCase().includes(key.replace('WH-', ''))) {
      return WAREHOUSE_IMAGES[key];
    }
  }
  const n = (name || '').toLowerCase();
  if (n.includes('york') || n.includes('nyc')) return WAREHOUSE_IMAGES['WH-NYC-01'];
  if (n.includes('chicago') || n.includes('midwest') || n.includes('chi')) return WAREHOUSE_IMAGES['WH-CHI-02'];
  if (n.includes('angeles') || n.includes('lax') || n.includes('west')) return WAREHOUSE_IMAGES['WH-LAX-03'];
  if (n.includes('austin') || n.includes('atx') || n.includes('tech')) return WAREHOUSE_IMAGES['WH-ATX-04'];

  return {
    code: code || 'WH-NYC-01',
    name: name || 'Logistics Hub',
    imageUrl: DEFAULT_WAREHOUSE_IMAGE,
    locationDetail: 'Central Distribution Center',
  };
}

// React image onError event handler to guarantee zero broken image icons
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (!target.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
    target.src = DEFAULT_PRODUCT_IMAGE;
  }
};

export const handleWarehouseImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (!target.src.endsWith(DEFAULT_WAREHOUSE_IMAGE)) {
    target.src = DEFAULT_WAREHOUSE_IMAGE;
  }
};


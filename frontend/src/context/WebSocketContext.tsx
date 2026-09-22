import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { WSEventMessage } from '../types';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

interface WebSocketContextType {
  status: ConnectionStatus;
  lastEvent: WSEventMessage | null;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  reconnectNow: () => void;
  isItemHighlighted: (idKey: string) => boolean;
  highlightItem: (idKey: string) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<WSEventMessage | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [highlightedKeys, setHighlightedKeys] = useState<Record<string, boolean>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep latest 5

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const highlightItem = useCallback((idKey: string) => {
    setHighlightedKeys((prev) => ({ ...prev, [idKey]: true }));
    setTimeout(() => {
      setHighlightedKeys((prev) => {
        const next = { ...prev };
        delete next[idKey];
        return next;
      });
    }, 2000);
  }, []);

  const isItemHighlighted = useCallback(
    (idKey: string) => {
      return !!highlightedKeys[idKey];
    },
    [highlightedKeys]
  );

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus('reconnecting');
    
    // Determine WebSocket endpoint from VITE_WS_URL, VITE_API_URL, or local host
    let wsUrl: string;
    const envWs = (import.meta as any).env?.VITE_WS_URL;
    const envApi = (import.meta as any).env?.VITE_API_URL;

    if (envWs) {
      let url = String(envWs).trim().replace(/\/+$/, '');
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        const proto = window.location.protocol === 'http:' ? 'ws:' : 'wss:';
        url = `${proto}//${url.replace(/^https?:\/\//, '')}`;
      }
      if (!url.endsWith('/ws')) {
        url = `${url}/ws`;
      }
      wsUrl = url;
    } else if (envApi) {
      let clean = String(envApi).trim().replace(/\/+$/, '');
      if (clean.endsWith('/api')) {
        clean = clean.slice(0, -4);
      }
      const hostPart = clean.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
      const wsProto = clean.startsWith('http://') ? 'ws:' : 'wss:';
      wsUrl = `${wsProto}//${hostPart}/ws`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '5173' ? `${window.location.hostname}:8000` : window.location.host;
      wsUrl = `${protocol}//${host}/ws`;
    }

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus('connected');
        console.log('[StockFlow WS] Connected to live updates channel');

        // Setup 15s keepalive ping
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 15000);
      };

      socket.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;

          const parsed: WSEventMessage = JSON.parse(event.data);
          setLastEvent(parsed);

          // Dispatch to subscribers
          const handlers = listenersRef.current.get(parsed.event);
          if (handlers) {
            handlers.forEach((fn) => fn(parsed.data));
          }

          // Handle global toasts and highlights
          if (parsed.event === 'INVENTORY_UPDATED') {
            const data = parsed.data;
            const key = `inv-${data.product_id}-${data.warehouse_id}`;
            highlightItem(key);

            const isAdd = data.change > 0;
            addToast(
              isAdd ? 'success' : 'info',
              `Inventory ${isAdd ? 'Added' : 'Reduced'}`,
              `${data.product_name} in ${data.warehouse_name}: ${data.old_quantity} → ${data.new_quantity} (${isAdd ? '+' : ''}${data.change})`
            );
          } else if (parsed.event === 'STOCK_TRANSFERRED') {
            const data = parsed.data;
            highlightItem(`inv-${data.product_id}-${data.source_warehouse.id}`);
            highlightItem(`inv-${data.product_id}-${data.destination_warehouse.id}`);

            addToast(
              'info',
              'Stock Transferred',
              `Transferred ${data.quantity}x ${data.product_name} from ${data.source_warehouse.name} to ${data.destination_warehouse.name}`
            );
          } else if (parsed.event === 'ORDER_CREATED') {
            const data = parsed.data;
            highlightItem(`order-${data.id}`);

            addToast(
              'success',
              'New Order Placed',
              `${data.order_number} by ${data.customer_name} • $${data.total_amount.toFixed(2)} (${data.items_count} items)`
            );
          } else if (parsed.event === 'ORDER_STATUS_CHANGED') {
            const data = parsed.data;
            highlightItem(`order-${data.order_id}`);

            addToast(
              'warning',
              'Order Status Changed',
              `Order ${data.order_number} changed from ${data.old_status} to ${data.new_status}`
            );
          } else if (parsed.event === 'PRODUCT_CREATED' || parsed.event === 'PRODUCT_UPDATED') {
            addToast('info', 'Product Catalog Updated', `${parsed.data.name} (${parsed.data.sku})`);
          }
        } catch (err) {
          console.error('[StockFlow WS] Failed to parse message:', err);
        }
      };

      socket.onclose = () => {
        setStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Automatic reconnection attempt after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = (err) => {
        console.error('[StockFlow WS] Error:', err);
        socket.close();
      };
    } catch (e) {
      setStatus('disconnected');
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, [addToast, highlightItem]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const reconnectNow = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  return (
    <WebSocketContext.Provider
      value={{
        status,
        lastEvent,
        toasts,
        dismissToast,
        reconnectNow,
        isItemHighlighted,
        highlightItem,
        subscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

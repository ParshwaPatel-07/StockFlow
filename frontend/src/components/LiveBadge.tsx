import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { RefreshCw, WifiOff } from 'lucide-react';

export const LiveBadge: React.FC = () => {
  const { status, reconnectNow } = useWebSocket();

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-xs font-semibold tracking-wide shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
        <span className="text-[11px] font-bold">LIVE</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold tracking-wide shadow-2xs">
        <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
        <span className="text-[11px] font-medium">Reconnecting...</span>
      </div>
    );
  }

  return (
    <button
      onClick={reconnectNow}
      title="Click to reconnect WebSocket"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-xs font-semibold tracking-wide shadow-2xs transition-colors"
    >
      <WifiOff className="w-3 h-3 text-rose-500" />
      <span className="text-[11px]">Disconnected (Retry)</span>
    </button>
  );
};

import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useWebSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-sky-200';
        let bgColor = 'bg-white/95';
        let Icon = Info;
        let iconColor = 'text-sky-500';

        if (toast.type === 'success') {
          borderColor = 'border-emerald-200';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500';
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-200';
          Icon = AlertTriangle;
          iconColor = 'text-amber-500';
        } else if (toast.type === 'error') {
          borderColor = 'border-rose-200';
          Icon = AlertCircle;
          iconColor = 'text-rose-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-md shadow-lg shadow-slate-900/5 text-slate-800 transition-all duration-300 animate-slide-in-right`}
          >
            <Icon className={`w-5 h-5 ${iconColor} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">{toast.title}</h4>
                <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

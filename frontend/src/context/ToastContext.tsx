import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4000) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (message: string, title?: string, duration?: number) =>
      addToast('success', message, title || 'Success', duration),
    error: (message: string, title?: string, duration?: number) =>
      addToast('error', message, title || 'Error Notice', duration || 5000),
    info: (message: string, title?: string, duration?: number) =>
      addToast('info', message, title || 'Information', duration),
    warning: (message: string, title?: string, duration?: number) =>
      addToast('warning', message, title || 'Warning', duration),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => {
          let styles = {
            border: 'border-emerald-500/40 bg-slate-900 text-white',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
            badge: 'bg-emerald-500/20 text-emerald-300',
          };

          if (t.type === 'error') {
            styles = {
              border: 'border-rose-500/50 bg-slate-900 text-white',
              icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
              badge: 'bg-rose-500/20 text-rose-300',
            };
          } else if (t.type === 'warning') {
            styles = {
              border: 'border-amber-500/50 bg-slate-900 text-white',
              icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              badge: 'bg-amber-500/20 text-amber-300',
            };
          } else if (t.type === 'info') {
            styles = {
              border: 'border-sky-500/50 bg-slate-900 text-white',
              icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
              badge: 'bg-sky-500/20 text-sky-300',
            };
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-2xl p-4 shadow-2xl border ${styles.border} backdrop-blur-md animate-in slide-in-from-right duration-200 transition flex items-start gap-3 relative overflow-hidden`}
            >
              {styles.icon}

              <div className="flex-1 text-xs space-y-0.5">
                {t.title && (
                  <div className="font-extrabold text-sm tracking-tight text-white flex items-center justify-between">
                    <span>{t.title}</span>
                  </div>
                )}
                <p className="text-slate-300 font-medium leading-relaxed">{t.message}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

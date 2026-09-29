'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, WarningCircle, X, Info } from '@phosphor-icons/react';

const ToastContext = createContext({
  showToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container floating on top right */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-300 transform animate-in slide-in-from-top-2 ${
                isSuccess
                  ? 'bg-emerald-950/95 border-lime-400/50 text-emerald-100 shadow-lime-950/50'
                  : isError
                  ? 'bg-rose-950/95 border-rose-500/50 text-rose-100 shadow-rose-950/50'
                  : 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-slate-950/50'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle size={20} weight="fill" className="text-lime-400" />}
                {isError && <WarningCircle size={20} weight="fill" className="text-rose-400" />}
                {isInfo && <Info size={20} weight="fill" className="text-cyan-400" />}
              </div>
              <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-gray-400 hover:text-white transition p-0.5 rounded cursor-pointer"
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

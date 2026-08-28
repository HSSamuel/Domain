'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  // FIXED: Manage toasts as an array to prevent race conditions
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss the specific toast after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const theme = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]',
    error: 'bg-rose-50 text-rose-800 border-rose-200 shadow-[0_10px_40px_-10px_rgba(244,63,94,0.3)]',
    info: 'bg-indigo-50 text-indigo-800 border-indigo-200 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.3)]',
  };

  const icons = {
    success: <svg className="w-6 h-6 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
    error: <svg className="w-6 h-6 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info: <svg className="w-6 h-6 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Floating Animated Toast UI - Stacked */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-[90%] max-w-md pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-start sm:items-center gap-3 p-4 border-2 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-300 ${theme[toast.type]}`}
          >
            {icons[toast.type]}
            <p className="font-bold text-sm leading-snug flex-1">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors bg-white/50 rounded-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

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
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
    
    // Auto-dismiss the toast after 4.5 seconds
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4500);
  }, []);

  // Theme styling mapping for the sleek UI
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
      
      {/* Floating Animated Toast UI */}
      <div 
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out w-[90%] max-w-md ${
          toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'
        }`}
      >
        <div className={`flex items-start sm:items-center gap-3 p-4 border-2 rounded-2xl ${theme[toast.type]}`}>
          {icons[toast.type]}
          <p className="font-bold text-sm leading-snug flex-1">{toast.message}</p>
          <button 
            onClick={() => setToast(prev => ({ ...prev, visible: false }))}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors bg-white/50 rounded-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </ToastContext.Provider>
  );
};
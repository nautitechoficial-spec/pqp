import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function useToastInternalState() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((variant: ToastVariant, title: string, description?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    window.setTimeout(() => remove(id), 3500);
  }, [remove]);

  const api = useMemo<ToastApi>(() => ({
    success: (title, description) => push('success', title, description),
    error: (title, description) => push('error', title, description),
    warning: (title, description) => push('warning', title, description),
    info: (title, description) => push('info', title, description),
  }), [push]);

  return { toasts, api, remove };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, api, remove } = useToastInternalState();

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[200] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'pointer-events-auto min-w-[280px] max-w-[360px] rounded-2xl border bg-white shadow-lg p-3',
              t.variant === 'success' ? 'border-emerald-200' : '',
              t.variant === 'error' ? 'border-red-200' : '',
              t.variant === 'warning' ? 'border-amber-200' : '',
              t.variant === 'info' ? 'border-blue-200' : '',
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900">{t.title}</div>
                {t.description ? (
                  <div className="text-xs text-slate-600 mt-0.5">{t.description}</div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;

  // Fallback para não quebrar se o provider ainda não estiver ligado
  const fallback = (variant: ToastVariant, title: string, description?: string) => {
    console.log(`[toast:${variant}] ${title}${description ? ` - ${description}` : ''}`);
  };

  return {
    success: (title, description) => fallback('success', title, description),
    error: (title, description) => fallback('error', title, description),
    warning: (title, description) => fallback('warning', title, description),
    info: (title, description) => fallback('info', title, description),
  };
}

export default ToastContext;

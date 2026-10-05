import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 5000;
const EXIT_DURATION_MS = 350;

// Variant config — dark earthy theme
const variantStyles: Record<ToastVariant, { bar: string; border: string; bg: string; text: string }> = {
  success: {
    bar:    'bg-rescue-400',
    border: 'border-rescue-500/40',
    bg:     'bg-rescue-900/90',
    text:   'text-surface-50',
  },
  error: {
    bar:    'bg-red-500',
    border: 'border-red-500/40',
    bg:     'bg-red-950/90',
    text:   'text-surface-50',
  },
  warning: {
    bar:    'bg-amber-400',
    border: 'border-amber-400/40',
    bg:     'bg-amber-950/90',
    text:   'text-surface-50',
  },
  info: {
    bar:    'bg-blue-400',
    border: 'border-blue-400/30',
    bg:     'bg-blue-950/90',
    text:   'text-surface-50',
  },
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  switch (variant) {
    case 'success':
      return (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// ─── Individual Toast ───────────────────────────────────────────────────────

function Toast({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) {
  const { bar, border, bg, text } = variantStyles[toast.variant];
  const progressRef = useRef<HTMLDivElement>(null);

  // Shrink progress bar
  useEffect(() => {
    if (!progressRef.current) return;
    progressRef.current.style.transition = `width ${TOAST_DURATION_MS}ms linear`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (progressRef.current) progressRef.current.style.width = '0%';
      });
    });
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-glass-lg w-80 backdrop-blur-xl border ${bg} ${border} ${
        toast.exiting ? 'toast-exit' : 'toast-enter'
      }`}
    >
      {/* Progress bar */}
      <div
        ref={progressRef}
        className={`absolute bottom-0 left-0 h-[2px] w-full ${bar} rounded-full`}
        style={{ transition: 'none' }}
      />

      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="flex-shrink-0 leading-none mt-0.5">
          <ToastIcon variant={toast.variant} />
        </span>
        <p className={`text-sm font-600 flex-1 leading-snug ${text}`}>{toast.message}</p>
        <button
          onClick={() => onClose(toast.id)}
          aria-label="Dismiss notification"
          className="flex-shrink-0 text-rescue-600 hover:text-rescue-400 transition-colors mt-0.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Toast Container ────────────────────────────────────────────────────────

function ToastContainer({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5"
      id="toast-container"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_DURATION_MS);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

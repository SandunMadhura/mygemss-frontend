import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback(({ message, type = 'success', duration = 3000 }) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const remove = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <Toaster toasts={toasts} onRemove={remove} />
    </ToastCtx.Provider>
  );
}

// ─── Toaster (renders fixed portal of toasts) ─────────────────────────────────
function Toaster({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1rem',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: 'min(calc(100vw - 2rem), 360px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── Single Toast ─────────────────────────────────────────────────────────────
const TYPE_STYLES = {
  success: { icon: CheckCircle, iconColor: '#059669', bar: '#059669' },
  error:   { icon: AlertCircle,  iconColor: '#DC2626', bar: '#DC2626' },
  info:    { icon: CheckCircle,  iconColor: '#C5A059', bar: '#C5A059' },
};

function Toast({ toast, onRemove }) {
  const { icon: Icon, iconColor, bar } = TYPE_STYLES[toast.type] || TYPE_STYLES.info;

  return (
    <div
      role="status"
      style={{
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        background: '#FAFAFA',
        border: '1px solid #e5e7eb',
        borderLeft: `4px solid ${bar}`,
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        animation: 'toast-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#111827',
        minWidth: '220px',
      }}
    >
      <Icon size={18} style={{ color: iconColor, flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.1rem',
          color: '#9CA3AF',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

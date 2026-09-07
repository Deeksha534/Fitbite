import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
    warning: (msg, duration) => addToast('warning', msg, duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} animate-slideDown`}>
            <div className="toast-icon">
              {t.type === 'success' && <CheckCircle2 size={18} />}
              {t.type === 'error' && <AlertCircle size={18} />}
              {t.type === 'warning' && <AlertTriangle size={18} />}
              {t.type === 'info' && <Info size={18} />}
            </div>
            <div className="toast-message">{t.message}</div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          top: var(--space-6);
          right: var(--space-6);
          z-index: var(--z-toast);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-width: 400px;
          width: calc(100% - var(--space-12));
          pointer-events: none;
        }

        .toast {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--color-border);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          line-height: var(--line-height-normal);
        }

        .toast-success {
          border-left: 4px solid var(--color-success);
          color: var(--color-espresso);
        }
        .toast-success .toast-icon {
          color: var(--color-success);
        }

        .toast-error {
          border-left: 4px solid var(--color-danger);
          color: var(--color-espresso);
        }
        .toast-error .toast-icon {
          color: var(--color-danger);
        }

        .toast-warning {
          border-left: 4px solid var(--color-warning);
          color: var(--color-espresso);
        }
        .toast-warning .toast-icon {
          color: var(--color-warning);
        }

        .toast-info {
          border-left: 4px solid var(--color-info);
          color: var(--color-espresso);
        }
        .toast-info .toast-icon {
          color: var(--color-info);
        }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          word-break: break-word;
        }

        .toast-close {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-subtle);
          padding: var(--space-1);
          border-radius: var(--radius-xs);
          transition: color var(--transition-fast), background-color var(--transition-fast);
        }

        .toast-close:hover {
          color: var(--color-espresso);
          background-color: var(--color-cream-subtle);
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;

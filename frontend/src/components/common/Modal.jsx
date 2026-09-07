import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Accessible Modal Dialog Component
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-root animate-fadeIn">
      <div
        className="modal-backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div className={`modal-container modal-size-${size} animate-slideUp`} role="dialog" aria-modal="true">
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>

      <style>{`
        .modal-root {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: var(--z-modal-backdrop);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }

        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(30, 18, 13, 0.65);
          backdrop-filter: blur(4px);
        }

        .modal-container {
          position: relative;
          z-index: var(--z-modal);
          width: 100%;
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-2xl);
          border: 1px solid var(--color-border);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-size-sm {
          max-width: 420px;
        }
        .modal-size-md {
          max-width: 560px;
        }
        .modal-size-lg {
          max-width: 760px;
        }
        .modal-size-xl {
          max-width: 980px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-border-subtle);
          background: var(--color-cream-subtle);
        }

        .modal-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .modal-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-subtle);
          padding: var(--space-1);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .modal-close-btn:hover {
          color: var(--color-espresso);
          background: var(--color-cream-dark);
        }

        .modal-body {
          padding: var(--space-6);
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-6);
          border-top: 1px solid var(--color-border-subtle);
          background: var(--color-cream-subtle);
        }
      `}</style>
    </div>
  );
};

export default Modal;

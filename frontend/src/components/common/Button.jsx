import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable FitBite Button Component
 * Supports variants: 'primary', 'secondary', 'outline', 'ghost', 'danger', 'espresso'
 * Supports sizes: 'sm', 'md', 'lg'
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={`fitbite-btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={isButtonDisabled}
      onClick={onClick}
      {...props}
    >
      {isLoading && <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="btn-spinner animate-spin" />}
      {!isLoading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
      <span className="btn-content">{children}</span>
      {!isLoading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}

      <style>{`
        .fitbite-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          font-family: var(--font-heading);
          font-weight: var(--font-weight-semibold);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        /* --- Sizes --- */
        .btn-sm {
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-xs);
          border-radius: var(--radius-md);
        }
        .btn-md {
          padding: var(--space-3) var(--space-5);
          font-size: var(--font-size-sm);
        }
        .btn-lg {
          padding: var(--space-4) var(--space-8);
          font-size: var(--font-size-base);
        }
        .btn-full {
          width: 100%;
        }

        /* --- Variants --- */
        .btn-primary {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
          color: var(--color-text-inverse);
          box-shadow: 0 4px 12px rgba(200, 122, 62, 0.25);
          border: 1px solid transparent;
        }
        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary-dark) 100%);
          box-shadow: 0 6px 16px rgba(200, 122, 62, 0.35);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: var(--color-cream-subtle);
          color: var(--color-espresso);
          border: 1px solid var(--color-border);
        }
        .btn-secondary:hover:not(:disabled) {
          background: var(--color-cream-dark);
          border-color: var(--color-primary-light);
          transform: translateY(-1px);
        }

        .btn-outline {
          background: transparent;
          color: var(--color-primary);
          border: 1.5px solid var(--color-primary);
        }
        .btn-outline:hover:not(:disabled) {
          background: var(--color-primary-light);
          transform: translateY(-1px);
        }

        .btn-ghost {
          background: transparent;
          color: var(--color-espresso);
        }
        .btn-ghost:hover:not(:disabled) {
          background: var(--color-cream-subtle);
          color: var(--color-primary);
        }

        .btn-espresso {
          background: var(--color-espresso);
          color: var(--color-cream);
          border: 1px solid var(--color-espresso-light);
        }
        .btn-espresso:hover:not(:disabled) {
          background: var(--color-espresso-light);
          transform: translateY(-1px);
        }

        .btn-danger {
          background: var(--color-danger);
          color: var(--color-text-inverse);
        }
        .btn-danger:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .fitbite-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .btn-spinner {
          flex-shrink: 0;
        }
      `}</style>
    </button>
  );
};

export default Button;

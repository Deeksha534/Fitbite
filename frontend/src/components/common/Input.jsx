import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable Form Input / Textarea Component
 */
export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      multiline = false,
      rows = 4,
      className = '',
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`fitbite-input-group ${error ? 'has-error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {required && <span className="required-star">*</span>}
          </label>
        )}

        <div className="input-wrapper">
          {leftIcon && <span className="input-icon-left">{leftIcon}</span>}

          {multiline ? (
            <textarea
              id={inputId}
              ref={ref}
              rows={rows}
              disabled={disabled}
              className={`input-field input-textarea ${leftIcon ? 'with-left-icon' : ''} ${
                rightIcon ? 'with-right-icon' : ''
              }`}
              {...props}
            />
          ) : (
            <input
              id={inputId}
              ref={ref}
              disabled={disabled}
              className={`input-field ${leftIcon ? 'with-left-icon' : ''} ${
                rightIcon ? 'with-right-icon' : ''
              }`}
              {...props}
            />
          )}

          {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
        </div>

        {error && (
          <div className="input-error-msg animate-fadeIn">
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}

        {!error && helperText && <p className="input-helper-msg">{helperText}</p>}

        <style>{`
          .fitbite-input-group {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
            width: 100%;
          }

          .input-label {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
            color: var(--color-espresso);
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .required-star {
            color: var(--color-danger);
            margin-left: var(--space-1);
          }

          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
          }

          .input-field {
            width: 100%;
            padding: var(--space-3) var(--space-4);
            font-size: var(--font-size-sm);
            color: var(--color-text-main);
            background: var(--color-bg-card);
            border: 1.5px solid var(--color-border);
            border-radius: var(--radius-lg);
            transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
          }

          .input-field:focus {
            border-color: var(--color-border-focus);
            box-shadow: 0 0 0 3px rgba(200, 122, 62, 0.15);
          }

          .input-field::placeholder {
            color: var(--color-text-subtle);
          }

          .input-field:disabled {
            background: var(--color-cream-subtle);
            color: var(--color-text-subtle);
            cursor: not-allowed;
          }

          .input-textarea {
            resize: vertical;
            min-height: 80px;
          }

          .with-left-icon {
            padding-left: 2.5rem;
          }

          .with-right-icon {
            padding-right: 2.5rem;
          }

          .input-icon-left {
            position: absolute;
            left: 0.875rem;
            display: flex;
            align-items: center;
            color: var(--color-text-subtle);
            pointer-events: none;
          }

          .input-icon-right {
            position: absolute;
            right: 0.875rem;
            display: flex;
            align-items: center;
            color: var(--color-text-subtle);
          }

          .has-error .input-field {
            border-color: var(--color-danger);
            background: rgba(220, 38, 38, 0.02);
          }

          .has-error .input-field:focus {
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
          }

          .input-error-msg {
            display: flex;
            align-items: center;
            gap: var(--space-1);
            color: var(--color-danger);
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium);
            margin-top: 2px;
          }

          .input-helper-msg {
            color: var(--color-text-muted);
            font-size: var(--font-size-xs);
            margin-top: 2px;
          }
        `}</style>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Loading Spinner Component
 */
export const Spinner = ({
  size = 'md',
  color = 'primary',
  centered = false,
  label = '',
  className = '',
}) => {
  const pixelSizes = {
    sm: 16,
    md: 24,
    lg: 36,
    xl: 48,
  };

  const spinnerElement = (
    <div className={`fitbite-spinner-wrap ${className}`}>
      <Loader2
        size={pixelSizes[size] || 24}
        className={`spinner-icon spinner-${color} animate-spin`}
      />
      {label && <span className="spinner-label">{label}</span>}

      <style>{`
        .fitbite-spinner-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }

        .spinner-primary {
          color: var(--color-primary);
        }

        .spinner-espresso {
          color: var(--color-espresso);
        }

        .spinner-white {
          color: #ffffff;
        }

        .spinner-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );

  if (centered) {
    return (
      <div className="spinner-centered-container">
        {spinnerElement}
        <style>{`
          .spinner-centered-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            width: 100%;
            padding: var(--space-8);
          }
        `}</style>
      </div>
    );
  }

  return spinnerElement;
};

export default Spinner;

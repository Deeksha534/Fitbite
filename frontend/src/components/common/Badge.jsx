import React from 'react';

/**
 * Reusable Pill / Badge Component
 */
export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  return (
    <span className={`fitbite-badge badge-${variant} badge-${size} ${className}`} {...props}>
      {dot && <span className="badge-dot" />}
      <span className="badge-text">{children}</span>

      <style>{`
        .fitbite-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-heading);
          font-weight: var(--font-weight-semibold);
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          vertical-align: middle;
        }

        .badge-sm {
          padding: 0.15rem 0.5rem;
          font-size: 0.65rem;
        }

        .badge-md {
          padding: 0.25rem 0.75rem;
          font-size: var(--font-size-xs);
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: var(--radius-full);
          background-color: currentColor;
        }

        /* --- Variants --- */
        .badge-primary {
          background-color: var(--color-primary-light);
          color: var(--color-primary-dark);
          border: 1px solid var(--color-primary-subtle);
        }

        .badge-espresso {
          background-color: var(--color-espresso);
          color: var(--color-cream);
        }

        .badge-success {
          background-color: var(--color-success-bg);
          color: var(--color-success);
          border: 1px solid var(--color-success-border);
        }

        .badge-danger {
          background-color: var(--color-danger-bg);
          color: var(--color-danger);
          border: 1px solid var(--color-danger-border);
        }

        .badge-warning {
          background-color: var(--color-warning-bg);
          color: var(--color-warning);
          border: 1px solid var(--color-warning-border);
        }

        .badge-info {
          background-color: var(--color-info-bg);
          color: var(--color-info);
          border: 1px solid var(--color-info-border);
        }

        .badge-cream {
          background-color: var(--color-cream-subtle);
          color: var(--color-espresso);
          border: 1px solid var(--color-border);
        }
      `}</style>
    </span>
  );
};

export default Badge;

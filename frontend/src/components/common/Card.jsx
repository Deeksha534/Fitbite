import React from 'react';

/**
 * Reusable Card Container Component
 */
export const Card = ({
  children,
  glass = false,
  hoverable = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  return (
    <div
      className={`fitbite-card card-pad-${padding} ${glass ? 'card-glass' : 'card-solid'} ${
        hoverable ? 'card-hoverable' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}

      <style>{`
        .fitbite-card {
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          position: relative;
          overflow: hidden;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
        }

        .card-solid {
          background: var(--color-bg-card);
          box-shadow: var(--shadow-sm);
        }

        .card-glass {
          background: var(--glass-bg-card);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-color: var(--glass-border);
          box-shadow: var(--shadow-glass);
        }

        .card-hoverable {
          cursor: pointer;
        }

        .card-hoverable:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
          border-color: var(--color-primary-light);
        }

        .card-pad-none {
          padding: 0;
        }
        .card-pad-sm {
          padding: var(--space-3);
        }
        .card-pad-md {
          padding: var(--space-5);
        }
        .card-pad-lg {
          padding: var(--space-8);
        }
      `}</style>
    </div>
  );
};

export default Card;

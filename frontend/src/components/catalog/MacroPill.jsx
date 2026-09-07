import React from 'react';
import { Zap, ShieldCheck, Heart, Flame } from 'lucide-react';

/**
 * Reusable Macro Indicator Pill for Protein, Fiber, Sugar, and Calories
 */
export const MacroPill = ({
  type = 'protein',
  value,
  unit = 'g',
  label,
  size = 'md',
  className = '',
}) => {
  if (value === undefined || value === null) return null;

  const config = {
    protein: {
      defaultLabel: 'Protein',
      icon: Zap,
      bg: 'var(--color-primary-light)',
      color: 'var(--color-primary-dark)',
      border: 'var(--color-primary-subtle)',
    },
    fiber: {
      defaultLabel: 'Fiber',
      icon: Heart,
      bg: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      border: 'var(--color-warning-border)',
    },
    sugar: {
      defaultLabel: 'Added Sugar',
      icon: ShieldCheck,
      bg: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      border: 'var(--color-success-border)',
    },
    calories: {
      defaultLabel: 'Calories',
      icon: Flame,
      bg: 'var(--color-cream-subtle)',
      color: 'var(--color-espresso)',
      border: 'var(--color-border)',
    },
  };

  const current = config[type] || config.protein;
  const Icon = current.icon;
  const displayLabel = label || current.defaultLabel;

  return (
    <div
      className={`macro-pill macro-pill-${size} ${className}`}
      style={{
        backgroundColor: current.bg,
        color: current.color,
        borderColor: current.border,
      }}
    >
      <Icon size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className="macro-pill-icon" />
      <span className="macro-pill-val">
        {value}
        {unit}
      </span>
      <span className="macro-pill-label">{displayLabel}</span>

      <style>{`
        .macro-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: var(--radius-full);
          border: 1px solid;
          font-family: var(--font-heading);
          font-weight: var(--font-weight-semibold);
          white-space: nowrap;
          line-height: 1;
        }

        .macro-pill-sm {
          padding: 0.2rem 0.55rem;
          font-size: 0.65rem;
        }

        .macro-pill-md {
          padding: 0.3rem 0.75rem;
          font-size: var(--font-size-xs);
        }

        .macro-pill-lg {
          padding: 0.45rem 1rem;
          font-size: var(--font-size-sm);
        }

        .macro-pill-val {
          font-weight: var(--font-weight-bold);
        }

        .macro-pill-label {
          opacity: 0.85;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};

export default MacroPill;

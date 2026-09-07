import React from 'react';
import { Star } from 'lucide-react';

/**
 * Reusable Star Rating Component (Display & Interactive Picker)
 */
export const RatingStars = ({
  rating = 0,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange = null,
  showScore = false,
  className = '',
}) => {
  const pixelSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const currentPixelSize = pixelSizes[size] || 18;

  return (
    <div className={`rating-stars-root ${className}`}>
      <div className="stars-row">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = rating >= starValue;
          const isHalf = !isFilled && rating >= starValue - 0.5;

          return (
            <button
              key={starValue}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              className={`star-btn ${interactive ? 'star-interactive' : ''}`}
              aria-label={`${starValue} stars`}
            >
              <Star
                size={currentPixelSize}
                className={`star-icon ${isFilled ? 'star-filled' : isHalf ? 'star-half' : 'star-empty'}`}
              />
            </button>
          );
        })}
      </div>

      {showScore && <span className="rating-score">{Number(rating).toFixed(1)}</span>}

      <style>{`
        .rating-stars-root {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
        }

        .stars-row {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .star-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: none;
          border: none;
          cursor: default;
        }

        .star-interactive {
          cursor: pointer;
          transition: transform var(--transition-fast);
        }

        .star-interactive:hover {
          transform: scale(1.2);
        }

        .star-icon {
          transition: fill var(--transition-fast), color var(--transition-fast);
        }

        .star-filled {
          color: #f59e0b;
          fill: #f59e0b;
        }

        .star-half {
          color: #f59e0b;
          fill: url(#halfStarGradient);
        }

        .star-empty {
          color: var(--color-border);
          fill: transparent;
        }

        .rating-score {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }
      `}</style>
    </div>
  );
};

export default RatingStars;

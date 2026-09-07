import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, User } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

/**
 * Empty Wishlist Visual State Component
 */
export const EmptyWishlist = ({ isAuthenticated = false }) => {
  return (
    <Card padding="xl" className="empty-wishlist-card glass-panel">
      <div className="empty-wishlist-icon-circle">
        <Heart size={44} className="empty-wishlist-icon" />
      </div>

      <h2 className="empty-title">Your Wishlist is Empty</h2>

      <p className="empty-description">
        Explore our clean performance fuel formulas and tap the heart icon on any flavor to save it for quick ordering later.
      </p>

      <div className="empty-actions">
        <Link to="/products">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
            Explore Flavor Catalog
          </Button>
        </Link>

        {!isAuthenticated && (
          <Link to="/login" state={{ from: '/wishlist' }}>
            <Button variant="secondary" size="lg" leftIcon={<User size={16} />}>
              Sign In to View Saved Flavors
            </Button>
          </Link>
        )}
      </div>

      <style>{`
        .empty-wishlist-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-12) var(--space-6);
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
        }

        .empty-wishlist-icon-circle {
          width: 88px;
          height: 88px;
          border-radius: var(--radius-full);
          background: rgba(220, 38, 38, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-6);
        }

        .empty-wishlist-icon {
          color: var(--color-danger);
        }

        .empty-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          margin-bottom: var(--space-3);
        }

        .empty-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          max-width: 440px;
          margin-bottom: var(--space-8);
        }

        .empty-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
          justify-content: center;
        }
      `}</style>
    </Card>
  );
};

export default EmptyWishlist;

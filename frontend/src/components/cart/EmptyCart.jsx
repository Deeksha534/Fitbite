import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, User, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

/**
 * Empty Cart Visual State Component
 */
export const EmptyCart = ({ isAuthenticated = false }) => {
  return (
    <Card padding="xl" className="empty-cart-card glass-panel">
      <div className="empty-icon-circle">
        <ShoppingBag size={44} className="empty-icon" />
      </div>

      <h2 className="empty-title">Your FitBite Cart is Empty</h2>

      <p className="empty-description">
        You don't have any performance fuel in your cart yet. Discover our gourmet whey isolate bars, crafted with zero added sugar and prebiotic fiber.
      </p>

      <div className="empty-actions">
        <Link to="/products">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
            Explore All Flavors
          </Button>
        </Link>

        {!isAuthenticated && (
          <Link to="/login" state={{ from: '/cart' }}>
            <Button variant="secondary" size="lg" leftIcon={<User size={16} />}>
              Sign In to View Saved Cart
            </Button>
          </Link>
        )}
      </div>

      <div className="empty-perks">
        <div className="perk-item">
          <Sparkles size={16} className="perk-icon" />
          <span>Free shipping on all orders above ₹500</span>
        </div>
      </div>

      <style>{`
        .empty-cart-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-12) var(--space-6);
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
        }

        .empty-icon-circle {
          width: 88px;
          height: 88px;
          border-radius: var(--radius-full);
          background: var(--color-primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-6);
        }

        .empty-icon {
          color: var(--color-primary);
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
          margin-bottom: var(--space-8);
        }

        .empty-perks {
          padding-top: var(--space-6);
          border-top: 1px dashed var(--color-border-subtle);
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .perk-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .perk-icon {
          color: var(--color-primary);
        }
      `}</style>
    </Card>
  );
};

export default EmptyCart;

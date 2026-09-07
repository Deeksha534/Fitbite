import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Package,
  ShoppingBag,
  Heart,
  MapPin,
  Star,
  TrendingUp,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';

export const AccountSummaryWidget = () => {
  const { fetchSummary, summary } = useAuth();
  const [loading, setLoading] = useState(!summary);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      await fetchSummary();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading && !summary) {
    return (
      <div className="summary-loading-box">
        <Spinner size="md" color="primary" />
        <span>Loading account overview metrics...</span>
      </div>
    );
  }

  const orders = summary?.orders || {};
  const addresses = summary?.addresses || {};
  const cart = summary?.cart || {};
  const wishlist = summary?.wishlist || {};
  const reviews = summary?.reviews || {};

  return (
    <div className="summary-widget-content animate-fadeIn">
      <div className="tab-header flex-between">
        <div>
          <h2 className="tab-title">Account Activity & Metrics</h2>
          <p className="tab-subtitle">
            Live overview of your orders, saved addresses, and active activity.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => loadMetrics(true)}
          isLoading={refreshing}
          leftIcon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
        >
          Refresh
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        {/* Total Orders */}
        <Card glass padding="md" className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-primary">
              <Package size={20} />
            </div>
            <span className="metric-tag">Orders</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{orders.total_orders || 0}</span>
            <span className="metric-label">Completed Orders</span>
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">
              Lifetime Spend: <strong>{formatCurrency(orders.total_spent)}</strong>
            </span>
          </div>
        </Card>

        {/* Active Orders */}
        <Card glass padding="md" className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-amber">
              <Clock size={20} />
            </div>
            <span className="metric-tag">Active</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{orders.active_orders || 0}</span>
            <span className="metric-label">In-Transit Shipments</span>
          </div>
          <div className="metric-footer">
            <Link to="/track" className="metric-link">
              <span>Track Orders</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </Card>

        {/* Saved Addresses */}
        <Card glass padding="md" className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-espresso">
              <MapPin size={20} />
            </div>
            <span className="metric-tag">Delivery</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{addresses.saved_addresses || 0}</span>
            <span className="metric-label">Saved Addresses</span>
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">Express Delivery Ready</span>
          </div>
        </Card>

        {/* Shopping Cart Items */}
        <Card glass padding="md" className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-primary">
              <ShoppingBag size={20} />
            </div>
            <span className="metric-tag">Cart</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{cart.total_items || 0}</span>
            <span className="metric-label">Items in Cart</span>
          </div>
          <div className="metric-footer">
            <Link to="/cart" className="metric-link">
              <span>View Cart</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </Card>

        {/* Saved Wishlist Items */}
        <Card glass padding="md" className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-danger">
              <Heart size={20} />
            </div>
            <span className="metric-tag">Wishlist</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{wishlist.total_items || 0}</span>
            <span className="metric-label">Saved Favorites</span>
          </div>
          <div className="metric-footer">
            <Link to="/wishlist" className="metric-link">
              <span>View Wishlist</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </Card>

        {/* Reviews Submitted */}
        <Card glass padding="md" className="metric-card">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-amber">
              <Star size={20} />
            </div>
            <span className="metric-tag">Feedback</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{reviews.total_submitted || 0}</span>
            <span className="metric-label">Product Reviews</span>
          </div>
          <div className="metric-footer">
            <span className="metric-subtext">Verified Athlete Feedback</span>
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation Links */}
      <div className="quick-actions-bar">
        <Link to="/products">
          <Button variant="primary" size="md" leftIcon={<ShoppingBag size={16} />}>
            Explore Protein Store
          </Button>
        </Link>
        <Link to="/account/orders">
          <Button variant="secondary" size="md" leftIcon={<Package size={16} />}>
            View All Order Invoices
          </Button>
        </Link>
      </div>

      <style>{`
        .summary-widget-content {
          padding: var(--space-4) 0;
        }

        .summary-loading-box {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-8);
          justify-content: center;
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
        }

        .tab-header {
          margin-bottom: var(--space-6);
        }

        .tab-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: var(--space-1);
        }

        .tab-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
          margin-bottom: var(--space-8);
        }

        @media (min-width: 640px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .metric-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid var(--color-border);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .metric-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }

        .metric-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-primary {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }

        .icon-amber {
          background: var(--color-amber-light);
          color: var(--color-amber-dark);
        }

        .icon-espresso {
          background: var(--color-cream-subtle);
          color: var(--color-espresso);
          border: 1px solid var(--color-border);
        }

        .icon-danger {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }

        .metric-tag {
          font-size: 0.65rem;
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          color: var(--color-text-subtle);
          letter-spacing: 0.05em;
        }

        .metric-body {
          margin-bottom: var(--space-3);
        }

        .metric-value {
          display: block;
          font-family: var(--font-heading);
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1;
          margin-bottom: var(--space-1);
        }

        .metric-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          font-weight: var(--font-weight-medium);
        }

        .metric-footer {
          padding-top: var(--space-2);
          border-top: 1px solid var(--color-border-subtle);
        }

        .metric-subtext {
          font-size: 0.72rem;
          color: var(--color-text-subtle);
        }

        .metric-subtext strong {
          color: var(--color-espresso);
        }

        .metric-link {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 0.75rem;
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
          transition: color var(--transition-fast);
        }

        .metric-link:hover {
          color: var(--color-primary-hover);
          text-decoration: underline;
        }

        .quick-actions-bar {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
};

export default AccountSummaryWidget;

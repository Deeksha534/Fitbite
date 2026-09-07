import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Truck, MapPin, PhoneCall } from 'lucide-react';

/**
 * TopBar Announcement & Utility Bar Component
 */
export const TopBar = () => {
  return (
    <div className="fitbite-topbar">
      <div className="container flex-between topbar-content">
        <div className="topbar-left">
          <span className="topbar-badge">
            <Sparkles size={12} /> Special Offer
          </span>
          <span className="topbar-text">
            Use code <strong className="code-highlight">FITBITE20</strong> for 20% off your first order!
          </span>
        </div>

        <div className="topbar-right">
          <div className="topbar-item">
            <Truck size={13} />
            <span>Free Shipping over ₹500</span>
          </div>
          <span className="topbar-divider" />
          <Link to="/track" className="topbar-link">
            <MapPin size={13} />
            <span>Track Order</span>
          </Link>
          <span className="topbar-divider" />
          <Link to="/support" className="topbar-link">
            <PhoneCall size={13} />
            <span>Support</span>
          </Link>
        </div>
      </div>

      <style>{`
        .fitbite-topbar {
          background-color: var(--color-espresso);
          color: var(--color-cream);
          font-size: var(--font-size-xs);
          padding: 0.4rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          z-index: calc(var(--z-sticky) + 1);
        }

        .topbar-content {
          gap: var(--space-4);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .topbar-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(200, 122, 62, 0.35);
          color: #fcd34d;
          font-weight: var(--font-weight-bold);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(252, 211, 77, 0.3);
        }

        .code-highlight {
          color: #fcd34d;
          letter-spacing: 0.05em;
        }

        .topbar-right {
          display: none;
          align-items: center;
          gap: var(--space-3);
          color: var(--color-text-subtle);
        }

        @media (min-width: 768px) {
          .topbar-right {
            display: flex;
          }
        }

        .topbar-item,
        .topbar-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: rgba(253, 251, 247, 0.8);
          transition: color var(--transition-fast);
        }

        .topbar-link:hover {
          color: var(--color-primary-light);
        }

        .topbar-divider {
          width: 1px;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default TopBar;

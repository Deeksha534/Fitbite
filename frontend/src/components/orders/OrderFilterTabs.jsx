import React from 'react';

/**
 * OrderFilterTabs Component
 * Provides clean pill-style tabs to filter orders by lifecycle status.
 *
 * @param {Object} props
 * @param {string} props.activeFilter - Current active filter key ('all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled')
 * @param {Function} props.onFilterChange - Callback when filter changes
 * @param {Object} [props.counts] - Optional object with counts per status
 */
export const OrderFilterTabs = ({ activeFilter = 'all', onFilterChange, counts = {} }) => {
  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Processing' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="order-filter-tabs-root" role="tablist" aria-label="Order status filters">
      <div className="order-filter-tabs-scroll">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          const count = counts[tab.key];

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`order-filter-pill ${isActive ? 'is-active' : ''}`}
              onClick={() => onFilterChange(tab.key)}
            >
              <span>{tab.label}</span>
              {typeof count === 'number' && count > 0 && (
                <span className="order-filter-badge">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        .order-filter-tabs-root {
          margin-bottom: 24px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 12px;
        }

        .order-filter-tabs-scroll {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding: 2px;
        }

        .order-filter-tabs-scroll::-webkit-scrollbar {
          display: none;
        }

        .order-filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.05);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .order-filter-pill:hover {
          color: var(--color-text-primary);
          background: rgba(var(--color-primary-rgb, 200, 122, 62), 0.1);
          border-color: var(--color-primary-light, #c87a3e);
        }

        .order-filter-pill.is-active {
          background: var(--color-primary, #c87a3e);
          color: #ffffff;
          border-color: var(--color-primary, #c87a3e);
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(200, 122, 62, 0.25);
        }

        .order-filter-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.2);
          color: inherit;
        }

        .order-filter-pill.is-active .order-filter-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default OrderFilterTabs;

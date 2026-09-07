import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, RotateCcw, ChevronDown, Check } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';

/**
 * Filter Sidebar & Search Toolbar Component
 * Supports search debounce (350ms), category pills/lists, min/max price, flavor filtering, and sort options.
 */
export const ProductFilters = ({
  filters = {},
  categories = [],
  onChange,
  onReset,
  totalResults = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState(filters.min_price || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.max_price || '');

  // Synchronize internal search state if filters.search changes externally (e.g., URL sync / reset)
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    setMinPriceInput(filters.min_price || '');
  }, [filters.min_price]);

  useEffect(() => {
    setMaxPriceInput(filters.max_price || '');
  }, [filters.max_price]);

  // 350ms Debounced search handler
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onChange({ ...filters, search: searchTerm, page: 1 });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleCategorySelect = (categoryId) => {
    const newCategory = filters.category_id === categoryId ? '' : categoryId;
    onChange({ ...filters, category_id: newCategory, page: 1 });
  };

  const handlePriceApply = () => {
    onChange({
      ...filters,
      min_price: minPriceInput ? Number(minPriceInput) : '',
      max_price: maxPriceInput ? Number(maxPriceInput) : '',
      page: 1,
    });
  };

  const handleSortChange = (e) => {
    onChange({ ...filters, sort: e.target.value, page: 1 });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.category_id) ||
    Boolean(filters.min_price) ||
    Boolean(filters.max_price) ||
    Boolean(filters.flavor) ||
    (Boolean(filters.sort) && filters.sort !== 'featured');

  return (
    <div className="product-filters-root">
      {/* Top Search & Mobile Filter Toggle Bar */}
      <div className="filters-top-bar">
        <div className="search-input-wrap">
          <Input
            placeholder="Search protein bars, flavors, or nutrients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
            rightIcon={
              searchTerm ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null
            }
          />
        </div>

        <div className="sort-and-mobile-wrap">
          <div className="sort-dropdown-wrap">
            <select
              value={filters.sort || 'featured'}
              onChange={handleSortChange}
              className="sort-select"
              aria-label="Sort products"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="calories_asc">Calories: Low to High</option>
              <option value="calories_desc">Calories: High to Low</option>
            </select>
          </div>

          <button
            type="button"
            className="mobile-filter-toggle-btn"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open filter menu"
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
            {hasActiveFilters && <span className="active-dot" />}
          </button>
        </div>
      </div>

      {/* Category Pills Quick Bar (Horizontal for Desktop & Mobile) */}
      <div className="category-pills-bar">
        <button
          type="button"
          className={`category-pill ${!filters.category_id ? 'pill-active' : ''}`}
          onClick={() => handleCategorySelect('')}
        >
          All Flavors
        </button>

        {categories.map((cat) => {
          const isSelected = filters.category_id === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${isSelected ? 'pill-active' : ''}`}
              onClick={() => handleCategorySelect(cat.id)}
            >
              {cat.name}
              {cat.product_count !== undefined && (
                <span className="cat-count">{cat.product_count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Filter Chips Row */}
      {hasActiveFilters && (
        <div className="active-filter-chips">
          <span className="chips-label">Active Filters:</span>

          {filters.search && (
            <Badge variant="primary" size="sm" className="filter-chip">
              Search: "{filters.search}"
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Remove search filter"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {filters.category_id && (
            <Badge variant="espresso" size="sm" className="filter-chip">
              Category: {categories.find((c) => c.id === filters.category_id)?.name || 'Selected'}
              <button
                type="button"
                onClick={() => handleCategorySelect('')}
                aria-label="Remove category filter"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {(filters.min_price || filters.max_price) && (
            <Badge variant="cream" size="sm" className="filter-chip">
              Price: ₹{filters.min_price || 0} - ₹{filters.max_price || 'Any'}
              <button
                type="button"
                onClick={() => {
                  setMinPriceInput('');
                  setMaxPriceInput('');
                  onChange({ ...filters, min_price: '', max_price: '', page: 1 });
                }}
                aria-label="Remove price filter"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={12} />}
            onClick={onReset}
            className="reset-all-btn"
          >
            Reset All
          </Button>
        </div>
      )}

      {/* Mobile Filters Slide-over / Modal */}
      {isMobileOpen && (
        <div className="mobile-filter-drawer-root">
          <div
            className="drawer-backdrop"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="drawer-panel animate-slideUp">
            <div className="drawer-header">
              <h3 className="drawer-title">Filter Products</h3>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setIsMobileOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-content">
              {/* Category Section */}
              <div className="drawer-section">
                <h4 className="drawer-section-title">Categories</h4>
                <div className="drawer-category-list">
                  <label className="drawer-radio-label">
                    <input
                      type="radio"
                      name="mobile_category"
                      checked={!filters.category_id}
                      onChange={() => handleCategorySelect('')}
                    />
                    <span>All Products</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="drawer-radio-label">
                      <input
                        type="radio"
                        name="mobile_category"
                        checked={filters.category_id === cat.id}
                        onChange={() => handleCategorySelect(cat.id)}
                      />
                      <span>{cat.name}</span>
                      {cat.product_count !== undefined && (
                        <span className="drawer-count">({cat.product_count})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Section */}
              <div className="drawer-section">
                <h4 className="drawer-section-title">Price Range (₹)</h4>
                <div className="price-inputs-row">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="price-box"
                  />
                  <span className="price-sep">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="price-box"
                  />
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onReset();
                  setMinPriceInput('');
                  setMaxPriceInput('');
                  setIsMobileOpen(false);
                }}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  handlePriceApply();
                  setIsMobileOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .product-filters-root {
          margin-bottom: var(--space-8);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .filters-top-bar {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        @media (min-width: 768px) {
          .filters-top-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .search-input-wrap {
          flex: 1;
          max-width: 540px;
        }

        .search-clear-btn {
          background: none;
          border: none;
          color: var(--color-text-subtle);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .search-clear-btn:hover {
          color: var(--color-espresso);
        }

        .sort-and-mobile-wrap {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .sort-dropdown-wrap {
          position: relative;
        }

        .sort-select {
          padding: var(--space-3) var(--space-4);
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-espresso);
          background: var(--color-bg-card);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .sort-select:focus {
          border-color: var(--color-primary);
        }

        .mobile-filter-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-card);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          cursor: pointer;
          position: relative;
        }

        @media (min-width: 1024px) {
          .mobile-filter-toggle-btn {
            display: none;
          }
        }

        .active-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
          background: var(--color-primary);
        }

        .category-pills-bar {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: var(--space-2);
          scrollbar-width: none;
        }

        .category-pills-bar::-webkit-scrollbar {
          display: none;
        }

        .category-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: 0.45rem 1rem;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }

        .category-pill:hover {
          background: var(--color-cream-subtle);
          border-color: var(--color-primary-light);
        }

        .category-pill.pill-active {
          background: var(--color-espresso);
          color: var(--color-cream);
          border-color: var(--color-espresso);
        }

        .cat-count {
          padding: 0.1rem 0.4rem;
          background: rgba(200, 122, 62, 0.15);
          color: var(--color-primary-dark);
          border-radius: var(--radius-full);
          font-size: 0.7em;
        }

        .pill-active .cat-count {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .active-filter-chips {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .chips-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          font-weight: var(--font-weight-medium);
        }

        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
        }

        .filter-chip button {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .reset-all-btn {
          font-size: var(--font-size-xs) !important;
          padding: 0 var(--space-2) !important;
        }

        /* Mobile Drawer Styles */
        .mobile-filter-drawer-root {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: var(--z-modal-backdrop);
          display: flex;
          align-items: flex-end;
        }

        .drawer-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(30, 18, 13, 0.65);
          backdrop-filter: blur(4px);
        }

        .drawer-panel {
          position: relative;
          z-index: var(--z-modal);
          width: 100%;
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .drawer-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .drawer-close {
          background: none;
          border: none;
          color: var(--color-text-subtle);
          cursor: pointer;
        }

        .drawer-content {
          padding: var(--space-6);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .drawer-section-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: var(--space-3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .drawer-category-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .drawer-radio-label {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--font-size-sm);
          color: var(--color-text-main);
          cursor: pointer;
        }

        .drawer-count {
          color: var(--color-text-subtle);
          font-size: var(--font-size-xs);
        }

        .price-inputs-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .price-box {
          flex: 1;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
        }

        .price-sep {
          color: var(--color-text-subtle);
          font-size: var(--font-size-xs);
        }

        .drawer-footer {
          padding: var(--space-4) var(--space-6);
          border-top: 1px solid var(--color-border-subtle);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
        }
      `}</style>
    </div>
  );
};

export default ProductFilters;

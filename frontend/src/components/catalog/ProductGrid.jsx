import React from 'react';
import { AlertCircle, RotateCcw, PackageSearch } from 'lucide-react';
import ProductCard from './ProductCard';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

/**
 * Responsive Product Grid with Loading Skeletons, Error, and Empty States
 */
export const ProductGrid = ({
  products = [],
  isLoading = false,
  error = null,
  onRetry = null,
  onClearFilters = null,
  emptyMessage = 'No products found matching your criteria.',
}) => {
  if (isLoading) {
    return (
      <div className="product-grid-container">
        <div className="product-grid-root">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="product-card-skeleton animate-pulse">
              <div className="skeleton-img" />
              <div className="skeleton-body">
                <div className="skeleton-line skeleton-meta" />
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-pills" />
                <div className="skeleton-line skeleton-price" />
                <div className="skeleton-btn" />
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .product-grid-container {
            width: 100%;
          }

          .product-grid-root {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: var(--space-6);
          }

          @media (min-width: 640px) {
            .product-grid-root {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .product-grid-root {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          .product-card-skeleton {
            background: var(--color-bg-card);
            border-radius: var(--radius-xl);
            border: 1px solid var(--color-border);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .skeleton-img {
            width: 100%;
            padding-top: 75%;
            background: var(--color-cream-subtle);
          }

          .skeleton-body {
            padding: var(--space-4);
            display: flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .skeleton-line {
            background: var(--color-cream-dark);
            border-radius: var(--radius-sm);
          }

          .skeleton-meta {
            height: 14px;
            width: 40%;
          }

          .skeleton-title {
            height: 22px;
            width: 80%;
          }

          .skeleton-pills {
            height: 20px;
            width: 60%;
          }

          .skeleton-price {
            height: 24px;
            width: 35%;
          }

          .skeleton-btn {
            height: 36px;
            width: 100%;
            background: var(--color-cream-dark);
            border-radius: var(--radius-md);
            margin-top: var(--space-2);
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-grid-state-card error-card glass-panel animate-fadeIn">
        <div className="state-icon-box error-icon">
          <AlertCircle size={32} />
        </div>
        <h3 className="state-title">Unable to Load Products</h3>
        <p className="state-desc">{error}</p>
        {onRetry && (
          <Button variant="primary" size="md" leftIcon={<RotateCcw size={16} />} onClick={onRetry}>
            Try Again
          </Button>
        )}

        <style>{`
          .product-grid-state-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: var(--space-12) var(--space-6);
            border-radius: var(--radius-2xl);
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            margin: var(--space-8) 0;
            width: 100%;
          }

          .state-icon-box {
            width: 64px;
            height: 64px;
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--space-4);
          }

          .error-icon {
            background: var(--color-danger-bg);
            color: var(--color-danger);
          }

          .state-title {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-bold);
            color: var(--color-espresso);
            margin-bottom: var(--space-2);
          }

          .state-desc {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
            max-width: 450px;
            margin-bottom: var(--space-6);
            line-height: var(--line-height-relaxed);
          }
        `}</style>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-grid-state-card empty-card glass-panel animate-fadeIn">
        <div className="state-icon-box empty-icon">
          <PackageSearch size={32} />
        </div>
        <h3 className="state-title">No Products Found</h3>
        <p className="state-desc">{emptyMessage}</p>
        {onClearFilters && (
          <Button variant="outline" size="md" leftIcon={<RotateCcw size={16} />} onClick={onClearFilters}>
            Reset All Filters
          </Button>
        )}

        <style>{`
          .product-grid-state-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: var(--space-12) var(--space-6);
            border-radius: var(--radius-2xl);
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            margin: var(--space-8) 0;
            width: 100%;
          }

          .state-icon-box {
            width: 64px;
            height: 64px;
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--space-4);
          }

          .empty-icon {
            background: var(--color-primary-light);
            color: var(--color-primary);
          }

          .state-title {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-bold);
            color: var(--color-espresso);
            margin-bottom: var(--space-2);
          }

          .state-desc {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
            max-width: 450px;
            margin-bottom: var(--space-6);
            line-height: var(--line-height-relaxed);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="product-grid-container">
      <div className="product-grid-root">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <style>{`
        .product-grid-container {
          width: 100%;
        }

        .product-grid-root {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: var(--space-6);
        }

        @media (min-width: 640px) {
          .product-grid-root {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .product-grid-root {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default ProductGrid;

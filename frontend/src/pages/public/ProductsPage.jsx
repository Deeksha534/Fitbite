import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Filter, Home } from 'lucide-react';
import ProductFilters from '../../components/catalog/ProductFilters';
import ProductGrid from '../../components/catalog/ProductGrid';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { catalogService } from '../../services/catalogService';

/**
 * FitBite Products Catalog & Search Page
 * Live catalog, URL search param synchronization, category filtering, backend sorting, and pagination.
 */
export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract filter parameters from URL
  const currentFilters = {
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    flavor: searchParams.get('flavor') || '',
    sort: searchParams.get('sort') || 'featured',
    page: Number(searchParams.get('page')) || 1,
    limit: 9,
  };

  // 1. Fetch Categories once on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catList = await catalogService.getCategories();
        setCategories(catList);
      } catch (err) {
        console.warn('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // 2. Fetch Products whenever filters change
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await catalogService.getProducts(currentFilters);
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: 9, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Unable to retrieve catalog products. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentFilters.search,
    currentFilters.category_id,
    currentFilters.min_price,
    currentFilters.max_price,
    currentFilters.flavor,
    currentFilters.sort,
    currentFilters.page,
  ]);

  useEffect(() => {
    fetchProducts();
    // Scroll to top of catalog
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  // 3. Handle Filter Changes and sync with URL
  const handleFiltersChange = (newFilters) => {
    const nextParams = new URLSearchParams();

    if (newFilters.search) nextParams.set('search', newFilters.search);
    if (newFilters.category_id) nextParams.set('category_id', newFilters.category_id);
    if (newFilters.min_price) nextParams.set('min_price', newFilters.min_price);
    if (newFilters.max_price) nextParams.set('max_price', newFilters.max_price);
    if (newFilters.flavor) nextParams.set('flavor', newFilters.flavor);
    if (newFilters.sort && newFilters.sort !== 'featured') nextParams.set('sort', newFilters.sort);
    if (newFilters.page && newFilters.page > 1) nextParams.set('page', newFilters.page);

    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      handleFiltersChange({ ...currentFilters, page: newPage });
    }
  };

  const selectedCategoryName = categories.find((c) => c.id === currentFilters.category_id)?.name;

  return (
    <div className="products-page-root">
      {/* Breadcrumb Header */}
      <div className="catalog-header-section">
        <div className="container">
          <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-link">
              <Home size={14} /> Home
            </Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Protein Bars</span>
            {selectedCategoryName && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{selectedCategoryName}</span>
              </>
            )}
          </nav>

          <div className="catalog-title-row">
            <div>
              <h1 className="catalog-title">Explore High-Protein Bars</h1>
              <p className="catalog-subtitle">
                100% Whey Isolate, 0g added sugar, and high prebiotic fiber crafted for clean athletic recovery.
              </p>
            </div>
            {pagination.total > 0 && (
              <Badge variant="espresso" size="md">
                {pagination.total} {pagination.total === 1 ? 'Product' : 'Products'} Available
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Catalog Body */}
      <div className="container catalog-body-section">
        {/* Filters Toolbar */}
        <ProductFilters
          filters={currentFilters}
          categories={categories}
          onChange={handleFiltersChange}
          onReset={handleResetFilters}
          totalResults={pagination.total}
        />

        {/* Product Grid */}
        <ProductGrid
          products={products}
          isLoading={isLoading}
          error={error}
          onRetry={fetchProducts}
          onClearFilters={handleResetFilters}
          emptyMessage="No protein bars matched your selected flavor or category filters."
        />

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="pagination-bar">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              leftIcon={<ChevronLeft size={16} />}
            >
              Previous
            </Button>

            <div className="pagination-numbers">
              {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === pagination.page;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`page-num-btn ${isCurrent ? 'page-active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              rightIcon={<ChevronRight size={16} />}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <style>{`
        .products-page-root {
          width: 100%;
          min-height: 80vh;
        }

        .catalog-header-section {
          background: linear-gradient(180deg, var(--color-cream-subtle) 0%, var(--color-bg-main) 100%);
          padding: var(--space-6) 0 var(--space-8);
          border-bottom: 1px solid var(--color-border);
        }

        .catalog-breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          margin-bottom: var(--space-4);
        }

        .breadcrumb-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .breadcrumb-link:hover {
          color: var(--color-primary);
        }

        .breadcrumb-sep {
          color: var(--color-border);
        }

        .breadcrumb-current {
          color: var(--color-espresso);
          font-weight: var(--font-weight-semibold);
        }

        .catalog-title-row {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        @media (min-width: 768px) {
          .catalog-title-row {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
          }
        }

        .catalog-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: var(--line-height-tight);
          margin-bottom: var(--space-1);
        }

        .catalog-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          max-width: 600px;
        }

        .catalog-body-section {
          padding-top: var(--space-8);
          padding-bottom: var(--space-16);
        }

        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          margin-top: var(--space-12);
          padding-top: var(--space-6);
          border-top: 1px solid var(--color-border);
        }

        .pagination-numbers {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .page-num-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg-card);
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .page-num-btn:hover {
          background: var(--color-cream-subtle);
          border-color: var(--color-primary-light);
        }

        .page-num-btn.page-active {
          background: var(--color-espresso);
          color: var(--color-cream);
          border-color: var(--color-espresso);
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Check,
  Plus,
  Minus,
  Sparkles,
  Info,
  Package,
  Clock,
  AlertCircle,
  Home,
} from 'lucide-react';
import ImageGallery from '../../components/catalog/ImageGallery';
import MacroPill from '../../components/catalog/MacroPill';
import NutritionFactsTable from '../../components/catalog/NutritionFactsTable';
import ProductReviewsSection from '../../components/catalog/ProductReviewsSection';
import ProductCard from '../../components/catalog/ProductCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { catalogService } from '../../services/catalogService';

/**
 * FitBite Product Details Page
 * Shows complete product information, image gallery, nutrition breakdown, 3-tab layout,
 * quantity selector bounded by stock, customer review submission, and related products.
 */
export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('nutrition'); // 'nutrition' | 'reviews' | 'storage'
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);

  // Load product details
  const loadProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await catalogService.getProductById(id);
      if (!data) {
        throw new Error('Product not found or currently inactive.');
      }
      setProduct(data);
      setQuantity(1);

      // Fetch related products in same category
      if (data.category_id) {
        try {
          const relData = await catalogService.getProducts({
            category_id: data.category_id,
            limit: 4,
          });
          const filtered = (relData.products || []).filter((p) => p.id !== data.id).slice(0, 3);
          setRelatedProducts(filtered);
        } catch (relErr) {
          console.warn('Failed to load related products:', relErr);
        }
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
      setError(err.message || 'Product details could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadProduct]);

  const maxStock = product ? Math.min(10, product.stock_quantity) : 1;
  const isOutOfStock = !product || product.stock_quantity <= 0;
  const isLowStock = product && product.stock_quantity > 0 && product.stock_quantity <= 5;
  const hasDiscount =
    product &&
    product.compare_at_price &&
    Number(product.compare_at_price) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleQuantityDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityIncrease = () => {
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your cart.');
      navigate('/login', { state: { from: `/products/${product.id}` } });
      return;
    }

    if (isOutOfStock) {
      toast.warning('Sorry, this product is currently out of stock.');
      return;
    }

    try {
      setIsAddingToCart(true);
      await catalogService.addToCart(product.id, quantity);
      toast.success(`Added ${quantity} × ${product.name} to your cart!`);
    } catch (err) {
      toast.error(err.message || 'Failed to add item to cart.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to save items to your wishlist.');
      navigate('/login', { state: { from: `/products/${product.id}` } });
      return;
    }

    try {
      setIsWishlisting(true);
      await catalogService.addToWishlist(product.id);
      toast.success(`Saved ${product.name} to wishlist!`);
    } catch (err) {
      toast.error(err.message || 'Failed to update wishlist.');
    } finally {
      setIsWishlisting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container product-detail-loading-wrap">
        <Spinner centered size="lg" label="Loading product specifications & nutrition data..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container product-detail-error-wrap">
        <Card glass padding="lg" className="error-box animate-fadeIn">
          <AlertCircle size={40} className="error-icon" />
          <h2>Product Not Found</h2>
          <p>{error || 'The requested product could not be located or may be inactive.'}</p>
          <Link to="/products">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft size={16} />}>
              Back to Catalog
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="product-detail-page-root">
      {/* Breadcrumb Header */}
      <div className="detail-breadcrumb-bar">
        <div className="container">
          <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-link">
              <Home size={14} /> Home
            </Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/products" className="breadcrumb-link">
              Products
            </Link>
            {product.category_name && (
              <>
                <span className="breadcrumb-sep">/</span>
                <Link
                  to={`/products?category_id=${product.category_id}`}
                  className="breadcrumb-link"
                >
                  {product.category_name}
                </Link>
              </>
            )}
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="container detail-main-section">
        <div className="product-showcase-grid">
          {/* Left Column: Image Gallery */}
          <div className="gallery-col">
            <ImageGallery images={product.images || []} productName={product.name} />
          </div>

          {/* Right Column: Product Meta & Purchase Panel */}
          <div className="purchase-panel-col">
            {/* Badges Stack */}
            <div className="detail-badge-row">
              {product.is_featured && <Badge variant="espresso" size="sm">Featured Flavor</Badge>}
              {product.category_name && <Badge variant="primary" size="sm">{product.category_name}</Badge>}
              {hasDiscount && <Badge variant="warning" size="sm">{discountPercent}% OFF</Badge>}
            </div>

            <h1 className="detail-title">{product.name}</h1>
            {product.flavor && <p className="detail-flavor">Flavor Profile: <strong>{product.flavor}</strong></p>}

            {/* Price Section */}
            <div className="detail-pricing-box">
              <span className="detail-price-main">₹{Number(product.price).toFixed(2)}</span>
              {hasDiscount && (
                <span className="detail-price-compare">
                  MRP: ₹{Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
              <span className="detail-tax-inc">Inclusive of all taxes</span>
            </div>

            {/* Macro Highlights Row */}
            <div className="detail-macros-grid">
              {product.protein_grams !== null && (
                <MacroPill type="protein" value={product.protein_grams} unit="g" size="md" />
              )}
              {product.fiber_grams !== null && (
                <MacroPill type="fiber" value={product.fiber_grams} unit="g" size="md" />
              )}
              {product.sugar_grams !== null && (
                <MacroPill type="sugar" value={product.sugar_grams} unit="g" size="md" />
              )}
              {product.calories !== null && (
                <MacroPill type="calories" value={product.calories} unit=" kcal" label="" size="md" />
              )}
            </div>

            {/* Description */}
            <p className="detail-description">{product.description}</p>

            {/* Stock Availability */}
            <div className="stock-status-row">
              <span className="stock-label">Availability:</span>
              {isOutOfStock ? (
                <Badge variant="danger" size="md">Out of Stock</Badge>
              ) : isLowStock ? (
                <Badge variant="warning" size="md">Only {product.stock_quantity} Left in Stock</Badge>
              ) : (
                <Badge variant="success" size="md">In Stock & Ready to Ship</Badge>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="purchase-action-group">
              {!isOutOfStock && (
                <div className="quantity-control-wrap">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleQuantityDecrease}
                    disabled={quantity <= 1 || isAddingToCart}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleQuantityIncrease}
                    disabled={quantity >= maxStock || isAddingToCart}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                disabled={isOutOfStock || isAddingToCart}
                isLoading={isAddingToCart}
                leftIcon={<ShoppingBag size={18} />}
                onClick={handleAddToCart}
                className="add-to-cart-btn"
              >
                {isOutOfStock ? 'Sold Out' : `Add to Cart • ₹${(product.price * quantity).toFixed(2)}`}
              </Button>

              <button
                type="button"
                className="wishlist-icon-btn"
                onClick={handleAddToWishlist}
                disabled={isWishlisting}
                aria-label="Save to Wishlist"
                title="Save to Wishlist"
              >
                <Heart size={20} />
              </button>
            </div>

            {/* Guarantee / Value Props */}
            <div className="detail-guarantees-grid">
              <div className="guarantee-item">
                <Package size={16} />
                <span>Fast 48-Hour Dispatch</span>
              </div>
              <div className="guarantee-item">
                <ShieldCheck size={16} />
                <span>100% Genuine Whey Isolate</span>
              </div>
              <div className="guarantee-item">
                <Sparkles size={16} />
                <span>Zero Artificial Preservatives</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Tab Specification & Reviews Section */}
        <div className="detail-tabs-container">
          <div className="tabs-header-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'nutrition'}
              className={`tab-btn ${activeTab === 'nutrition' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('nutrition')}
            >
              Nutrition Facts & Ingredients
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              className={`tab-btn ${activeTab === 'reviews' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Customer Reviews
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'storage'}
              className={`tab-btn ${activeTab === 'storage' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('storage')}
            >
              Directions & Storage
            </button>
          </div>

          <div className="tabs-content-area">
            {activeTab === 'nutrition' && (
              <div className="tab-pane animate-fadeIn">
                <NutritionFactsTable product={product} />
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="tab-pane animate-fadeIn">
                <ProductReviewsSection productId={product.id} />
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="tab-pane animate-fadeIn">
                <div className="storage-info-grid">
                  <div className="storage-card">
                    <Clock size={20} className="storage-icon" />
                    <h4>Best Consumption Timing</h4>
                    <p>
                      Ideal as a post-workout recovery snack within 45 minutes of training, a morning commute breakfast replacement, or a clean mid-day energy boost.
                    </p>
                  </div>

                  <div className="storage-card">
                    <Package size={20} className="storage-icon" />
                    <h4>Storage Instructions</h4>
                    <p>
                      Store in a cool, dry place away from direct sunlight (optimal temperature: 18°C – 22°C). Refrigeration is optional during hot summer months to maintain firm artisan dark chocolate coating.
                    </p>
                  </div>

                  <div className="storage-card">
                    <ShieldCheck size={20} className="storage-icon" />
                    <h4>Shelf Life & Freshness</h4>
                    <p>
                      Best before 9 months from the date of manufacture. Sealed with nitrogen-flushed protective barrier foil for maximum antioxidant freshness.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <div className="related-header">
              <h3 className="related-title">You May Also Like</h3>
              <p className="related-subtitle">Other popular clean protein flavors in this category.</p>
            </div>

            <div className="related-grid">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .product-detail-page-root {
          width: 100%;
          min-height: 80vh;
        }

        .product-detail-loading-wrap,
        .product-detail-error-wrap {
          padding: var(--space-16) 0;
          display: flex;
          justify-content: center;
        }

        .error-box {
          text-align: center;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .error-icon {
          color: var(--color-danger);
        }

        .detail-breadcrumb-bar {
          background: linear-gradient(180deg, var(--color-cream-subtle) 0%, var(--color-bg-main) 100%);
          padding: var(--space-4) 0;
          border-bottom: 1px solid var(--color-border);
        }

        .catalog-breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          flex-wrap: wrap;
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

        .detail-main-section {
          padding-top: var(--space-8);
          padding-bottom: var(--space-16);
        }

        .product-showcase-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-10);
        }

        @media (min-width: 1024px) {
          .product-showcase-grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-12);
            align-items: start;
          }
        }

        .purchase-panel-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .detail-badge-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .detail-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: var(--line-height-tight);
        }

        .detail-flavor {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .detail-pricing-box {
          display: flex;
          align-items: baseline;
          gap: var(--space-3);
          padding: var(--space-3) 0;
        }

        .detail-price-main {
          font-family: var(--font-heading);
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
        }

        .detail-price-compare {
          font-size: var(--font-size-sm);
          color: var(--color-text-subtle);
          text-decoration: line-through;
        }

        .detail-tax-inc {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .detail-macros-grid {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          padding: var(--space-2) 0;
        }

        .detail-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .stock-status-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) 0;
        }

        .stock-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          text-transform: uppercase;
        }

        .purchase-action-group {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-top: var(--space-4);
          flex-wrap: wrap;
        }

        .quantity-control-wrap {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-bg-card);
          padding: 2px;
        }

        .qty-btn {
          width: 36px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--color-espresso);
          cursor: pointer;
          transition: background var(--transition-fast);
          border-radius: var(--radius-md);
        }

        .qty-btn:hover:not(:disabled) {
          background: var(--color-cream-subtle);
        }

        .qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .qty-value {
          width: 36px;
          text-align: center;
          font-family: var(--font-heading);
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
        }

        .add-to-cart-btn {
          flex: 1;
          min-width: 200px;
        }

        .wishlist-icon-btn {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--color-border);
          background: var(--color-bg-card);
          color: var(--color-text-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .wishlist-icon-btn:hover {
          color: var(--color-danger);
          border-color: var(--color-danger-border);
          background: var(--color-danger-bg);
        }

        .detail-guarantees-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: var(--space-3);
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
        }

        @media (min-width: 640px) {
          .detail-guarantees-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .guarantee-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-espresso);
          font-weight: var(--font-weight-medium);
        }

        .guarantee-item svg {
          color: var(--color-primary);
          flex-shrink: 0;
        }

        /* 3-Tab System */
        .detail-tabs-container {
          margin-top: var(--space-16);
          border-top: 1px solid var(--color-border);
          padding-top: var(--space-8);
        }

        .tabs-header-bar {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          border-bottom: 2px solid var(--color-cream-dark);
          overflow-x: auto;
        }

        .tab-btn {
          padding: var(--space-3) var(--space-4);
          background: none;
          border: none;
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-subtle);
          cursor: pointer;
          position: relative;
          white-space: nowrap;
          transition: color var(--transition-fast);
        }

        .tab-btn:hover {
          color: var(--color-espresso);
        }

        .tab-btn.tab-btn-active {
          color: var(--color-primary-dark);
        }

        .tab-btn.tab-btn-active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-primary);
        }

        .tabs-content-area {
          padding: var(--space-6) 0;
        }

        .storage-info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 768px) {
          .storage-info-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .storage-card {
          padding: var(--space-6);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .storage-icon {
          color: var(--color-primary);
          margin-bottom: var(--space-2);
        }

        .storage-card h4 {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .storage-card p {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        /* Related Products */
        .related-products-section {
          margin-top: var(--space-16);
        }

        .related-header {
          margin-bottom: var(--space-6);
        }

        .related-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          margin-bottom: var(--space-1);
        }

        .related-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .related-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 640px) {
          .related-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .related-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;

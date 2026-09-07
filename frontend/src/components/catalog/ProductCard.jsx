import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Eye, Check } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import MacroPill from './MacroPill';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

/**
 * Reusable FitBite Product Card Component
 * Fully auth-aware, responsive, with fallback image resilience and macro highlights.
 */
export const ProductCard = ({ product, onWishlistToggle = null }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);
  const [imgSrc, setImgSrc] = useState(product?.primary_image_url || '/images/protein-combo.jpeg');

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const hasDiscount =
    product.compare_at_price &&
    Number(product.compare_at_price) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleQuickAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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
      await addToCart(product.id, 1);
      setIsAdded(true);
      toast.success(`Added ${product.name} to your cart!`);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      // Toast handled by context
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuickWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to save items to your wishlist.');
      navigate('/login', { state: { from: `/products/${product.id}` } });
      return;
    }

    try {
      setIsWishlisting(true);
      await addToWishlist(product.id);
      toast.success(`Saved ${product.name} to wishlist!`);
      if (onWishlistToggle) onWishlistToggle(product.id);
    } catch (err) {
      // Toast handled by context
    } finally {
      setIsWishlisting(false);
    }
  };

  return (
    <Card hoverable padding="none" className="product-card-root">
      <Link to={`/products/${product.id}`} className="product-card-link">
        {/* Top Badges & Image */}
        <div className="product-card-media">
          <img
            src={imgSrc}
            alt={product.primary_image_alt || product.name}
            className="product-card-image"
            onError={() => setImgSrc('/images/protein-combo.jpeg')}
            loading="lazy"
          />

          <div className="product-badge-stack">
            {product.is_featured && (
              <Badge variant="espresso" size="sm">
                Featured
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="primary" size="sm">
                {discountPercent}% OFF
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="danger" size="sm">
                Out of Stock
              </Badge>
            )}
            {isLowStock && (
              <Badge variant="warning" size="sm">
                Only {product.stock_quantity} Left
              </Badge>
            )}
          </div>

          <button
            type="button"
            className="quick-wishlist-btn"
            onClick={handleQuickWishlist}
            disabled={isWishlisting}
            aria-label="Save to Wishlist"
            title="Save to Wishlist"
          >
            <Heart size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="product-card-body">
          {/* Category & Flavor */}
          <div className="product-card-meta">
            {product.category_name && (
              <span className="product-card-category">{product.category_name}</span>
            )}
            {product.flavor && (
              <span className="product-card-flavor">· {product.flavor}</span>
            )}
          </div>

          <h3 className="product-card-title" title={product.name}>
            {product.name}
          </h3>

          {/* Macro Pills Row */}
          <div className="product-card-macros">
            {product.protein_grams !== null && product.protein_grams !== undefined && (
              <MacroPill type="protein" value={product.protein_grams} unit="g" size="sm" />
            )}
            {product.calories !== null && product.calories !== undefined && (
              <MacroPill type="calories" value={product.calories} unit=" kcal" label="" size="sm" />
            )}
          </div>

          {/* Price & Stock */}
          <div className="product-card-footer-info">
            <div className="product-card-pricing">
              <span className="product-price-current">
                ₹{Number(product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="product-price-original">
                  ₹{Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Action Button */}
      <div className="product-card-actions">
        <Button
          variant={isAdded ? 'secondary' : 'primary'}
          size="sm"
          fullWidth
          disabled={isOutOfStock || isAddingToCart}
          isLoading={isAddingToCart}
          leftIcon={isAdded ? <Check size={14} /> : <ShoppingBag size={14} />}
          onClick={handleQuickAddToCart}
        >
          {isOutOfStock ? 'Out of Stock' : isAdded ? 'Added to Cart' : 'Add to Cart'}
        </Button>
      </div>

      <style>{`
        .product-card-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
        }

        .product-card-root:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
          border-color: var(--color-primary-light);
        }

        .product-card-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .product-card-media {
          position: relative;
          width: 100%;
          padding-top: 75%;
          background: var(--color-cream-subtle);
          overflow: hidden;
        }

        .product-card-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .product-card-root:hover .product-card-image {
          transform: scale(1.06);
        }

        .product-badge-stack {
          position: absolute;
          top: var(--space-3);
          left: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          z-index: 2;
        }

        .quick-wishlist-btn {
          position: absolute;
          top: var(--space-3);
          right: var(--space-3);
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-subtle);
          cursor: pointer;
          transition: all var(--transition-fast);
          z-index: 3;
        }

        .quick-wishlist-btn:hover {
          color: var(--color-danger);
          background: #ffffff;
          transform: scale(1.1);
        }

        .product-card-body {
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          flex: 1;
        }

        .product-card-meta {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          font-weight: var(--font-weight-medium);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-card-category {
          color: var(--color-primary-dark);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .product-card-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          line-height: var(--line-height-snug);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.5em;
        }

        .product-card-macros {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: auto;
          padding-top: var(--space-1);
        }

        .product-card-footer-info {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding-top: var(--space-2);
          border-top: 1px solid var(--color-border-subtle);
        }

        .product-card-pricing {
          display: flex;
          align-items: baseline;
          gap: var(--space-2);
        }

        .product-price-current {
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
        }

        .product-price-original {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          text-decoration: line-through;
        }

        .product-card-actions {
          padding: 0 var(--space-4) var(--space-4);
        }
      `}</style>
    </Card>
  );
};

export default ProductCard;

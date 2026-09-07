import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, AlertCircle, Check } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';

/**
 * Saved product card for Wishlist Page
 */
export const WishlistCard = ({
  item,
  onMoveToCart,
  onRemove,
  isMoving = false,
}) => {
  const [imgSrc, setImgSrc] = useState(
    item.product?.image_url || '/images/protein-combo.jpeg'
  );

  if (!item || !item.product) return null;

  const { product, is_in_stock } = item;
  const hasDiscount =
    product.compare_at_price &&
    Number(product.compare_at_price) > Number(product.price);

  return (
    <Card hoverable padding="none" className="wishlist-card-root">
      {/* Top Media & Image */}
      <div className="wishlist-media">
        <Link to={`/products/${product.id}`} className="wishlist-img-link">
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgSrc('/images/protein-combo.jpeg')}
            className="wishlist-img"
          />
        </Link>

        {/* Remove Button Overlay */}
        <button
          type="button"
          className="wishlist-remove-icon-btn"
          onClick={() => onRemove(item.id)}
          title="Remove from wishlist"
          aria-label="Remove item from wishlist"
        >
          <Trash2 size={16} />
        </button>

        {/* Protein Badge */}
        {product.protein_grams && (
          <Badge variant="primary" size="sm" className="wishlist-protein-badge">
            {product.protein_grams}g Protein
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="wishlist-body">
        <div className="wishlist-title-group">
          <Link to={`/products/${product.id}`} className="wishlist-title-link">
            <h4 className="wishlist-title">{product.name}</h4>
          </Link>
          {product.flavor && <span className="wishlist-flavor">{product.flavor}</span>}
        </div>

        <div className="wishlist-price-row">
          <span className="current-price">₹{Number(product.price).toFixed(2)}</span>
          {hasDiscount && (
            <span className="compare-price">₹{Number(product.compare_at_price).toFixed(2)}</span>
          )}
        </div>

        <div className="wishlist-stock-status">
          {is_in_stock ? (
            <span className="stock-pill in-stock">
              <span className="stock-dot" /> In Stock ({product.stock_quantity} left)
            </span>
          ) : (
            <span className="stock-pill out-of-stock">
              <AlertCircle size={12} /> Currently Out of Stock
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="wishlist-actions">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => onMoveToCart(item.id)}
            disabled={!is_in_stock || isMoving}
            isLoading={isMoving}
            leftIcon={<ShoppingBag size={14} />}
          >
            {is_in_stock ? 'Move to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>

      <style>{`
        .wishlist-card-root {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
          border-radius: var(--radius-xl);
          height: 100%;
        }

        .wishlist-media {
          position: relative;
          width: 100%;
          padding-top: 75%;
          background: var(--color-cream-subtle);
          overflow: hidden;
        }

        .wishlist-img-link {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .wishlist-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .wishlist-card-root:hover .wishlist-img {
          transform: scale(1.05);
        }

        .wishlist-remove-icon-btn {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--color-border);
          color: var(--color-text-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
          z-index: 2;
        }

        .wishlist-remove-icon-btn:hover {
          color: var(--color-danger);
          background: #ffffff;
          transform: scale(1.1);
        }

        .wishlist-protein-badge {
          position: absolute;
          bottom: 0.75rem;
          left: 0.75rem;
          z-index: 2;
        }

        .wishlist-body {
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          flex: 1;
        }

        .wishlist-title-link {
          text-decoration: none;
        }

        .wishlist-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          line-height: 1.3;
        }

        .wishlist-title:hover {
          color: var(--color-primary);
        }

        .wishlist-flavor {
          display: block;
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .wishlist-price-row {
          display: flex;
          align-items: baseline;
          gap: var(--space-2);
          margin-top: 2px;
        }

        .current-price {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
        }

        .compare-price {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          text-decoration: line-through;
        }

        .wishlist-stock-status {
          margin-top: 2px;
        }

        .stock-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }

        .stock-pill.in-stock {
          color: #16a34a;
        }

        .stock-pill.out-of-stock {
          color: var(--color-danger);
        }

        .stock-dot {
          width: 7px;
          height: 7px;
          border-radius: var(--radius-full);
          background: #16a34a;
        }

        .wishlist-actions {
          margin-top: auto;
          padding-top: var(--space-3);
        }
      `}</style>
    </Card>
  );
};

export default WishlistCard;

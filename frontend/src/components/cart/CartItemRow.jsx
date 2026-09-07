import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, AlertCircle, ShieldAlert } from 'lucide-react';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';

/**
 * Line item row for shopping cart
 * Strictly validates against backend stock limits.
 */
export const CartItemRow = ({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
}) => {
  const [imgSrc, setImgSrc] = useState(
    item.product?.image_url || '/images/protein-combo.jpeg'
  );

  if (!item || !item.product) return null;

  const { product, quantity, unit_price, item_subtotal, is_in_stock, available_stock } = item;
  const maxStock = available_stock !== undefined ? available_stock : product.stock_quantity;
  const isMaxReached = quantity >= maxStock;

  const handleDecrement = (e) => {
    e.preventDefault();
    if (isUpdating) return;
    if (quantity > 1) {
      onUpdateQuantity(item.id, quantity - 1);
    } else {
      onRemove(item.id);
    }
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    if (isUpdating || isMaxReached) return;
    onUpdateQuantity(item.id, quantity + 1);
  };

  return (
    <div className={`cart-item-row glass-panel ${!is_in_stock ? 'out-of-stock-row' : ''}`}>
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="cart-item-img-link">
        <div className="cart-item-img-wrap">
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgSrc('/images/protein-combo.jpeg')}
            className="cart-item-img"
          />
        </div>
      </Link>

      {/* Product Information */}
      <div className="cart-item-details">
        <div className="cart-item-header">
          <Link to={`/products/${product.id}`} className="cart-item-title-link">
            <h4 className="cart-item-title">{product.name}</h4>
          </Link>
          {product.flavor && <span className="cart-item-flavor">{product.flavor}</span>}
        </div>

        <div className="cart-item-meta">
          {product.protein_grams && (
            <Badge variant="primary" size="sm">
              {product.protein_grams}g Protein
            </Badge>
          )}

          {!is_in_stock && (
            <Badge variant="danger" size="sm">
              <AlertCircle size={12} /> Out of Stock / Inactive
            </Badge>
          )}

          {is_in_stock && isMaxReached && (
            <Badge variant="warning" size="sm">
              Max Stock ({maxStock})
            </Badge>
          )}
        </div>

        <div className="cart-item-price-mobile">
          <span className="unit-price">₹{Number(unit_price).toFixed(2)} each</span>
        </div>
      </div>

      {/* Quantity Stepper */}
      <div className="cart-item-stepper-wrap">
        <div className="quantity-stepper">
          <button
            type="button"
            className="stepper-btn"
            onClick={handleDecrement}
            disabled={isUpdating}
            aria-label="Decrease quantity"
          >
            {quantity === 1 ? <Trash2 size={14} className="text-danger" /> : <Minus size={14} />}
          </button>

          <span className="stepper-count">
            {isUpdating ? <Spinner size="sm" /> : quantity}
          </span>

          <button
            type="button"
            className="stepper-btn"
            onClick={handleIncrement}
            disabled={isUpdating || isMaxReached || !is_in_stock}
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        {is_in_stock && maxStock <= 5 && (
          <span className="low-stock-hint">Only {maxStock} left in stock</span>
        )}
      </div>

      {/* Subtotal & Delete Action */}
      <div className="cart-item-total-group">
        <div className="cart-item-total-price">
          ₹{Number(item_subtotal).toFixed(2)}
        </div>

        <button
          type="button"
          className="cart-item-remove-btn"
          onClick={() => onRemove(item.id)}
          disabled={isUpdating}
          title="Remove from cart"
          aria-label="Remove item"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <style>{`
        .cart-item-row {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: var(--space-4);
          padding: var(--space-4);
          border-radius: var(--radius-xl);
          align-items: center;
          position: relative;
          background: #ffffff;
        }

        @media (min-width: 640px) {
          .cart-item-row {
            grid-template-columns: 90px 1.5fr auto auto;
            gap: var(--space-6);
          }
        }

        .out-of-stock-row {
          opacity: 0.75;
          border: 1px solid var(--color-danger-light);
          background: rgba(220, 38, 38, 0.02);
        }

        .cart-item-img-wrap {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        @media (min-width: 640px) {
          .cart-item-img-wrap {
            width: 90px;
            height: 90px;
          }
        }

        .cart-item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-fast);
        }

        .cart-item-img-link:hover .cart-item-img {
          transform: scale(1.05);
        }

        .cart-item-details {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .cart-item-title-link {
          text-decoration: none;
        }

        .cart-item-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          line-height: 1.3;
        }

        .cart-item-title:hover {
          color: var(--color-primary);
        }

        .cart-item-flavor {
          display: block;
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .cart-item-meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .cart-item-price-mobile {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .cart-item-stepper-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-1);
          grid-column: 2 / -1;
        }

        @media (min-width: 640px) {
          .cart-item-stepper-wrap {
            grid-column: auto;
            align-items: center;
          }
        }

        .quantity-stepper {
          display: inline-flex;
          align-items: center;
          background: var(--color-cream-subtle);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-full);
          padding: 2px;
        }

        .stepper-btn {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-espresso);
          background: transparent;
          border: none;
          transition: all var(--transition-fast);
        }

        .stepper-btn:hover:not(:disabled) {
          background: #ffffff;
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .stepper-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .stepper-count {
          min-width: 32px;
          text-align: center;
          font-family: var(--font-heading);
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
        }

        .low-stock-hint {
          font-size: 0.65rem;
          color: var(--color-warning);
          font-weight: var(--font-weight-semibold);
        }

        .cart-item-total-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          grid-column: 1 / -1;
          padding-top: var(--space-2);
          border-top: 1px dashed var(--color-border-subtle);
        }

        @media (min-width: 640px) {
          .cart-item-total-group {
            grid-column: auto;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
            border-top: none;
            padding-top: 0;
            gap: var(--space-2);
          }
        }

        .cart-item-total-price {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
        }

        .cart-item-remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          color: var(--color-text-subtle);
          background: transparent;
          border: none;
          transition: all var(--transition-fast);
        }

        .cart-item-remove-btn:hover:not(:disabled) {
          color: var(--color-danger);
          background: var(--color-danger-light);
        }
      `}</style>
    </div>
  );
};

export default CartItemRow;

import React, { useState } from 'react';
import { Tag, ShieldCheck, Truck, Lock, X } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { couponService } from '../../services/couponService';
import { useToast } from '../../context/ToastContext';

/**
 * Sticky Order Summary Sidebar for Multi-step Checkout
 */
export const OrderSummarySidebar = ({
  items = [],
  subtotal = 0,
  shippingFee = 50,
  estimatedTotal = 0,
  freeShippingQualified = false,
  appliedCoupon = null,
  onApplyCoupon = null,
  onRemoveCoupon = null,
  deliveryNotes = '',
  onChangeDeliveryNotes = null,
  onPlaceOrder,
  isSubmitting = false,
  submitDisabled = false,
  selectedPaymentMethod = 'card',
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const toast = useToast();

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.warning('Please enter a coupon code.');
      return;
    }

    try {
      setIsValidating(true);
      const res = await couponService.validateCoupon(couponInput.trim());
      if (res && res.valid) {
        toast.success(res.message || `Applied coupon '${res.code}'!`);
        if (onApplyCoupon) onApplyCoupon(res);
        setCouponInput('');
      } else {
        toast.error(res?.message || 'Invalid coupon code.');
      }
    } catch (err) {
      toast.error(err.message || 'Coupon could not be applied.');
    } finally {
      setIsValidating(false);
    }
  };

  const discountAmount = appliedCoupon ? Number(appliedCoupon.discount_amount || 0) : 0;
  const grandTotal = appliedCoupon ? Number(appliedCoupon.estimated_total || 0) : estimatedTotal;

  return (
    <Card padding="lg" className="checkout-summary-card glass-panel">
      <h3 className="summary-title">Order Overview ({items.length} items)</h3>

      {/* Item Previews List */}
      <div className="checkout-items-list">
        {items.map((item) => (
          <div key={item.id} className="checkout-item-row">
            <div className="item-thumbnail-wrap">
              <img
                src={item.product?.image_url || '/images/protein-combo.jpeg'}
                alt={item.product?.name}
                className="item-thumbnail"
                onError={(e) => {
                  e.target.src = '/images/protein-combo.jpeg';
                }}
              />
              <span className="item-qty-badge">{item.quantity}</span>
            </div>

            <div className="item-info">
              <span className="item-name">{item.product?.name}</span>
              {item.product?.flavor && (
                <span className="item-flavor">{item.product?.flavor}</span>
              )}
            </div>

            <div className="item-price">₹{Number(item.item_subtotal).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Coupon Application Box */}
      <div className="checkout-coupon-box">
        {appliedCoupon ? (
          <div className="applied-coupon-pill animate-fadeIn">
            <div className="applied-coupon-info">
              <Tag size={15} className="text-primary" />
              <div>
                <strong className="coupon-code-label">{appliedCoupon.code}</strong>
                <span className="coupon-discount-label">
                  Saved ₹{discountAmount.toFixed(2)}
                  {appliedCoupon.discount_type === 'percentage' && ` (${appliedCoupon.discount_value}%)`}
                </span>
              </div>
            </div>
            {onRemoveCoupon && (
              <button
                type="button"
                className="remove-coupon-btn"
                onClick={onRemoveCoupon}
                title="Remove coupon"
                aria-label="Remove coupon"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          <form className="coupon-input-form" onSubmit={handleApplyCoupon}>
            <input
              type="text"
              placeholder="Promo Code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              className="checkout-coupon-input"
              disabled={isValidating}
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={isValidating || !couponInput.trim()}
              isLoading={isValidating}
            >
              Apply
            </Button>
          </form>
        )}
      </div>

      {/* Delivery Instructions */}
      {onChangeDeliveryNotes && (
        <div className="delivery-notes-wrap">
          <label htmlFor="deliveryNotes" className="delivery-notes-label">
            Delivery Instructions (Optional)
          </label>
          <textarea
            id="deliveryNotes"
            rows={2}
            placeholder="e.g. Leave with security guard, gate code #1234"
            value={deliveryNotes}
            onChange={(e) => onChangeDeliveryNotes(e.target.value)}
            className="delivery-notes-textarea"
            maxLength={500}
          />
        </div>
      )}

      {/* Financial Breakdown */}
      <div className="checkout-financials">
        <div className="financial-row">
          <span className="financial-label">Subtotal</span>
          <span className="financial-val">₹{Number(subtotal).toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="financial-row discount-row animate-fadeIn">
            <span className="financial-label">Promo Discount</span>
            <span className="financial-val text-success">-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="financial-row">
          <span className="financial-label">
            Shipping Delivery {freeShippingQualified && <span className="text-success">(Free)</span>}
          </span>
          <span className="financial-val">
            {shippingFee === 0 || freeShippingQualified ? (
              <span className="text-success">₹0.00</span>
            ) : (
              `₹${Number(shippingFee).toFixed(2)}`
            )}
          </span>
        </div>

        <div className="summary-divider" />

        <div className="financial-row grand-total-row">
          <span className="grand-total-label">Final Amount</span>
          <span className="grand-total-val">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Place Order CTA */}
      <div className="checkout-cta-wrap">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onPlaceOrder}
          disabled={submitDisabled || isSubmitting}
          isLoading={isSubmitting}
          leftIcon={<Lock size={16} />}
        >
          {isSubmitting
            ? 'Securing Order...'
            : selectedPaymentMethod === 'cod'
            ? `Confirm COD Order (₹${grandTotal.toFixed(2)})`
            : `Place Order & Pay ₹${grandTotal.toFixed(2)}`}
        </Button>
      </div>

      <div className="secure-badge-footer">
        <ShieldCheck size={14} className="text-primary" />
        <span>Direct PostgreSQL Transaction Clearance</span>
      </div>

      <style>{`
        .checkout-summary-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          background: #ffffff;
          position: sticky;
          top: 90px;
        }

        .summary-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-border);
        }

        .checkout-items-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: 220px;
          overflow-y: auto;
          padding-right: var(--space-1);
        }

        .checkout-item-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .item-thumbnail-wrap {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          overflow: visible;
          flex-shrink: 0;
        }

        .item-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: var(--radius-md);
        }

        .item-qty-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: var(--color-espresso);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: var(--font-weight-bold);
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .item-name {
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-flavor {
          font-size: 0.68rem;
          color: var(--color-text-subtle);
        }

        .item-price {
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        /* Coupon */
        .checkout-coupon-box {
          width: 100%;
        }

        .coupon-input-form {
          display: flex;
          gap: var(--space-2);
        }

        .checkout-coupon-input {
          flex: 1;
          padding: 0.45rem 0.75rem;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          text-transform: uppercase;
        }

        .applied-coupon-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--space-3);
          background: rgba(22, 163, 74, 0.08);
          border: 1px solid rgba(22, 163, 74, 0.3);
          border-radius: var(--radius-md);
        }

        .applied-coupon-info {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .coupon-code-label {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: #16a34a;
        }

        .coupon-discount-label {
          display: block;
          font-size: 0.68rem;
          color: var(--color-text-muted);
        }

        .remove-coupon-btn {
          width: 22px;
          height: 22px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--color-text-subtle);
          cursor: pointer;
        }

        .remove-coupon-btn:hover {
          color: var(--color-danger);
        }

        /* Delivery Notes */
        .delivery-notes-wrap {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .delivery-notes-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
        }

        .delivery-notes-textarea {
          width: 100%;
          padding: 0.45rem 0.75rem;
          font-size: var(--font-size-xs);
          color: var(--color-text-main);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          resize: none;
        }

        /* Financials */
        .checkout-financials {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding-top: var(--space-2);
          border-top: 1px solid var(--color-border);
        }

        .financial-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--font-size-xs);
        }

        .financial-label {
          color: var(--color-text-muted);
        }

        .financial-val {
          font-family: var(--font-heading);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
        }

        .summary-divider {
          height: 1px;
          background: var(--color-border);
          margin: var(--space-1) 0;
        }

        .grand-total-row .grand-total-label {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .grand-total-row .grand-total-val {
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-primary);
        }

        .secure-badge-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-1);
          font-size: 0.7rem;
          color: var(--color-text-subtle);
        }
      `}</style>
    </Card>
  );
};

export default OrderSummarySidebar;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, ArrowRight, ShieldCheck, Truck, Check, X, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import { couponService } from '../../services/couponService';
import { useToast } from '../../context/ToastContext';

/**
 * Order Pricing Summary & Coupon Box Component for Cart
 */
export const CartSummary = ({
  subtotal = 0,
  shippingFee = 50,
  estimatedTotal = 0,
  freeShippingQualified = false,
  appliedCoupon = null,
  onApplyCoupon = null,
  onRemoveCoupon = null,
  disableCheckout = false,
  checkoutLink = '/checkout',
}) => {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const toast = useToast();

  const FREE_SHIPPING_THRESHOLD = 500;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      toast.warning('Please enter a coupon code.');
      return;
    }

    try {
      setIsValidatingCoupon(true);
      const res = await couponService.validateCoupon(couponCodeInput.trim());
      if (res && res.valid) {
        toast.success(res.message || `Coupon '${res.code}' applied!`);
        if (onApplyCoupon) onApplyCoupon(res);
        setCouponCodeInput('');
      } else {
        toast.error(res?.message || 'Invalid coupon code.');
      }
    } catch (err) {
      toast.error(err.message || 'Coupon could not be applied.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const discountAmount = appliedCoupon ? Number(appliedCoupon.discount_amount || 0) : 0;
  const displayTotal = appliedCoupon ? Number(appliedCoupon.estimated_total || 0) : estimatedTotal;

  return (
    <Card padding="lg" className="cart-summary-card glass-panel">
      <h3 className="summary-heading">Order Summary</h3>

      {/* Free Shipping Progress Meter */}
      <div className="shipping-progress-box">
        <div className="shipping-progress-header">
          <span className="shipping-progress-label">
            <Truck size={15} />
            {freeShippingQualified ? (
              <strong className="text-success">🎉 FREE Express Shipping Unlocked!</strong>
            ) : (
              <span>
                Add <strong>₹{amountRemaining.toFixed(2)}</strong> more for <strong>FREE Delivery</strong>
              </span>
            )}
          </span>
          <span className="shipping-progress-pct">{progressPercent}%</span>
        </div>

        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${freeShippingQualified ? 'fill-completed' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Coupon Application Box */}
      <div className="coupon-section">
        {appliedCoupon ? (
          <div className="applied-coupon-pill animate-fadeIn">
            <div className="applied-coupon-info">
              <Tag size={16} className="text-primary" />
              <div>
                <strong className="coupon-code-label">{appliedCoupon.code}</strong>
                <span className="coupon-saved-text">
                  Saved ₹{discountAmount.toFixed(2)}
                  {appliedCoupon.discount_type === 'percentage' && ` (${appliedCoupon.discount_value}% OFF)`}
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
                <X size={15} />
              </button>
            )}
          </div>
        ) : (
          <form className="coupon-input-form" onSubmit={handleApplyCoupon}>
            <div className="coupon-input-wrap">
              <Tag size={16} className="coupon-field-icon" />
              <input
                type="text"
                placeholder="Promo Code (e.g. FITBITE20)"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                className="coupon-field"
                disabled={isValidatingCoupon}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={isValidatingCoupon || !couponCodeInput.trim()}
              isLoading={isValidatingCoupon}
            >
              Apply
            </Button>
          </form>
        )}
      </div>

      {/* Breakdown Rows */}
      <div className="summary-breakdown">
        <div className="summary-row">
          <span className="summary-label">Items Subtotal</span>
          <span className="summary-val">₹{Number(subtotal).toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="summary-row discount-row animate-fadeIn">
            <span className="summary-label">Promotional Discount</span>
            <span className="summary-val text-success">-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="summary-row">
          <span className="summary-label">
            Estimated Delivery {freeShippingQualified && <span className="text-success">(Free)</span>}
          </span>
          <span className="summary-val">
            {shippingFee === 0 || freeShippingQualified ? (
              <span className="text-success">₹0.00</span>
            ) : (
              `₹${Number(shippingFee).toFixed(2)}`
            )}
          </span>
        </div>

        <div className="summary-divider" />

        <div className="summary-row total-row">
          <span className="total-label">Estimated Total</span>
          <span className="total-val">₹{displayTotal.toFixed(2)}</span>
        </div>

        <p className="tax-inclusive-notice">Inclusive of all applicable GST taxes</p>
      </div>

      {/* Checkout CTA */}
      <div className="summary-actions">
        <Link to={checkoutLink} className="checkout-btn-link">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={disableCheckout}
            rightIcon={<ArrowRight size={18} />}
          >
            Proceed to Checkout
          </Button>
        </Link>
      </div>

      {/* Trust Assurances */}
      <div className="summary-trust-badges">
        <div className="trust-item">
          <ShieldCheck size={16} className="trust-icon" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
        <div className="trust-item">
          <Sparkles size={16} className="trust-icon" />
          <span>Fresh Batch Direct From Factory</span>
        </div>
      </div>

      <style>{`
        .cart-summary-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          position: sticky;
          top: 90px;
          background: #ffffff;
        }

        .summary-heading {
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-border);
        }

        /* Free Shipping Progress */
        .shipping-progress-box {
          background: var(--color-cream-subtle);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .shipping-progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          color: var(--color-espresso);
        }

        .shipping-progress-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .shipping-progress-pct {
          font-family: var(--font-heading);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }

        .progress-bar-track {
          width: 100%;
          height: 6px;
          background: var(--color-border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-amber) 100%);
          border-radius: var(--radius-full);
          transition: width 0.4s ease;
        }

        .fill-completed {
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
        }

        /* Coupon Section */
        .coupon-section {
          width: 100%;
        }

        .coupon-input-form {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .coupon-input-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .coupon-field-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--color-text-subtle);
          pointer-events: none;
        }

        .coupon-field {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.2rem;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          letter-spacing: 0.05em;
          color: var(--color-espresso);
          background: var(--color-cream-subtle);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          text-transform: uppercase;
        }

        .coupon-field:focus {
          border-color: var(--color-primary);
          background: #ffffff;
        }

        .applied-coupon-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--space-3);
          background: rgba(22, 163, 74, 0.08);
          border: 1px solid rgba(22, 163, 74, 0.3);
          border-radius: var(--radius-lg);
        }

        .applied-coupon-info {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .coupon-code-label {
          display: block;
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: #16a34a;
        }

        .coupon-saved-text {
          display: block;
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }

        .remove-coupon-btn {
          width: 24px;
          height: 24px;
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
          background: var(--color-danger-light);
        }

        /* Breakdown */
        .summary-breakdown {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-size-sm);
        }

        .summary-label {
          color: var(--color-text-muted);
        }

        .summary-val {
          font-family: var(--font-heading);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
        }

        .discount-row .summary-label {
          color: #16a34a;
          font-weight: var(--font-weight-semibold);
        }

        .summary-divider {
          height: 1px;
          background: var(--color-border);
          margin: var(--space-1) 0;
        }

        .total-row .total-label {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .total-row .total-val {
          font-family: var(--font-heading);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-primary);
        }

        .tax-inclusive-notice {
          font-size: 0.7rem;
          color: var(--color-text-subtle);
          text-align: right;
          margin-top: -4px;
        }

        .checkout-btn-link {
          text-decoration: none;
        }

        .summary-trust-badges {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px dashed var(--color-border-subtle);
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .trust-icon {
          color: var(--color-primary);
        }
      `}</style>
    </Card>
  );
};

export default CartSummary;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import CartItemRow from '../../components/cart/CartItemRow';
import CartSummary from '../../components/cart/CartSummary';
import EmptyCart from '../../components/cart/EmptyCart';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { couponService } from '../../services/couponService';

/**
 * FitBite Interactive Shopping Cart Page
 */
export const CartPage = () => {
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    estimatedTotal,
    freeShippingQualified,
    hasOutOfStockItems,
    isLoading,
    updatingItemId,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Auto re-validate coupon if cart subtotal changes and coupon is active
  useEffect(() => {
    const revalidateActiveCoupon = async () => {
      if (!appliedCoupon || items.length === 0) return;
      try {
        const res = await couponService.validateCoupon(appliedCoupon.code);
        if (res && res.valid) {
          setAppliedCoupon(res);
        } else {
          setAppliedCoupon(null);
          toast.warning(`Coupon '${appliedCoupon.code}' was removed because cart items changed.`);
        }
      } catch (err) {
        setAppliedCoupon(null);
        toast.warning(err.message || `Coupon '${appliedCoupon.code}' is no longer valid for this cart.`);
      }
    };

    revalidateActiveCoupon();
  }, [subtotal, items.length]);

  const handleApplyCoupon = (couponData) => {
    setAppliedCoupon(couponData);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Coupon removed.');
  };

  const handleConfirmClear = async () => {
    try {
      setIsClearing(true);
      await clearCart();
      setAppliedCoupon(null);
      setClearModalOpen(false);
    } catch (err) {
      // Toast handled by context
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="container">
          <Spinner centered size="xl" label="Loading your performance cart..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || items.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="container">
          <EmptyCart isAuthenticated={isAuthenticated} />
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper animate-fadeIn">
      <div className="container">
        {/* Breadcrumb & Header */}
        <div className="cart-header-row">
          <div>
            <Link to="/products" className="back-link">
              <ArrowLeft size={16} /> Back to Catalog
            </Link>
            <h1 className="cart-title">
              Shopping Cart <span className="cart-count-pill">({itemCount} items)</span>
            </h1>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={() => setClearModalOpen(true)}
          >
            Clear Cart
          </Button>
        </div>

        {/* Warning if any item in cart is out of stock */}
        {hasOutOfStockItems && (
          <div className="out-of-stock-alert animate-fadeIn">
            <AlertCircle size={18} className="text-danger" />
            <span>
              Some items in your cart are currently out of stock or unavailable. Please adjust quantities before checkout.
            </span>
          </div>
        )}

        {/* 2-Column Cart Layout */}
        <div className="cart-grid">
          {/* Left Column: Cart Item Rows */}
          <div className="cart-items-column">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                isUpdating={updatingItemId === item.id}
              />
            ))}
          </div>

          {/* Right Column: Pricing & Checkout Summary */}
          <div className="cart-summary-column">
            <CartSummary
              subtotal={subtotal}
              shippingFee={shippingFee}
              estimatedTotal={estimatedTotal}
              freeShippingQualified={freeShippingQualified}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              disableCheckout={hasOutOfStockItems || items.length === 0}
            />
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <Modal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Clear Shopping Cart"
      >
        <div className="clear-modal-content">
          <p>Are you sure you want to remove all items from your shopping cart?</p>
          <div className="clear-modal-actions">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setClearModalOpen(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmClear}
              isLoading={isClearing}
            >
              Yes, Clear All
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .cart-page-wrapper {
          padding: var(--space-8) 0 var(--space-16);
          min-height: 60vh;
        }

        .cart-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          text-decoration: none;
          margin-bottom: var(--space-2);
          transition: color var(--transition-fast);
        }

        .back-link:hover {
          color: var(--color-primary);
        }

        .cart-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        @media (min-width: 768px) {
          .cart-title {
            font-size: var(--font-size-3xl);
          }
        }

        .cart-count-pill {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-normal);
          color: var(--color-text-muted);
        }

        .out-of-stock-alert {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-xs);
          color: var(--color-espresso);
          margin-bottom: var(--space-6);
        }

        .cart-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
        }

        @media (min-width: 1024px) {
          .cart-grid {
            grid-template-columns: 1fr 380px;
            align-items: start;
          }
        }

        .cart-items-column {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .clear-modal-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .clear-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
};

export default CartPage;

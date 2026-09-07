import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertCircle, ShoppingBag } from 'lucide-react';
import CheckoutSteps from '../../components/checkout/CheckoutSteps';
import AddressSelector from '../../components/checkout/AddressSelector';
import PaymentSelector from '../../components/checkout/PaymentSelector';
import OrderSummarySidebar from '../../components/checkout/OrderSummarySidebar';
import OrderSuccessView from '../../components/checkout/OrderSuccessView';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addressService } from '../../services/addressService';
import { orderService } from '../../services/orderService';
import { couponService } from '../../services/couponService';

/**
 * FitBite Multi-Step Secure Checkout Page
 */
export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, shippingFee, estimatedTotal, freeShippingQualified, fetchCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [paymentReference, setPaymentReference] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [error, setError] = useState(null);

  // Load Saved Addresses
  const loadAddresses = useCallback(async () => {
    try {
      setIsLoadingAddresses(true);
      const list = await addressService.getAddresses();
      setAddresses(list || []);

      // Pre-select default address or first address
      if (list && list.length > 0) {
        const defaultAddr = list.find((a) => a.is_default) || list[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.warn('Failed to load addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated, loadAddresses]);

  // Handle Add New Address
  const handleAddNewAddress = async (formData) => {
    try {
      setIsCreatingAddress(true);
      const newAddr = await addressService.createAddress(formData);
      toast.success('Delivery address saved!');
      await loadAddresses();
      if (newAddr && newAddr.id) {
        setSelectedAddressId(newAddr.id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save address.');
      throw err;
    } finally {
      setIsCreatingAddress(false);
    }
  };

  // Handle Place Order Submission
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.warning('Please select or add a delivery address to proceed.');
      return;
    }

    if (items.length === 0) {
      toast.warning('Your shopping cart is empty.');
      navigate('/cart');
      return;
    }

    try {
      setIsSubmittingOrder(true);
      setError(null);

      const orderPayload = {
        shipping_address_id: selectedAddressId,
        payment_method: selectedPaymentMethod,
        payment_reference_id: paymentReference.trim() || undefined,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        delivery_notes: deliveryNotes.trim() || undefined,
      };

      const result = await orderService.createOrder(orderPayload);
      const orderData = result?.data || result;

      if (!orderData || !orderData.order_number) {
        throw new Error('Order creation failed on server.');
      }

      setPlacedOrder(orderData);
      toast.success(`Order #${orderData.order_number} confirmed!`);

      // Refresh cart context so cart state becomes empty
      await fetchCart();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Order submission error:', err);
      const msg = err.message || 'Failed to place order. Please check your cart items.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // If order was placed, display Success Confirmation View
  if (placedOrder) {
    return (
      <div className="checkout-page-root animate-fadeIn">
        <div className="container">
          <CheckoutSteps currentStep={4} />
          <OrderSuccessView order={placedOrder} />
        </div>
      </div>
    );
  }

  // If cart is empty and no order placed
  if (!isLoadingAddresses && items.length === 0) {
    return (
      <div className="checkout-page-root">
        <div className="container empty-checkout-wrap">
          <Card padding="xl" className="empty-checkout-card glass-panel">
            <ShoppingBag size={48} className="text-primary" />
            <h2>No Items Ready For Checkout</h2>
            <p>Your shopping cart is currently empty. Add some performance fuel before checkout.</p>
            <Link to="/products">
              <Button variant="primary" size="lg">
                Explore Products
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-root animate-fadeIn">
      <div className="container">
        {/* Step Progress Tracker */}
        <CheckoutSteps currentStep={3} />

        {/* Header Link */}
        <div className="checkout-header-row">
          <Link to="/cart" className="back-link">
            <ArrowLeft size={16} /> Return to Cart
          </Link>
          <h1 className="checkout-title">Secure Express Checkout</h1>
        </div>

        {error && (
          <div className="checkout-error-banner animate-fadeIn">
            <AlertCircle size={18} className="text-danger" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Main Checkout Layout */}
        <div className="checkout-grid">
          {/* Left Column: Address Selection & Payment Method */}
          <div className="checkout-main-column">
            {/* 1. Delivery Address Selection */}
            <Card padding="lg" className="checkout-section-card glass-panel">
              {isLoadingAddresses ? (
                <Spinner centered size="md" label="Loading saved addresses..." />
              ) : (
                <AddressSelector
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={(id) => setSelectedAddressId(id)}
                  onAddNewAddress={handleAddNewAddress}
                  isCreatingAddress={isCreatingAddress}
                />
              )}
            </Card>

            {/* 2. Payment Method Selection */}
            <Card padding="lg" className="checkout-section-card glass-panel">
              <PaymentSelector
                selectedMethod={selectedPaymentMethod}
                onSelectMethod={(method) => setSelectedPaymentMethod(method)}
                paymentReference={paymentReference}
                onChangeReference={(val) => setPaymentReference(val)}
              />
            </Card>
          </div>

          {/* Right Column: Order Summary & Placement Sidebar */}
          <div className="checkout-sidebar-column">
            <OrderSummarySidebar
              items={items}
              subtotal={subtotal}
              shippingFee={shippingFee}
              estimatedTotal={estimatedTotal}
              freeShippingQualified={freeShippingQualified}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={(c) => setAppliedCoupon(c)}
              onRemoveCoupon={() => setAppliedCoupon(null)}
              deliveryNotes={deliveryNotes}
              onChangeDeliveryNotes={(n) => setDeliveryNotes(n)}
              onPlaceOrder={handlePlaceOrder}
              isSubmitting={isSubmittingOrder}
              submitDisabled={!selectedAddressId || items.length === 0}
              selectedPaymentMethod={selectedPaymentMethod}
            />
          </div>
        </div>
      </div>

      <style>{`
        .checkout-page-root {
          padding: var(--space-6) 0 var(--space-16);
          min-height: 70vh;
        }

        .checkout-header-row {
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

        .checkout-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
        }

        @media (min-width: 768px) {
          .checkout-title {
            font-size: var(--font-size-3xl);
          }
        }

        .checkout-error-banner {
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

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
        }

        @media (min-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr 380px;
            align-items: start;
          }
        }

        .checkout-main-column {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .checkout-section-card {
          background: #ffffff;
        }

        .empty-checkout-wrap {
          display: flex;
          justify-content: center;
          padding: var(--space-12) 0;
        }

        .empty-checkout-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-4);
          max-width: 500px;
          background: #ffffff;
        }

        .empty-checkout-card h2 {
          font-family: var(--font-heading);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .empty-checkout-card p {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;

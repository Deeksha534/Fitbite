import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import TrackingTimeline from '../../components/orders/TrackingTimeline';
import TaxInvoiceModal from '../../components/orders/TaxInvoiceModal';
import CancelOrderModal from '../../components/orders/CancelOrderModal';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Truck,
  FileText,
  Repeat,
  XCircle,
  Copy,
  Check,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/**
 * OrderDetailPage Component
 * In-depth order view with full line items, delivery snapshot, live tracking timeline,
 * financial totals, invoice downloading, and cancellation.
 */
export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Modals
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const { addToCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getOrderById(id);
      const data = res?.order || res?.data?.order || res?.data || res;
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError(err.response?.data?.message || err.message || 'Order not found or permission denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReorderItem = async (item) => {
    if (!item?.product_id) return;
    try {
      await addToCart(item.product_id, item.quantity || 1);
      toast.success(`Added ${item.product_name} (${item.quantity} units) to your cart!`);
      navigate('/cart');
    } catch (err) {
      toast.error('Could not add item to cart: ' + (err.message || 'Out of stock'));
    }
  };

  const handleReorderAll = async () => {
    if (!order?.items || order.items.length === 0) return;
    try {
      setReordering(true);
      let successCount = 0;
      for (const item of order.items) {
        if (item.product_id) {
          try {
            await addToCart(item.product_id, item.quantity || 1);
            successCount++;
          } catch (_) {}
        }
      }
      if (successCount > 0) {
        toast.success(`Added ${successCount} item(s) to your cart!`);
        navigate('/cart');
      } else {
        toast.error('Items could not be re-ordered. They may be out of stock.');
      }
    } catch (err) {
      toast.error('Re-order failed: ' + err.message);
    } finally {
      setReordering(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'shipped':
        return <Badge variant="info">Shipped & In Transit</Badge>;
      case 'packed':
        return <Badge variant="warning">Packed & Ready</Badge>;
      case 'confirmed':
        return <Badge variant="primary">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Processing</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Processing'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="order-detail-loading-wrapper">
        <Spinner size="lg" />
        <p>Retrieving order details and fulfillment timeline...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container section">
        <Card glass padding="xl" className="order-error-card">
          <AlertCircle size={44} className="text-danger mb-3" />
          <h2>Order Not Found</h2>
          <p className="text-secondary">{error || 'Could not find the requested order.'}</p>
          <div className="mt-4">
            <Link to="/account/orders">
              <Button variant="primary">
                <ArrowLeft size={16} />
                <span>Return to Order History</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const items = order.items || [];
  const address = order.shipping_address_snapshot || {};
  const isPending = order.order_status === 'pending';
  const isCancelled = order.order_status === 'cancelled';

  return (
    <div className="order-detail-page">
      <div className="container section">
        {/* Back Link */}
        <div className="mb-4">
          <Link to="/account/orders" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to All Orders</span>
          </Link>
        </div>

        {/* Hero Header Card */}
        <Card glass padding="lg" className="order-hero-card mb-4 animate-fadeIn">
          <div className="hero-header-flex">
            <div>
              <div className="order-number-title-row">
                <h1 className="order-hero-number">Order {order.order_number}</h1>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={handleCopyOrderNumber}
                  title="Copy Order Number"
                >
                  {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="order-hero-meta">
                <span>
                  <Calendar size={13} /> Placed on {formatDate(order.created_at)}
                </span>
                <span>•</span>
                <span>
                  <CreditCard size={13} /> {order.payment_method?.toUpperCase()} (
                  <strong className={order.payment_status === 'paid' ? 'text-emerald' : 'text-amber'}>
                    {order.payment_status?.toUpperCase()}
                  </strong>
                  )
                </span>
              </div>
            </div>

            <div className="order-hero-badges">
              {getStatusBadge(order.order_status)}
            </div>
          </div>

          <div className="hero-actions-row">
            {!isCancelled && (
              <Link to={`/track?orderNumber=${encodeURIComponent(order.order_number)}`}>
                <Button variant="primary" size="sm">
                  <Truck size={14} />
                  <span>Live Package Tracking</span>
                </Button>
              </Link>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowInvoice(true)}>
              <FileText size={14} />
              <span>Download Tax Invoice</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleReorderAll} isLoading={reordering}>
              <Repeat size={14} />
              <span>Buy All Again</span>
            </Button>

            {isPending && (
              <Button variant="danger" size="sm" onClick={() => setShowCancel(true)}>
                <XCircle size={14} />
                <span>Cancel Order</span>
              </Button>
            )}
          </div>
        </Card>

        {/* Two-Column Grid */}
        <div className="order-grid-layout">
          {/* Left Column: Items and Timeline */}
          <div className="order-main-col">
            {/* Fulfillment Timeline Card */}
            <Card glass padding="lg" className="mb-4">
              <h3 className="section-card-title">Fulfillment Progress</h3>
              <div className="timeline-container">
                <TrackingTimeline
                  currentStageIndex={
                    order.order_status === 'delivered'
                      ? 5
                      : order.order_status === 'shipped'
                      ? 4
                      : order.order_status === 'packed'
                      ? 3
                      : order.order_status === 'confirmed' || order.payment_status === 'paid'
                      ? 2
                      : 1
                  }
                  isCancelled={isCancelled}
                />
              </div>
            </Card>

            {/* Line Items Card */}
            <Card glass padding="lg" className="mb-4">
              <h3 className="section-card-title">
                Package Contents ({items.length} Item{items.length !== 1 ? 's' : ''})
              </h3>
              <div className="order-detail-items-list">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="detail-item-row">
                    <div className="detail-item-img-wrap">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="detail-item-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="detail-item-fallback"
                        style={{ display: item.product_image ? 'none' : 'flex' }}
                      >
                        <Package size={24} />
                      </div>
                    </div>

                    <div className="detail-item-info">
                      <h4 className="detail-item-name">{item.product_name}</h4>
                      <div className="detail-item-badges">
                        {item.product_flavor && (
                          <span className="flavor-pill">{item.product_flavor}</span>
                        )}
                        <span className="qty-pill">Qty: {item.quantity}</span>
                        <span className="unit-price">
                          ₹{Number(item.unit_price).toFixed(2)} each
                        </span>
                      </div>
                    </div>

                    <div className="detail-item-pricing">
                      <div className="item-line-price">
                        ₹{Number(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="buy-item-again-btn"
                        onClick={() => handleReorderItem(item)}
                      >
                        <Repeat size={12} />
                        <span>Buy Again</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Address & Summary */}
          <div className="order-sidebar-col">
            {/* Delivery Destination Card */}
            <Card glass padding="lg" className="mb-4">
              <h3 className="section-card-title">Delivery Destination</h3>
              <div className="address-content">
                <div className="address-person">
                  <User size={15} className="text-primary" />
                  <strong>{address.full_name || 'Recipient'}</strong>
                </div>
                {address.phone && (
                  <div className="address-phone">
                    <Phone size={14} />
                    <span>{address.phone}</span>
                  </div>
                )}
                <div className="address-location">
                  <MapPin size={14} />
                  <span>
                    {address.street_address || address.street}
                    {address.apartment ? `, ${address.apartment}` : ''}
                    <br />
                    {address.city}, {address.state} - {address.postal_code}
                    <br />
                    {address.country || 'India'}
                  </span>
                </div>
              </div>

              {order.delivery_notes && (
                <div className="delivery-note-box">
                  <strong>Delivery Instructions:</strong>
                  <p>"{order.delivery_notes}"</p>
                </div>
              )}
            </Card>

            {/* Financial Summary Breakdown */}
            <Card glass padding="lg" className="mb-4">
              <h3 className="section-card-title">Payment & Totals</h3>
              <div className="financial-breakdown-list">
                <div className="fin-row">
                  <span>Subtotal</span>
                  <span>₹{Number(order.subtotal_amount).toFixed(2)}</span>
                </div>

                {Number(order.discount_amount) > 0 && (
                  <div className="fin-row discount">
                    <span>
                      Coupon Savings {order.coupon_code ? `(${order.coupon_code})` : ''}
                    </span>
                    <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}

                <div className="fin-row">
                  <span>Shipping Fee</span>
                  <span>
                    {Number(order.shipping_fee) === 0 ? (
                      <span className="text-emerald font-bold">FREE</span>
                    ) : (
                      `₹${Number(order.shipping_fee).toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="fin-row total-row">
                  <span>Grand Total</span>
                  <span>₹{Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="payment-security-note">
                <ShieldCheck size={14} className="text-emerald" />
                <span>GST Tax Invoice generated and stored securely.</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <TaxInvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          orderId={order.id}
        />

        <CancelOrderModal
          isOpen={showCancel}
          onClose={() => setShowCancel(false)}
          order={order}
          onSuccess={() => loadOrderDetails()}
        />
      </div>

      <style>{`
        .order-detail-page {
          min-height: calc(100vh - 200px);
          padding-bottom: 60px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--color-primary-light, #c87a3e);
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          transition: transform 0.15s ease;
        }

        .back-link:hover {
          transform: translateX(-3px);
        }

        .order-hero-card {
          margin-bottom: 24px;
        }

        .hero-header-flex {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .order-number-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .order-hero-number {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 0;
        }

        .copy-btn {
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.08);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          border-radius: 4px;
          padding: 4px 6px;
          cursor: pointer;
        }

        .order-hero-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          flex-wrap: wrap;
        }

        .hero-actions-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          border-top: 1px solid var(--color-border);
          padding-top: 16px;
        }

        .order-grid-layout {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
        }

        .section-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 16px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 10px;
        }

        .order-detail-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-item-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(var(--color-border-rgb, 255, 255, 255), 0.06);
        }

        .detail-item-row:last-child {
          border-bottom: none;
        }

        .detail-item-img-wrap {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-md, 8px);
          overflow: hidden;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.05);
          border: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .detail-item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .detail-item-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }

        .detail-item-info {
          flex-grow: 1;
          min-width: 0;
        }

        .detail-item-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 6px;
        }

        .detail-item-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }

        .flavor-pill {
          background: rgba(var(--color-primary-rgb, 200, 122, 62), 0.12);
          color: var(--color-primary-light, #c87a3e);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .detail-item-pricing {
          text-align: right;
          flex-shrink: 0;
        }

        .item-line-price {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }

        .buy-item-again-btn {
          font-size: 0.75rem;
          padding: 2px 8px;
        }

        .address-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .address-person, .address-phone, .address-location {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .address-location span {
          line-height: 1.5;
        }

        .delivery-note-box {
          margin-top: 14px;
          padding: 10px 12px;
          background: rgba(var(--color-primary-rgb, 200, 122, 62), 0.06);
          border-radius: 6px;
          font-size: 0.825rem;
          color: var(--color-text-secondary);
        }

        .delivery-note-box p {
          margin: 4px 0 0;
          font-style: italic;
        }

        .financial-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .fin-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: var(--color-text-secondary);
        }

        .fin-row.discount {
          color: #10b981;
          font-weight: 600;
        }

        .fin-row.total-row {
          border-top: 1px solid var(--color-border);
          padding-top: 12px;
          margin-top: 4px;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-text-primary);
        }

        .payment-security-note {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.775rem;
          color: var(--color-text-muted);
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px dashed var(--color-border);
        }

        .text-emerald {
          color: #10b981;
        }

        .text-amber {
          color: #d97706;
        }

        .text-danger {
          color: #ef4444;
        }

        .order-detail-loading-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
          color: var(--color-text-secondary);
        }

        .order-error-card {
          text-align: center;
          padding: 60px 24px;
        }

        @media (max-width: 900px) {
          .order-grid-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetailPage;

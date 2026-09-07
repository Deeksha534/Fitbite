import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import {
  Package,
  Truck,
  FileText,
  Repeat,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Calendar,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/**
 * OrderCard Component
 * Displays a single customer order card in the order history list.
 *
 * @param {Object} props
 * @param {Object} props.order - Full order object from GET /orders
 * @param {Function} props.onOpenInvoice - Callback to open tax invoice modal (orderId)
 * @param {Function} props.onOpenCancel - Callback to open cancel confirmation modal (order)
 */
export const OrderCard = ({ order, onOpenInvoice, onOpenCancel }) => {
  const [copied, setCopied] = useState(false);
  const [reordering, setReordering] = useState(false);
  const { addToCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const handleCopyOrderNumber = (e) => {
    e.stopPropagation();
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReorder = async (e) => {
    e.stopPropagation();
    if (!order?.items || order.items.length === 0) return;

    try {
      setReordering(true);
      let successCount = 0;

      for (const item of order.items) {
        if (item.product_id) {
          try {
            await addToCart(item.product_id, item.quantity || 1);
            successCount++;
          } catch (itemErr) {
            console.warn(`Could not re-add item ${item.product_name}:`, itemErr);
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} item(s) from order ${order.order_number} to your cart!`);
        navigate('/cart');
      } else {
        toast.error('Could not re-order items. Products may be out of stock or unavailable.');
      }
    } catch (err) {
      toast.error('Failed to re-order items: ' + (err.message || 'Unknown error'));
    } finally {
      setReordering(false);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (_) {
      return dateStr;
    }
  };

  const items = order?.items || [];
  const itemCount = order?.item_count || items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const isPending = order?.order_status === 'pending';
  const isCancelled = order?.order_status === 'cancelled';
  const shippingAddr = order?.shipping_address_snapshot || {};

  return (
    <Card glass padding="lg" className="order-card-root animate-fadeIn">
      {/* Card Header */}
      <div className="order-card-header">
        <div className="order-id-group">
          <div className="order-number-row">
            <span className="order-number-label">Order</span>
            <span className="order-number-text">{order.order_number}</span>
            <button
              type="button"
              className="copy-order-btn"
              onClick={handleCopyOrderNumber}
              title="Copy Order Number"
              aria-label="Copy Order Number"
            >
              {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="order-meta-info">
            <span className="order-meta-item">
              <Calendar size={13} />
              <span>Placed on {formatDate(order.created_at)}</span>
            </span>
            <span className="meta-separator">•</span>
            <span className="order-meta-item">
              <CreditCard size={13} />
              <span className="text-capitalize">{order.payment_method?.toUpperCase()}</span>
              <span className={`payment-pill ${order.payment_status === 'paid' ? 'is-paid' : 'is-unpaid'}`}>
                {order.payment_status?.toUpperCase() || 'UNPAID'}
              </span>
            </span>
          </div>
        </div>

        <div className="order-status-group">
          {getStatusBadge(order.order_status)}
        </div>
      </div>

      <div className="order-card-divider" />

      {/* Card Body: Items Preview */}
      <div className="order-items-preview-list">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="order-item-row">
            <div className="order-item-media">
              {item.product_image ? (
                <img
                  src={item.product_image}
                  alt={item.product_name || 'Product'}
                  className="order-item-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="order-item-img-fallback"
                style={{ display: item.product_image ? 'none' : 'flex' }}
              >
                <Package size={20} />
              </div>
            </div>

            <div className="order-item-details">
              <h5 className="order-item-name">{item.product_name}</h5>
              <div className="order-item-submeta">
                {item.product_flavor && (
                  <span className="order-item-flavor">{item.product_flavor}</span>
                )}
                <span className="order-item-qty">Qty: {item.quantity}</span>
                <span className="order-item-price">
                  ₹{Number(item.unit_price).toFixed(2)} each
                </span>
              </div>
            </div>

            <div className="order-item-line-total">
              ₹{Number(item.total_price || (item.unit_price * item.quantity)).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Address & Note Snippet */}
      {shippingAddr?.city && (
        <div className="order-address-snippet">
          <MapPin size={14} className="address-icon" />
          <span>
            Delivering to {shippingAddr.full_name || 'Recipient'} in {shippingAddr.city}, {shippingAddr.state}
          </span>
        </div>
      )}

      <div className="order-card-divider" />

      {/* Card Footer: Financial Total & Actions */}
      <div className="order-card-footer">
        <div className="order-total-summary">
          <span className="order-total-label">Total Amount ({itemCount} item{itemCount !== 1 ? 's' : ''}):</span>
          <span className="order-total-value">₹{Number(order.total_amount).toFixed(2)}</span>
        </div>

        <div className="order-card-actions">
          {/* Track Order */}
          {!isCancelled && (
            <Link
              to={`/track?orderNumber=${encodeURIComponent(order.order_number)}`}
              className="action-btn-link"
            >
              <Button variant="outline" size="sm">
                <Truck size={14} />
                <span>Track Package</span>
              </Button>
            </Link>
          )}

          {/* Tax Invoice */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenInvoice && onOpenInvoice(order.id)}
          >
            <FileText size={14} />
            <span>Invoice</span>
          </Button>

          {/* Re-order */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReorder}
            isLoading={reordering}
          >
            <Repeat size={14} />
            <span>Buy Again</span>
          </Button>

          {/* Cancel Order (Pending Only) */}
          {isPending && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onOpenCancel && onOpenCancel(order)}
            >
              <XCircle size={14} />
              <span>Cancel</span>
            </Button>
          )}

          {/* View Details Link */}
          <Link
            to={`/account/orders/${order.id || order.order_number}`}
            className="action-btn-link"
          >
            <Button variant="primary" size="sm">
              <span>Details</span>
              <ChevronRight size={14} />
            </Button>
          </Link>
        </div>
      </div>

      <style>{`
        .order-card-root {
          margin-bottom: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .order-card-root:hover {
          border-color: var(--color-primary-light, rgba(200, 122, 62, 0.4));
        }

        .order-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .order-number-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .order-number-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .order-number-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.01em;
        }

        .copy-order-btn {
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.08);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          border-radius: 4px;
          padding: 4px 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .copy-order-btn:hover {
          color: var(--color-primary, #c87a3e);
          border-color: var(--color-primary, #c87a3e);
        }

        .order-meta-info {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.825rem;
          color: var(--color-text-secondary);
          flex-wrap: wrap;
        }

        .order-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .meta-separator {
          color: var(--color-border);
        }

        .payment-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 4px;
        }

        .payment-pill.is-paid {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .payment-pill.is-unpaid {
          background: rgba(217, 119, 6, 0.15);
          color: #d97706;
        }

        .order-card-divider {
          height: 1px;
          background: var(--color-border);
          margin: 16px 0;
        }

        .order-items-preview-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-item-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 0;
        }

        .order-item-media {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md, 8px);
          overflow: hidden;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.04);
          border: 1px solid var(--color-border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .order-item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .order-item-img-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }

        .order-item-details {
          flex-grow: 1;
          min-width: 0;
        }

        .order-item-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-item-submeta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }

        .order-item-flavor {
          background: rgba(var(--color-primary-rgb, 200, 122, 62), 0.12);
          color: var(--color-primary-light, #c87a3e);
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .order-item-line-total {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text-primary);
          flex-shrink: 0;
        }

        .order-address-snippet {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 12px;
          padding: 6px 10px;
          border-radius: 6px;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.02);
        }

        .order-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .order-total-summary {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .order-total-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .order-total-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-primary-light, #c87a3e);
        }

        .order-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn-link {
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .order-card-header {
            flex-direction: column;
          }
          .order-card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          .order-card-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </Card>
  );
};

export default OrderCard;

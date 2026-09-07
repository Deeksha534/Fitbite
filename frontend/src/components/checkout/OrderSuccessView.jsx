import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  FileText,
  MapPin,
  CreditCard,
  Package,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';

/**
 * Order Confirmation & Success Receipt Component
 */
export const OrderSuccessView = ({ order }) => {
  const [copied, setCopied] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const toast = useToast();

  if (!order) return null;

  const address = order.shipping_address_snapshot || {};
  const isPaid = order.payment_status === 'paid';

  const handleCopyOrderNumber = () => {
    if (order.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      toast.success('Order number copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFetchInvoice = async () => {
    try {
      setIsLoadingInvoice(true);
      setInvoiceModalOpen(true);
      const data = await orderService.getInvoice(order.id);
      setInvoiceData(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load commercial tax invoice.');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  return (
    <div className="order-success-view">
      <Card padding="xl" className="success-header-card glass-panel">
        <div className="success-icon-circle animate-bounce">
          <CheckCircle2 size={52} className="text-success" />
        </div>

        <h1 className="success-title">Order Confirmed!</h1>
        <p className="success-subtitle">
          Thank you for fueling your ambition with FitBite. We have received your order and our laboratory is preparing fresh batch dispatch.
        </p>

        {/* Order Number Badge */}
        <div className="order-number-pill" onClick={handleCopyOrderNumber}>
          <span className="order-number-label">Order Number:</span>
          <strong className="order-number-val">{order.order_number}</strong>
          <button type="button" className="copy-btn" aria-label="Copy order number">
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          </button>
        </div>
      </Card>

      {/* Order Breakdown Grid */}
      <div className="success-details-grid">
        {/* Left Column: Delivery & Payment Details */}
        <div className="success-col-left">
          {/* Delivery Address Card */}
          <Card padding="lg" className="detail-section-card">
            <div className="detail-section-header">
              <MapPin size={18} className="text-primary" />
              <h4>Delivery Destination</h4>
            </div>
            <div className="address-snapshot-content">
              <strong>{address.full_name || 'Customer'}</strong>
              <p>
                {address.street_address}
                {address.apartment ? `, ${address.apartment}` : ''}
              </p>
              <p>
                {address.city}, {address.state} — {address.postal_code}
              </p>
              <p className="text-subtle">Phone: {address.phone}</p>
            </div>
          </Card>

          {/* Payment & Settlement Card */}
          <Card padding="lg" className="detail-section-card">
            <div className="detail-section-header">
              <CreditCard size={18} className="text-primary" />
              <h4>Payment & Settlement</h4>
            </div>
            <div className="payment-snapshot-content">
              <div className="snapshot-row">
                <span>Payment Method:</span>
                <strong className="text-uppercase">{order.payment_method || 'Card'}</strong>
              </div>
              <div className="snapshot-row">
                <span>Payment Status:</span>
                <Badge variant={isPaid ? 'success' : 'warning'} size="sm">
                  {isPaid ? 'Paid & Verified' : 'Cash on Delivery (Pending)'}
                </Badge>
              </div>
              {order.payment_reference_id && (
                <div className="snapshot-row">
                  <span>Reference ID:</span>
                  <span className="text-muted">{order.payment_reference_id}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Ordered Items & Financial Summary */}
        <div className="success-col-right">
          <Card padding="lg" className="detail-section-card">
            <div className="detail-section-header">
              <Package size={18} className="text-primary" />
              <h4>Ordered Performance Fuel</h4>
            </div>

            <div className="ordered-items-list">
              {(order.items || []).map((item) => (
                <div key={item.id} className="ordered-item-row">
                  <div className="ordered-item-img-wrap">
                    <img
                      src={item.product_image_snapshot || '/images/protein-combo.jpeg'}
                      alt={item.product_name_snapshot}
                      className="ordered-item-img"
                      onError={(e) => {
                        e.target.src = '/images/protein-combo.jpeg';
                      }}
                    />
                  </div>
                  <div className="ordered-item-info">
                    <span className="item-name">{item.product_name_snapshot}</span>
                    {item.product_flavor_snapshot && (
                      <span className="item-flavor">{item.product_flavor_snapshot}</span>
                    )}
                    <span className="item-qty-text">
                      Qty: {item.quantity} × ₹{Number(item.unit_price_snapshot).toFixed(2)}
                    </span>
                  </div>
                  <div className="ordered-item-price">
                    ₹{Number(item.total_price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="order-final-financials">
              <div className="fin-row">
                <span>Items Subtotal:</span>
                <strong>₹{Number(order.subtotal_amount || 0).toFixed(2)}</strong>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="fin-row discount-row">
                  <span>Promotional Discount:</span>
                  <strong className="text-success">-₹{Number(order.discount_amount).toFixed(2)}</strong>
                </div>
              )}
              <div className="fin-row">
                <span>Shipping Delivery:</span>
                <span>
                  {Number(order.shipping_fee) === 0 ? (
                    <strong className="text-success">FREE</strong>
                  ) : (
                    `₹${Number(order.shipping_fee).toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="fin-divider" />
              <div className="fin-row fin-total-row">
                <span>Total Amount Paid:</span>
                <strong className="total-accent">₹{Number(order.total_amount || 0).toFixed(2)}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action CTA Group */}
      <div className="success-action-ctas">
        <Button
          variant="secondary"
          size="lg"
          leftIcon={<FileText size={18} />}
          onClick={handleFetchInvoice}
        >
          View Tax Invoice
        </Button>

        <Link to={`/track?orderNumber=${encodeURIComponent(order.order_number)}`}>
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
            Track Order Live
          </Button>
        </Link>

        <Link to="/products">
          <Button variant="secondary" size="lg">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* GST Commercial Tax Invoice Modal */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title={`Commercial GST Invoice — ${order.order_number}`}
        size="lg"
      >
        {isLoadingInvoice ? (
          <Spinner centered size="lg" label="Generating tax invoice breakdown..." />
        ) : invoiceData ? (
          <div className="invoice-container">
            <div className="invoice-header-row">
              <div>
                <h3 className="invoice-brand">FitBite Nutrition Labs</h3>
                <p className="invoice-subtext">Tax Invoice / Bill of Supply</p>
                <p className="invoice-subtext">GSTIN: {invoiceData.seller?.gstin || '29AABCF1234M1ZV'}</p>
              </div>
              <div className="invoice-meta-right">
                <p><strong>Invoice #:</strong> {invoiceData.invoice_number}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Order #:</strong> {order.order_number}</p>
              </div>
            </div>

            <div className="invoice-addresses-grid">
              <div className="invoice-box">
                <h5>Billed & Shipped To:</h5>
                <p><strong>{invoiceData.customer?.name || address.full_name}</strong></p>
                <p>{invoiceData.customer?.address || `${address.street_address}, ${address.city}`}</p>
                <p>{address.state} — {address.postal_code}</p>
              </div>
              <div className="invoice-box">
                <h5>Payment Summary:</h5>
                <p>Method: {order.payment_method?.toUpperCase()}</p>
                <p>Status: {order.payment_status?.toUpperCase()}</p>
              </div>
            </div>

            {/* Invoice Items Table */}
            <div className="invoice-table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceData.items || order.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.product_name || it.product_name_snapshot}</td>
                      <td>{it.quantity}</td>
                      <td>₹{Number(it.unit_price || it.unit_price_snapshot).toFixed(2)}</td>
                      <td>₹{Number(it.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GST Summary */}
            <div className="invoice-tax-breakdown">
              <div className="tax-row">
                <span>Taxable Amount:</span>
                <span>₹{Number(invoiceData.pricing_summary?.taxable_amount || order.subtotal_amount).toFixed(2)}</span>
              </div>
              <div className="tax-row">
                <span>CGST (9%):</span>
                <span>₹{Number(invoiceData.pricing_summary?.cgst_amount || 0).toFixed(2)}</span>
              </div>
              <div className="tax-row">
                <span>SGST (9%):</span>
                <span>₹{Number(invoiceData.pricing_summary?.sgst_amount || 0).toFixed(2)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="tax-row text-success">
                  <span>Coupon Discount:</span>
                  <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="tax-row tax-grand-total">
                <strong>Grand Total (Inclusive of GST):</strong>
                <strong>₹{Number(order.total_amount).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        ) : (
          <p>Invoice details unavailable.</p>
        )}
      </Modal>

      <style>{`
        .order-success-view {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
          max-width: 960px;
          margin: 0 auto;
          padding: var(--space-4) 0 var(--space-12);
        }

        .success-header-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-10) var(--space-6);
          background: #ffffff;
        }

        .success-icon-circle {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: rgba(22, 163, 74, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-4);
        }

        .success-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          margin-bottom: var(--space-2);
        }

        .success-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          max-width: 540px;
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-6);
        }

        .order-number-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: var(--color-cream-subtle);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .order-number-pill:hover {
          border-color: var(--color-primary);
          background: #ffffff;
        }

        .order-number-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
        }

        .order-number-val {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
          letter-spacing: 0.05em;
        }

        .copy-btn {
          background: transparent;
          border: none;
          color: var(--color-text-subtle);
          display: flex;
          align-items: center;
        }

        /* Grid */
        .success-details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }

        @media (min-width: 768px) {
          .success-details-grid {
            grid-template-columns: 1fr 1.2fr;
          }
        }

        .detail-section-card {
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .detail-section-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: var(--space-3);
        }

        .detail-section-header h4 {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .address-snapshot-content {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .payment-snapshot-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
        }

        .snapshot-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Ordered Items */
        .ordered-items-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: 240px;
          overflow-y: auto;
        }

        .ordered-item-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .ordered-item-img-wrap {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .ordered-item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ordered-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          font-size: var(--font-size-xs);
        }

        .ordered-item-info .item-name {
          font-family: var(--font-heading);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
        }

        .ordered-item-info .item-flavor {
          font-size: 0.68rem;
          color: var(--color-text-subtle);
        }

        .ordered-item-info .item-qty-text {
          font-size: 0.68rem;
          color: var(--color-text-muted);
        }

        .ordered-item-price {
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .order-final-financials {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
          font-size: var(--font-size-xs);
        }

        .fin-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .fin-divider {
          height: 1px;
          background: var(--color-border);
          margin: var(--space-1) 0;
        }

        .fin-total-row {
          font-size: var(--font-size-sm);
        }

        .total-accent {
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-primary);
        }

        .success-action-ctas {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        /* Invoice styling */
        .invoice-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          font-size: var(--font-size-xs);
          color: var(--color-text-main);
        }

        .invoice-header-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: var(--space-3);
        }

        .invoice-brand {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .invoice-addresses-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .invoice-box {
          background: var(--color-cream-subtle);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .invoice-box h5 {
          font-weight: var(--font-weight-bold);
          margin-bottom: 4px;
        }

        .invoice-table-wrap {
          overflow-x: auto;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoice-table th, .invoice-table td {
          padding: var(--space-2);
          text-align: left;
          border-bottom: 1px solid var(--color-border);
        }

        .invoice-table th {
          background: var(--color-cream-subtle);
          font-weight: var(--font-weight-bold);
        }

        .invoice-tax-breakdown {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          align-items: flex-end;
          padding-top: var(--space-2);
        }

        .tax-row {
          display: flex;
          justify-content: space-between;
          width: 260px;
        }

        .tax-grand-total {
          border-top: 1px solid var(--color-border);
          padding-top: var(--space-1);
          font-size: var(--font-size-sm);
        }
      `}</style>
    </div>
  );
};

export default OrderSuccessView;

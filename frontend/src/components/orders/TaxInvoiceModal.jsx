import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { Printer, Download, FileText, CheckCircle2, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';

/**
 * TaxInvoiceModal Component
 * Commercial GST Tax Invoice breakdown with printable layout and PDF download support.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Modal close handler
 * @param {string} props.orderId - Order UUID
 */
export const TaxInvoiceModal = ({ isOpen, onClose, orderId }) => {
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && orderId) {
      loadInvoice();
    } else {
      setInvoiceData(null);
    }
  }, [isOpen, orderId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const res = await orderService.getInvoice(orderId);
      const invoice = res?.invoice || res?.data?.invoice || res?.data || res;
      setInvoiceData(invoice);
    } catch (err) {
      toast.error('Failed to load tax invoice. ' + (err.response?.data?.message || err.message));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const seller = invoiceData?.seller || {};
  const order = invoiceData?.order || {};
  const customer = invoiceData?.customer || {};
  const items = invoiceData?.items || invoiceData?.line_items || [];
  const fin = invoiceData?.financial_breakdown || invoiceData?.financial_summary || {};
  const taxDetails = fin.tax_details || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commercial GST Tax Invoice"
      size="lg"
    >
      {loading ? (
        <div className="invoice-loading-center">
          <Spinner size="lg" />
          <p>Generating verified commercial tax invoice...</p>
        </div>
      ) : invoiceData ? (
        <div className="invoice-wrapper" id="printable-invoice">
          {/* Top Actions Bar (Hidden during print) */}
          <div className="invoice-actions-bar no-print">
            <div className="invoice-status-pill">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Official Tax Document • GST Compliant</span>
            </div>
            <div className="invoice-btn-group">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer size={15} />
                <span>Print Invoice</span>
              </Button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div className="invoice-sheet">
            {/* Header / Brand */}
            <div className="invoice-header">
              <div className="invoice-brand-col">
                <div className="invoice-logo">
                  <span className="logo-text">FIT<strong>BITE</strong></span>
                </div>
                <p className="seller-legal-name">{seller.legal_name || 'FitBite Nutrition Labs Private Limited'}</p>
                <p className="seller-meta">
                  {seller.registered_address || '100 Fitness Way, Indiranagar, Bengaluru, KA 560038'}
                </p>
                <p className="seller-meta">
                  GSTIN: <strong>{seller.gstin || '29AABCF1234M1ZV'}</strong> • PAN: <strong>{seller.pan || 'AABCF1234M'}</strong>
                </p>
                <p className="seller-meta">
                  Email: {seller.contact_email || 'billing@fitbite.in'} • Support: {seller.support_phone || '+91 80 4567 8900'}
                </p>
              </div>

              <div className="invoice-meta-col">
                <div className="tax-invoice-badge">TAX INVOICE</div>
                <table className="meta-table">
                  <tbody>
                    <tr>
                      <td>Invoice Number:</td>
                      <td><strong>{invoiceData.invoice_number || 'INV-' + (order.order_number || '')}</strong></td>
                    </tr>
                    <tr>
                      <td>Invoice Date:</td>
                      <td>{formatDate(invoiceData.invoice_date || order.order_date)}</td>
                    </tr>
                    <tr>
                      <td>Order Reference:</td>
                      <td><strong>{order.order_number}</strong></td>
                    </tr>
                    <tr>
                      <td>Place of Supply:</td>
                      <td>{invoiceData.place_of_supply || 'Karnataka (29)'}</td>
                    </tr>
                    <tr>
                      <td>Payment Mode:</td>
                      <td>{order.payment_method || 'ONLINE'} ({order.payment_status?.toUpperCase() || 'PAID'})</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="invoice-divider" />

            {/* Bill To & Ship To Grid */}
            <div className="invoice-parties-grid">
              <div className="party-card">
                <h5 className="party-title">Billed & Shipped To:</h5>
                <p className="party-name">{customer.recipient_name || 'Valued Athlete'}</p>
                <p className="party-address">
                  {customer.shipping_address?.street || customer.shipping_address?.street_address}
                  {customer.shipping_address?.apartment ? `, ${customer.shipping_address.apartment}` : ''}
                </p>
                <p className="party-address">
                  {customer.shipping_address?.city}, {customer.shipping_address?.state} - {customer.shipping_address?.postal_code}
                </p>
                <p className="party-contact">
                  Phone: {customer.contact_phone || 'N/A'} • Country: {customer.shipping_address?.country || 'India'}
                </p>
              </div>

              <div className="party-card">
                <h5 className="party-title">Invoice & Fulfillment Notes:</h5>
                <p className="party-note">
                  • 100% Authentic, Lab-Tested Whey Protein Formulation.
                </p>
                <p className="party-note">
                  • HSN Code 2106 90 99 (Food preparations for athletic nutrition).
                </p>
                <p className="party-note">
                  • GST Split: CGST 2.5% + SGST 2.5% (Total 5.0% GST Included).
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="invoice-table-container">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description of Goods</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Taxable Value</th>
                    <th>GST (5%)</th>
                    <th className="text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const qty = item.quantity || 1;
                    const unitPrice = Number(item.unit_price || item.unit_price_snapshot) || 0;
                    const totalVal = Number(item.total_price || (unitPrice * qty)) || 0;
                    const taxVal = Number((totalVal * 0.05).toFixed(2));
                    const taxableVal = Number((totalVal - taxVal).toFixed(2));

                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{item.product_name || item.product_name_snapshot}</strong>
                          {item.product_flavor || item.product_flavor_snapshot ? (
                            <span className="flavor-subtext"> — {item.product_flavor || item.product_flavor_snapshot}</span>
                          ) : null}
                        </td>
                        <td>21069099</td>
                        <td>{qty}</td>
                        <td>{formatCurrency(unitPrice)}</td>
                        <td>{formatCurrency(taxableVal)}</td>
                        <td>{formatCurrency(taxVal)}</td>
                        <td className="text-right font-bold">{formatCurrency(totalVal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div className="invoice-bottom-grid">
              <div className="invoice-declaration">
                <h6>Declaration</h6>
                <p>
                  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                  This is a computer-generated tax invoice and requires no physical signature under the Information Technology Act.
                </p>
              </div>

              <div className="invoice-totals-box">
                <table className="totals-table">
                  <tbody>
                    <tr>
                      <td>Subtotal (Taxable Value):</td>
                      <td className="text-right">{formatCurrency(fin.subtotal || order.subtotal_amount)}</td>
                    </tr>
                    {Number(fin.discount_amount || order.discount_amount) > 0 && (
                      <tr className="discount-row">
                        <td>Promo Discount:</td>
                        <td className="text-right">-{formatCurrency(fin.discount_amount || order.discount_amount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td>CGST (2.5%):</td>
                      <td className="text-right">{formatCurrency(fin.cgst || ((Number(fin.subtotal || order.subtotal_amount) * 0.05) / 2))}</td>
                    </tr>
                    <tr>
                      <td>SGST (2.5%):</td>
                      <td className="text-right">{formatCurrency(fin.sgst || ((Number(fin.subtotal || order.subtotal_amount) * 0.05) / 2))}</td>
                    </tr>
                    <tr>
                      <td>Shipping & Packaging:</td>
                      <td className="text-right">
                        {Number(fin.shipping_fee || order.shipping_fee) === 0 ? 'FREE' : formatCurrency(fin.shipping_fee || order.shipping_fee)}
                      </td>
                    </tr>
                    <tr className="grand-total-row">
                      <td>Grand Total (INR):</td>
                      <td className="text-right">{formatCurrency(fin.grand_total || order.total_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="invoice-footer">
              <p>Thank you for fueling your fitness journey with FitBite! For returns or support, email support@fitbite.in</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="invoice-empty">Invoice not found.</div>
      )}

      <style>{`
        .invoice-loading-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          gap: 16px;
          color: var(--color-text-secondary);
        }

        .invoice-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.04);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md, 8px);
          margin-bottom: 20px;
        }

        .invoice-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .text-emerald {
          color: #10b981;
        }

        .invoice-sheet {
          background: #ffffff;
          color: #1e1e1e;
          padding: 32px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .invoice-logo {
          font-size: 1.6rem;
          letter-spacing: -0.02em;
          color: #1e120d;
          margin-bottom: 4px;
        }

        .invoice-logo strong {
          color: #c87a3e;
        }

        .seller-legal-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
        }

        .seller-meta {
          font-size: 0.8rem;
          color: #4b5563;
          margin: 2px 0;
          line-height: 1.4;
        }

        .tax-invoice-badge {
          display: inline-block;
          background: #1e120d;
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          padding: 6px 16px;
          border-radius: 4px;
          margin-bottom: 12px;
          text-align: right;
        }

        .meta-table {
          font-size: 0.8rem;
          color: #374151;
        }

        .meta-table td {
          padding: 3px 6px;
        }

        .meta-table td:first-child {
          color: #6b7280;
        }

        .invoice-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 20px 0;
        }

        .invoice-parties-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .party-card {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #f3f4f6;
        }

        .party-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #6b7280;
          margin: 0 0 8px;
          letter-spacing: 0.05em;
        }

        .party-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
        }

        .party-address, .party-contact, .party-note {
          font-size: 0.825rem;
          color: #4b5563;
          margin: 2px 0;
          line-height: 1.4;
        }

        .invoice-table-container {
          overflow-x: auto;
          margin-bottom: 24px;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.825rem;
        }

        .invoice-table th {
          background: #1e120d;
          color: #ffffff;
          text-align: left;
          padding: 10px 12px;
          font-weight: 600;
        }

        .invoice-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }

        .flavor-subtext {
          color: #c87a3e;
          font-weight: 500;
        }

        .text-right {
          text-align: right;
        }

        .font-bold {
          font-weight: 700;
          color: #111827;
        }

        .invoice-bottom-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          margin-top: 16px;
        }

        .invoice-declaration {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .invoice-declaration h6 {
          font-size: 0.8rem;
          font-weight: 700;
          color: #374151;
          margin: 0 0 4px;
        }

        .totals-table {
          width: 100%;
          font-size: 0.85rem;
        }

        .totals-table td {
          padding: 4px 8px;
          color: #4b5563;
        }

        .discount-row td {
          color: #10b981;
          font-weight: 600;
        }

        .grand-total-row td {
          border-top: 2px solid #111827;
          padding-top: 8px;
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
        }

        .invoice-footer {
          margin-top: 28px;
          padding-top: 16px;
          border-top: 1px dashed #e5e7eb;
          text-align: center;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* PRINT STYLES */
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: transparent;
            box-shadow: none;
          }
          .invoice-sheet {
            box-shadow: none;
            border: none;
            padding: 0;
          }
        }
      `}</style>
    </Modal>
  );
};

export default TaxInvoiceModal;

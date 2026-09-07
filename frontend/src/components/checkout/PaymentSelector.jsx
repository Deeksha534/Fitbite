import React from 'react';
import { CreditCard, QrCode, Banknote, ShieldCheck, Check, Lock } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

/**
 * Payment method selection component matching backend Phase 3G payment capabilities.
 */
export const PaymentSelector = ({
  selectedMethod = 'card',
  onSelectMethod,
  paymentReference = '',
  onChangeReference,
}) => {
  const paymentMethods = [
    {
      id: 'card',
      title: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard, RuPay & Amex supported (Simulated Instant Clearance)',
      icon: CreditCard,
      badge: 'Fastest',
      badgeVariant: 'primary',
      requiresReference: false,
    },
    {
      id: 'upi',
      title: 'UPI / QR Code',
      subtitle: 'Google Pay, PhonePe, Paytm, BHIM UPI (Instant Confirmation)',
      icon: QrCode,
      badge: 'Popular',
      badgeVariant: 'success',
      requiresReference: false,
    },
    {
      id: 'cod',
      title: 'Cash on Delivery (COD)',
      subtitle: 'Pay with cash upon package receipt at your doorstep',
      icon: Banknote,
      badge: 'Doorstep',
      badgeVariant: 'secondary',
      requiresReference: false,
    },
  ];

  return (
    <div className="payment-selector-container">
      <div className="section-title-wrap">
        <CreditCard size={20} className="text-primary" />
        <h3 className="section-title-text">Select Payment Method</h3>
      </div>

      <div className="payment-methods-grid">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const Icon = method.icon;

          return (
            <div
              key={method.id}
              className={`payment-method-card ${isSelected ? 'payment-card-selected' : ''}`}
              onClick={() => onSelectMethod(method.id)}
            >
              <div className="payment-method-left">
                <div className={`method-icon-box ${isSelected ? 'icon-box-selected' : ''}`}>
                  <Icon size={20} />
                </div>
                <div className="method-info">
                  <div className="method-title-row">
                    <span className="method-title">{method.title}</span>
                    {method.badge && (
                      <Badge variant={method.badgeVariant} size="sm">
                        {method.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="method-subtitle">{method.subtitle}</p>
                </div>
              </div>

              <div className={`radio-circle ${isSelected ? 'radio-circle-selected' : ''}`}>
                {isSelected && <Check size={12} strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Payment Reference ID Input for Simulated Testing / Notes */}
      <div className="payment-reference-box">
        <label htmlFor="paymentRef" className="payment-ref-label">
          <Lock size={13} className="text-subtle" /> Optional Payment Reference ID / Transaction Tag
        </label>
        <input
          id="paymentRef"
          type="text"
          placeholder="e.g. TXN-SIM-12345 (Optional)"
          value={paymentReference}
          onChange={(e) => onChangeReference(e.target.value)}
          className="payment-ref-input"
          maxLength={255}
        />
        <span className="payment-ref-hint">
          Processed directly through FitBite transaction settlement engine.
        </span>
      </div>

      <div className="payment-security-footer">
        <ShieldCheck size={16} className="text-primary" />
        <span>End-to-end encrypted transaction with live PostgreSQL audit verification</span>
      </div>

      <style>{`
        .payment-selector-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          width: 100%;
        }

        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .section-title-text {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .payment-methods-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .payment-method-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          background: #ffffff;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .payment-method-card:hover {
          border-color: var(--color-primary-light);
          box-shadow: var(--shadow-sm);
        }

        .payment-card-selected {
          border-color: var(--color-primary);
          background: rgba(200, 122, 62, 0.03);
          box-shadow: 0 0 0 1px var(--color-primary);
        }

        .payment-method-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .method-icon-box {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          background: var(--color-cream-subtle);
          color: var(--color-espresso);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }

        .icon-box-selected {
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-color: var(--color-primary-subtle);
        }

        .method-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .method-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .method-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .method-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .radio-circle {
          width: 20px;
          height: 20px;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          flex-shrink: 0;
        }

        .radio-circle-selected {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #ffffff;
        }

        .payment-reference-box {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          background: var(--color-cream-subtle);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .payment-ref-label {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
        }

        .payment-ref-input {
          padding: 0.45rem 0.75rem;
          font-size: var(--font-size-xs);
          color: var(--color-espresso);
          background: #ffffff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .payment-ref-input:focus {
          border-color: var(--color-primary);
        }

        .payment-ref-hint {
          font-size: 0.68rem;
          color: var(--color-text-subtle);
        }

        .payment-security-footer {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          padding-top: var(--space-2);
        }
      `}</style>
    </div>
  );
};

export default PaymentSelector;

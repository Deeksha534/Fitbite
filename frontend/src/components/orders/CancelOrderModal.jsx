import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';

/**
 * CancelOrderModal Component
 * Confirmation dialog for cancelling a pending customer order.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Modal close handler
 * @param {Object} props.order - The order to be cancelled
 * @param {Function} props.onSuccess - Callback on successful cancellation
 */
export const CancelOrderModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('Changed my mind');
  const toast = useToast();

  if (!order) return null;

  const handleConfirmCancel = async () => {
    try {
      setLoading(true);
      await orderService.cancelOrder(order.id);
      toast.success(
        `Order ${order.order_number} has been cancelled and reserved inventory restored.`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to cancel order. Please contact support.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="Cancel Order Confirmation"
      size="md"
    >
      <div className="cancel-modal-content">
        <div className="cancel-modal-hero">
          <div className="cancel-icon-wrapper">
            <AlertTriangle size={28} />
          </div>
          <div className="cancel-hero-text">
            <h4 className="cancel-hero-title">Are you sure you want to cancel this order?</h4>
            <p className="cancel-order-tag">
              Order Number: <strong>{order.order_number}</strong>
            </p>
          </div>
        </div>

        <div className="cancel-warning-box">
          <ShieldAlert size={18} className="warning-icon" />
          <p className="warning-text">
            Cancelling this order will immediately release reserved stock back into the catalog.
            This action cannot be undone.
          </p>
        </div>

        <div className="cancel-reason-group">
          <label htmlFor="cancel-reason-select" className="cancel-reason-label">
            Reason for cancellation:
          </label>
          <select
            id="cancel-reason-select"
            className="cancel-reason-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
          >
            <option value="Changed my mind">Changed my mind</option>
            <option value="Ordered incorrect flavor or quantity">Ordered incorrect flavor or quantity</option>
            <option value="Need to change delivery address">Need to change delivery address</option>
            <option value="Found a better deal">Found a better deal</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="cancel-modal-actions">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Keep Order
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmCancel}
            isLoading={loading}
          >
            Yes, Cancel Order
          </Button>
        </div>
      </div>

      <style>{`
        .cancel-modal-content {
          padding: 8px 0;
        }

        .cancel-modal-hero {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .cancel-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cancel-hero-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 4px;
        }

        .cancel-order-tag {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .cancel-warning-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: var(--radius-md, 8px);
          padding: 14px;
          margin-bottom: 20px;
        }

        .cancel-warning-box .warning-icon {
          color: #ef4444;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .cancel-warning-box .warning-text {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.4;
        }

        .cancel-reason-group {
          margin-bottom: 24px;
        }

        .cancel-reason-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 8px;
        }

        .cancel-reason-select {
          width: 100%;
          padding: 10px 14px;
          border-radius: var(--radius-md, 8px);
          background: rgba(var(--color-surface-rgb, 255, 255, 255), 0.05);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
        }

        .cancel-reason-select:focus {
          border-color: var(--color-primary, #c87a3e);
        }

        .cancel-modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid var(--color-border);
          padding-top: 16px;
        }
      `}</style>
    </Modal>
  );
};

export default CancelOrderModal;

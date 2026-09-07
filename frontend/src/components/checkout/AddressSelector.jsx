import React, { useState } from 'react';
import { MapPin, Plus, Check, Phone, Home, Trash2, Edit2 } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import AddressForm from './AddressForm';

/**
 * Saved address selector component with add-address modal
 */
export const AddressSelector = ({
  addresses = [],
  selectedAddressId = null,
  onSelectAddress,
  onAddNewAddress,
  isCreatingAddress = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFormSubmit = async (formData) => {
    if (onAddNewAddress) {
      await onAddNewAddress(formData);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="address-selector-container">
      <div className="address-selector-header">
        <div className="section-title-wrap">
          <MapPin size={20} className="text-primary" />
          <h3 className="section-title-text">Select Delivery Address</h3>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setIsModalOpen(true)}
        >
          Add New Address
        </Button>
      </div>

      {/* Address Grid */}
      {addresses.length === 0 ? (
        <Card padding="lg" className="no-address-card">
          <MapPin size={32} className="no-address-icon" />
          <h4 className="no-address-title">No Saved Delivery Address Found</h4>
          <p className="no-address-desc">
            Please add a delivery address to complete your order dispatch.
          </p>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Delivery Address
          </Button>
        </Card>
      ) : (
        <div className="address-cards-grid">
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;

            return (
              <div
                key={addr.id}
                className={`address-card ${isSelected ? 'address-card-selected' : ''}`}
                onClick={() => onSelectAddress(addr.id)}
              >
                <div className="address-card-top">
                  <div className="address-recipient-info">
                    <span className="address-name">{addr.full_name}</span>
                    {addr.is_default && (
                      <Badge variant="primary" size="sm">
                        Default
                      </Badge>
                    )}
                  </div>

                  <div className={`radio-circle ${isSelected ? 'radio-circle-selected' : ''}`}>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <p className="address-lines">
                  {addr.street_address}
                  {addr.apartment ? `, ${addr.apartment}` : ''}
                  <br />
                  {addr.city}, {addr.state} — {addr.postal_code}
                </p>

                <div className="address-phone-row">
                  <Phone size={13} className="text-subtle" />
                  <span>{addr.phone}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Delivery Address"
        size="lg"
      >
        <AddressForm
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isCreatingAddress}
        />
      </Modal>

      <style>{`
        .address-selector-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          width: 100%;
        }

        .address-selector-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-3);
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

        .no-address-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-3);
          background: var(--color-cream-subtle);
          border: 1.5px dashed var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
        }

        .no-address-icon {
          color: var(--color-primary);
        }

        .no-address-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .no-address-desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          max-width: 320px;
        }

        .address-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }

        @media (min-width: 640px) {
          .address-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .address-card {
          padding: var(--space-4);
          background: #ffffff;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          position: relative;
        }

        .address-card:hover {
          border-color: var(--color-primary-light);
          box-shadow: var(--shadow-sm);
        }

        .address-card-selected {
          border-color: var(--color-primary);
          background: rgba(200, 122, 62, 0.03);
          box-shadow: 0 0 0 1px var(--color-primary);
        }

        .address-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .address-recipient-info {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .address-name {
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
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
          transition: all var(--transition-fast);
        }

        .radio-circle-selected {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #ffffff;
        }

        .address-lines {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .address-phone-row {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
};

export default AddressSelector;

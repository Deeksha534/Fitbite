import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

/**
 * Reusable Address Form for adding or editing customer delivery addresses
 */
export const AddressForm = ({
  initialValues = null,
  onSubmit,
  onCancel = null,
  isSubmitting = false,
  title = 'Add New Delivery Address',
}) => {
  const [formData, setFormData] = useState({
    full_name: initialValues?.full_name || '',
    phone: initialValues?.phone || '',
    street_address: initialValues?.street_address || '',
    apartment: initialValues?.apartment || '',
    city: initialValues?.city || '',
    state: initialValues?.state || '',
    postal_code: initialValues?.postal_code || '',
    country: initialValues?.country || 'India',
    is_default: initialValues?.is_default || false,
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      errs.full_name = 'Full name must be at least 2 characters';
    }
    const phoneRegex = /^[+]?[0-9\s-]{7,20}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.trim())) {
      errs.phone = 'Please provide a valid phone number';
    }
    if (!formData.street_address.trim() || formData.street_address.trim().length < 5) {
      errs.street_address = 'Street address must be at least 5 characters';
    }
    if (!formData.city.trim()) {
      errs.city = 'City is required';
    }
    if (!formData.state.trim()) {
      errs.state = 'State is required';
    }
    if (!formData.postal_code.trim() || formData.postal_code.trim().length < 3) {
      errs.postal_code = 'Valid postal code is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <form className="address-form" onSubmit={handleSubmit}>
      <h3 className="address-form-title">{title}</h3>

      <div className="form-grid-2">
        <Input
          label="Full Recipient Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          error={errors.full_name}
          placeholder="e.g. Alex Rivera"
          required
        />

        <Input
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="e.g. +91 98765 43210"
          required
        />
      </div>

      <Input
        label="Street Address / Building"
        name="street_address"
        value={formData.street_address}
        onChange={handleChange}
        error={errors.street_address}
        placeholder="e.g. 404 Innovation Drive, Sector 4"
        required
      />

      <Input
        label="Apartment, Suite, Landmark (Optional)"
        name="apartment"
        value={formData.apartment}
        onChange={handleChange}
        error={errors.apartment}
        placeholder="e.g. Flat 302, Tower B"
      />

      <div className="form-grid-3">
        <Input
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          error={errors.city}
          placeholder="e.g. Bengaluru"
          required
        />

        <Input
          label="State"
          name="state"
          value={formData.state}
          onChange={handleChange}
          error={errors.state}
          placeholder="e.g. Karnataka"
          required
        />

        <Input
          label="Postal / PIN Code"
          name="postal_code"
          value={formData.postal_code}
          onChange={handleChange}
          error={errors.postal_code}
          placeholder="e.g. 560038"
          required
        />
      </div>

      <div className="default-toggle-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="is_default"
            checked={formData.is_default}
            onChange={handleChange}
            className="styled-checkbox"
          />
          <span>Set as default shipping address</span>
        </label>
      </div>

      <div className="address-form-actions">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
        >
          Save Address
        </Button>
      </div>

      <style>{`
        .address-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          width: 100%;
        }

        .address-form-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: var(--space-2);
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 640px) {
          .form-grid-2 {
            grid-template-columns: 1fr 1fr;
          }
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 640px) {
          .form-grid-3 {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }

        .default-toggle-row {
          padding: var(--space-2) 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
          cursor: pointer;
        }

        .styled-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--color-primary);
          cursor: pointer;
        }

        .address-form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </form>
  );
};

export default AddressForm;

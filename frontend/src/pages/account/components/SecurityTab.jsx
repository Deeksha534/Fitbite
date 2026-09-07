import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Lock, Eye, EyeOff, ShieldCheck, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

export const SecurityTab = () => {
  const { changePassword } = useAuth();

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  // Live password validation checklist
  const newPw = formData.new_password;
  const checks = {
    length: newPw.length >= 8,
    uppercase: /[A-Z]/.test(newPw),
    lowercase: /[a-z]/.test(newPw),
    digit: /\d/.test(newPw),
    special: /[@$!%*?&#^_\-~]/.test(newPw),
  };
  const meetsAllChecks = Object.values(checks).every(Boolean);

  const validate = () => {
    const newErrors = {};

    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (!meetsAllChecks) {
      newErrors.new_password =
        'New password must meet all complexity requirements listed below';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Password confirmation is required';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Password confirmation does not match';
    }

    if (
      formData.current_password &&
      formData.new_password &&
      formData.current_password === formData.new_password
    ) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      setSuccessMessage('Password changed successfully! Please use your new password on next sign-in.');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="security-tab-content animate-fadeIn">
      <div className="tab-header">
        <h2 className="tab-title">Security & Credentials</h2>
        <p className="tab-subtitle">
          Update your account password to protect your orders and personal athlete data.
        </p>
      </div>

      {successMessage && (
        <div className="alert-box alert-success animate-slideDown">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert-box alert-error animate-slideDown">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="security-form" noValidate>
        {/* Current Password */}
        <Input
          label="Current Password"
          type={showCurrent ? 'text' : 'password'}
          id="current_password"
          name="current_password"
          autoComplete="current-password"
          placeholder="Enter current password"
          value={formData.current_password}
          onChange={handleChange}
          error={errors.current_password}
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowCurrent((prev) => !prev)}
              tabIndex={-1}
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          required
          disabled={isSubmitting}
        />

        {/* New Password */}
        <Input
          label="New Password"
          type={showNew ? 'text' : 'password'}
          id="new_password"
          name="new_password"
          autoComplete="new-password"
          placeholder="Min. 8 characters with upper, lower, number, symbol"
          value={formData.new_password}
          onChange={handleChange}
          error={errors.new_password}
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowNew((prev) => !prev)}
              tabIndex={-1}
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          required
          disabled={isSubmitting}
        />

        {/* Real-time Checklist Panel */}
        <div className="password-checklist-panel">
          <p className="checklist-title">Password Strength Requirements:</p>
          <div className="checklist-grid">
            <div className={`check-item ${checks.length ? 'is-valid' : ''}`}>
              {checks.length ? <Check size={13} /> : <X size={13} />}
              <span>At least 8 characters</span>
            </div>
            <div className={`check-item ${checks.uppercase ? 'is-valid' : ''}`}>
              {checks.uppercase ? <Check size={13} /> : <X size={13} />}
              <span>1 uppercase letter (A-Z)</span>
            </div>
            <div className={`check-item ${checks.lowercase ? 'is-valid' : ''}`}>
              {checks.lowercase ? <Check size={13} /> : <X size={13} />}
              <span>1 lowercase letter (a-z)</span>
            </div>
            <div className={`check-item ${checks.digit ? 'is-valid' : ''}`}>
              {checks.digit ? <Check size={13} /> : <X size={13} />}
              <span>1 number (0-9)</span>
            </div>
            <div className={`check-item ${checks.special ? 'is-valid' : ''}`}>
              {checks.special ? <Check size={13} /> : <X size={13} />}
              <span>1 special symbol (@$!%*?&#^_-~)</span>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <Input
          label="Confirm New Password"
          type={showConfirm ? 'text' : 'password'}
          id="confirm_password"
          name="confirm_password"
          autoComplete="new-password"
          placeholder="Re-enter new password"
          value={formData.confirm_password}
          onChange={handleChange}
          error={errors.confirm_password}
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirm((prev) => !prev)}
              tabIndex={-1}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          required
          disabled={isSubmitting}
        />

        <div className="form-actions">
          <Button
            type="submit"
            variant="espresso"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<ShieldCheck size={16} />}
          >
            Update Account Password
          </Button>
        </div>
      </form>

      <style>{`
        .security-tab-content {
          padding: var(--space-4) 0;
        }

        .tab-header {
          margin-bottom: var(--space-6);
        }

        .tab-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          margin-bottom: var(--space-1);
        }

        .tab-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .alert-box {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-5);
        }

        .alert-success {
          background: var(--color-success-bg);
          color: var(--color-success);
          border: 1px solid var(--color-success-border);
        }

        .alert-error {
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border: 1px solid var(--color-danger-border);
        }

        .security-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          max-width: 620px;
        }

        .password-toggle-btn {
          background: none;
          border: none;
          color: var(--color-text-subtle);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: color var(--transition-fast);
        }

        .password-toggle-btn:hover {
          color: var(--color-primary);
        }

        .password-checklist-panel {
          padding: var(--space-3) var(--space-4);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          margin: calc(-1 * var(--space-2)) 0 var(--space-2);
        }

        .checklist-title {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          margin-bottom: var(--space-2);
        }

        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-1);
        }

        @media (min-width: 640px) {
          .checklist-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .check-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 0.72rem;
          color: var(--color-text-subtle);
          transition: color var(--transition-fast);
        }

        .check-item.is-valid {
          color: var(--color-success);
          font-weight: var(--font-weight-medium);
        }

        .form-actions {
          margin-top: var(--space-2);
          display: flex;
        }
      `}</style>
    </div>
  );
};

export default SecurityTab;

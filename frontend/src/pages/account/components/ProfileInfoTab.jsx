import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { User, Phone, Image, FileText, Mail, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

export const ProfileInfoTab = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
    bio: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    } else if (formData.full_name.trim().length > 255) {
      newErrors.full_name = 'Full name cannot exceed 255 characters';
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[+]?[0-9\s\-()]{7,25}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid telephone number (7-25 digits)';
      }
    }

    if (formData.avatar_url && formData.avatar_url.trim()) {
      try {
        const parsed = new URL(formData.avatar_url.trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          newErrors.avatar_url = 'Avatar URL must start with http:// or https://';
        }
      } catch (_) {
        newErrors.avatar_url = 'Please enter a valid web URL';
      }
    }

    if (formData.bio && formData.bio.trim().length > 1000) {
      newErrors.bio = 'Bio cannot exceed 1000 characters';
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
      await updateProfile({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        avatar_url: formData.avatar_url.trim() || null,
        bio: formData.bio.trim() || null,
      });
      setSuccessMessage('Your profile changes have been saved successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-tab-content animate-fadeIn">
      <div className="tab-header">
        <h2 className="tab-title">Personal Information</h2>
        <p className="tab-subtitle">
          Manage your athlete profile details and contact information.
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

      <form onSubmit={handleSubmit} className="profile-edit-form" noValidate>
        {/* Read-Only Email Field */}
        <div className="fitbite-input-group">
          <div className="flex-between">
            <label className="input-label" htmlFor="user-email-static">
              Email Address
            </label>
            <Badge variant="success" size="sm">
              <CheckCircle2 size={11} /> Verified Account
            </Badge>
          </div>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Mail size={16} />
            </span>
            <input
              id="user-email-static"
              type="text"
              className="input-field with-left-icon"
              value={user?.email || ''}
              disabled
              readOnly
            />
          </div>
          <p className="input-helper-msg">
            Email address is tied to your primary login credentials and cannot be changed directly.
          </p>
        </div>

        {/* Full Name */}
        <Input
          label="Full Name"
          type="text"
          id="profile_full_name"
          name="full_name"
          autoComplete="name"
          placeholder="e.g. Alex Rivera"
          value={formData.full_name}
          onChange={handleChange}
          error={errors.full_name}
          leftIcon={<User size={16} />}
          required
          disabled={isSubmitting}
        />

        {/* Phone Number */}
        <Input
          label="Telephone / Mobile Number"
          type="tel"
          id="profile_phone"
          name="phone"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          helperText="Used for shipment notifications and courier delivery updates."
          leftIcon={<Phone size={16} />}
          disabled={isSubmitting}
        />

        {/* Avatar Image URL */}
        <Input
          label="Avatar Image URL (Optional)"
          type="url"
          id="profile_avatar_url"
          name="avatar_url"
          placeholder="https://images.example.com/athlete-avatar.jpg"
          value={formData.avatar_url}
          onChange={handleChange}
          error={errors.avatar_url}
          helperText="Provide a direct image link to display as your custom profile picture."
          leftIcon={<Image size={16} />}
          disabled={isSubmitting}
        />

        {/* Bio / Athletic Goals */}
        <Input
          label="Athlete Bio & Fitness Goals"
          multiline
          rows={3}
          id="profile_bio"
          name="bio"
          placeholder="Tell us about your fitness regimen (e.g. Marathon runner, daily gym enthusiast)..."
          value={formData.bio}
          onChange={handleChange}
          error={errors.bio}
          helperText={`${formData.bio ? formData.bio.length : 0} / 1000 characters`}
          leftIcon={<FileText size={16} />}
          disabled={isSubmitting}
        />

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Save size={16} />}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>

      <style>{`
        .profile-tab-content {
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

        .profile-edit-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          max-width: 620px;
        }

        .form-actions {
          margin-top: var(--space-2);
          display: flex;
        }
      `}</style>
    </div>
  );
};

export default ProfileInfoTab;

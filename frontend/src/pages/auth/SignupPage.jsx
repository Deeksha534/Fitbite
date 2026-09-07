import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus, ArrowRight, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const SignupPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[+]?[0-9\s\-()]{7,25}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
      });

      navigate('/account/profile', { replace: true });
    } catch (err) {
      const message = err?.message || 'Registration failed. Please try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page-container">
      <div className="container signup-grid-container">
        {/* Left Side: Athlete Perks & Brand Values */}
        <div className="signup-perks-panel">
          <div className="perks-badge">
            <Zap size={14} />
            <span>Join FitBite Athlete Club</span>
          </div>

          <h2 className="perks-title">Clean Fuel for Peak Performance</h2>
          <p className="perks-desc">
            Unlock athletic discounts, fast express shipping, macro-nutrient logging, and personalized nutrition recommendations.
          </p>

          <div className="perks-list">
            <div className="perk-item">
              <div className="perk-icon-wrap">
                <CheckCircle2 size={16} />
              </div>
              <div className="perk-text">
                <strong>20g+ Pure Protein per Bar</strong>
                <p>100% whey isolate & plant crisps with zero added cane sugars.</p>
              </div>
            </div>

            <div className="perk-item">
              <div className="perk-icon-wrap">
                <CheckCircle2 size={16} />
              </div>
              <div className="perk-text">
                <strong>Fast Express Delivery Across India</strong>
                <p>Free automated delivery on all orders over ₹499.</p>
              </div>
            </div>

            <div className="perk-item">
              <div className="perk-icon-wrap">
                <CheckCircle2 size={16} />
              </div>
              <div className="perk-text">
                <strong>Real-time Order & Macro Tracking</strong>
                <p>Live 5-stage shipment tracking and certified lab test reports.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form Card */}
        <Card glass padding="lg" className="signup-card animate-fadeIn">
          <div className="signup-header">
            <div className="signup-brand-logo">
              <img src="/images/logo.jpeg" alt="FitBite Logo" className="logo-img" />
            </div>
            <h1 className="signup-title">Create Account</h1>
            <p className="signup-subtitle">
              Sign up with your email to start your high-protein journey.
            </p>
          </div>

          {serverError && (
            <div className="signup-server-error animate-slideDown" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{serverError}</span>
            </div>
          )}

          <form className="signup-form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Full Name"
              type="text"
              id="full_name"
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

            <Input
              label="Email Address"
              type="email"
              id="email"
              name="email"
              autoComplete="username"
              placeholder="alex@fitbite.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={<Mail size={16} />}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              leftIcon={<Phone size={16} />}
              disabled={isSubmitting}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="new-password"
              name="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              disabled={isSubmitting}
            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm_password"
              name="confirm_password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={formData.confirm_password}
              onChange={handleChange}
              error={errors.confirm_password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={<UserPlus size={18} />}
              className="signup-submit-btn"
            >
              Create My Account
            </Button>
          </form>

          <div className="signup-footer">
            <p className="signup-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="signup-link">
                <span>Sign In</span>
                <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </Card>
      </div>

      <style>{`
        .signup-page-container {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-8) var(--space-4);
          background: radial-gradient(circle at 70% 30%, rgba(200, 122, 62, 0.08) 0%, transparent 60%);
        }

        .signup-grid-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
          max-width: 1000px;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .signup-grid-container {
            grid-template-columns: 1.1fr 1fr;
            gap: var(--space-12);
          }
        }

        .signup-perks-panel {
          display: none;
        }

        @media (min-width: 1024px) {
          .signup-perks-panel {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            padding: var(--space-6);
          }
        }

        .perks-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-1) var(--space-3);
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          width: fit-content;
        }

        .perks-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .perks-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }

        .perks-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          margin-top: var(--space-4);
        }

        .perk-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .perk-icon-wrap {
          color: var(--color-primary);
          background: var(--color-primary-light);
          padding: 6px;
          border-radius: var(--radius-full);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .perk-text strong {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-espresso);
          margin-bottom: 2px;
        }

        .perk-text p {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        .signup-card {
          width: 100%;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--color-border);
        }

        .signup-header {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .signup-brand-logo {
          width: 52px;
          height: 52px;
          margin: 0 auto var(--space-3);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--color-border);
        }

        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .signup-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          margin-bottom: var(--space-2);
          letter-spacing: -0.02em;
        }

        .signup-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-normal);
        }

        .signup-server-error {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-danger-bg);
          color: var(--color-danger);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-danger-border);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-4);
        }

        .error-icon {
          flex-shrink: 0;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
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

        .signup-submit-btn {
          margin-top: var(--space-3);
        }

        .signup-footer {
          margin-top: var(--space-6);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
          text-align: center;
        }

        .signup-footer-text {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .signup-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          color: var(--color-primary);
          font-weight: var(--font-weight-semibold);
          transition: color var(--transition-fast);
          margin-left: var(--space-1);
        }

        .signup-link:hover {
          color: var(--color-primary-hover);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default SignupPage;

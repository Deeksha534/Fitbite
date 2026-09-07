import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const user = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const from = location.state?.from?.pathname;
      const targetDestination = from || (user?.role === 'admin' ? '/admin' : '/account/profile');
      navigate(targetDestination, { replace: true });
    } catch (err) {
      const message = err?.message || 'Invalid email or password. Please try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="container flex-center">
        <Card glass padding="lg" className="auth-card animate-fadeIn">
          {/* Brand Header */}
          <div className="auth-header">
            <div className="auth-brand-logo">
              <img src="/images/logo.jpeg" alt="FitBite Logo" className="logo-img" />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">
              Sign in to your FitBite account to access orders, saved addresses, and macro targets.
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="auth-server-error animate-slideDown" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Email Address"
              type="email"
              id="email"
              name="email"
              autoComplete="username"
              placeholder="athlete@fitbite.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={<Mail size={16} />}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={<LogIn size={18} />}
              className="auth-submit-btn"
            >
              Sign In to Account
            </Button>
          </form>

          {/* Footer Link */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Don't have an athlete account?{' '}
              <Link to="/signup" className="auth-link">
                <span>Create an Account</span>
                <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </Card>
      </div>

      <style>{`
        .auth-page-container {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-8) var(--space-4);
          background: radial-gradient(circle at 50% 20%, rgba(200, 122, 62, 0.08) 0%, transparent 60%);
        }

        .auth-card {
          max-width: 460px;
          width: 100%;
          margin: var(--space-4) auto;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--color-border);
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .auth-brand-logo {
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

        .auth-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          margin-bottom: var(--space-2);
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-normal);
        }

        .auth-server-error {
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

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
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

        .auth-submit-btn {
          margin-top: var(--space-2);
        }

        .auth-footer {
          margin-top: var(--space-6);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
          text-align: center;
        }

        .auth-footer-text {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .auth-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          color: var(--color-primary);
          font-weight: var(--font-weight-semibold);
          transition: color var(--transition-fast);
          margin-left: var(--space-1);
        }

        .auth-link:hover {
          color: var(--color-primary-hover);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

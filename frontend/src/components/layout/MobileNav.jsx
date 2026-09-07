import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { X, Home, Compass, Heart, ShoppingBag, User, ShieldCheck, PhoneCall, HelpCircle, Utensils, Award } from 'lucide-react';

/**
 * Mobile Navigation Drawer & Bottom Bar Component
 */
export const MobileNav = ({
  isOpen,
  onClose,
  user = null,
  cartCount = 0,
  wishlistCount = 0,
  onLogout,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* 1. Mobile Drawer Backdrop & Menu */}
      {isOpen && (
        <div className="mobile-drawer-root animate-fadeIn">
          <div className="mobile-backdrop" onClick={onClose} aria-hidden="true" />

          <div className="mobile-drawer-panel animate-slideUp">
            <div className="drawer-header">
              <div className="drawer-brand">
                <img src="/images/logo.jpeg" alt="FitBite Logo" className="drawer-logo" />
                <span className="drawer-brand-name">Fit<span className="brand-accent">Bite</span></span>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={onClose}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {user ? (
              <div className="drawer-user-card">
                <div className="drawer-avatar">
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="drawer-user-details">
                  <p className="drawer-name">{user?.full_name || 'Athlete'}</p>
                  <p className="drawer-email">{user?.email}</p>
                </div>
              </div>
            ) : (
              <div className="drawer-auth-buttons">
                <Link to="/login" className="drawer-login-btn" onClick={onClose}>
                  Sign In
                </Link>
                <Link to="/signup" className="drawer-signup-btn" onClick={onClose}>
                  Create Account
                </Link>
              </div>
            )}

            <nav className="drawer-nav-list">
              <NavLink to="/" className="drawer-nav-item" onClick={onClose} end>
                <Home size={18} />
                <span>Home</span>
              </NavLink>

              <NavLink to="/products" className="drawer-nav-item" onClick={onClose}>
                <Compass size={18} />
                <span>Shop All Products</span>
              </NavLink>

              <NavLink to="/nutrition" className="drawer-nav-item" onClick={onClose}>
                <Award size={18} />
                <span>Nutrition & Macros</span>
              </NavLink>

              <NavLink to="/recipes" className="drawer-nav-item" onClick={onClose}>
                <Utensils size={18} />
                <span>Protein Recipes</span>
              </NavLink>

              <NavLink to="/fitness-tips" className="drawer-nav-item" onClick={onClose}>
                <Award size={18} />
                <span>Fitness & Recovery Tips</span>
              </NavLink>

              <NavLink to="/faq" className="drawer-nav-item" onClick={onClose}>
                <HelpCircle size={18} />
                <span>Frequently Asked Questions</span>
              </NavLink>

              <NavLink to="/support" className="drawer-nav-item" onClick={onClose}>
                <PhoneCall size={18} />
                <span>Help & Support Center</span>
              </NavLink>

              {user?.role === 'admin' && (
                <NavLink to="/admin" className="drawer-nav-item admin-drawer-item" onClick={onClose}>
                  <ShieldCheck size={18} />
                  <span>Admin Operations Portal</span>
                </NavLink>
              )}
            </nav>

            {user && (
              <div className="drawer-footer">
                <button
                  type="button"
                  className="drawer-logout-btn"
                  onClick={() => {
                    onClose();
                    onLogout && onLogout();
                  }}
                >
                  Sign Out of Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Fixed Mobile Bottom Quick Navigation Bar */}
      <div className="mobile-bottom-bar">
        <NavLink to="/" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`} end>
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/products" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <Compass size={20} />
          <span>Shop</span>
        </NavLink>

        <NavLink to="/wishlist" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <div className="tab-icon-wrap">
            <Heart size={20} />
            {wishlistCount > 0 && <span className="tab-badge">{wishlistCount}</span>}
          </div>
          <span>Wishlist</span>
        </NavLink>

        <NavLink to="/cart" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <div className="tab-icon-wrap">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="tab-badge">{cartCount}</span>}
          </div>
          <span>Cart</span>
        </NavLink>

        <NavLink
          to={user ? '/account/profile' : '/login'}
          className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>{user ? 'Account' : 'Sign In'}</span>
        </NavLink>
      </div>

      <style>{`
        /* --- Mobile Bottom Bar --- */
        .mobile-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: rgba(253, 251, 247, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: var(--z-sticky);
          padding: 0 var(--space-2);
          box-shadow: 0 -2px 10px rgba(30, 18, 13, 0.05);
        }

        @media (min-width: 1024px) {
          .mobile-bottom-bar {
            display: none;
          }
        }

        .bottom-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: var(--color-text-muted);
          font-size: 0.65rem;
          font-weight: var(--font-weight-medium);
          padding: var(--space-1);
          flex: 1;
          transition: color var(--transition-fast);
        }

        .bottom-tab.active {
          color: var(--color-primary);
          font-weight: var(--font-weight-bold);
        }

        .tab-icon-wrap {
          position: relative;
        }

        .tab-badge {
          position: absolute;
          top: -4px;
          right: -8px;
          background: var(--color-primary);
          color: #ffffff;
          font-size: 0.55rem;
          font-weight: var(--font-weight-bold);
          min-width: 14px;
          height: 14px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 2px;
        }

        /* --- Mobile Drawer --- */
        .mobile-drawer-root {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: var(--z-drawer);
          display: flex;
        }

        .mobile-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(30, 18, 13, 0.6);
          backdrop-filter: blur(4px);
        }

        .mobile-drawer-panel {
          position: relative;
          z-index: calc(var(--z-drawer) + 1);
          width: 85%;
          max-width: 320px;
          height: 100%;
          background: var(--color-bg-card);
          box-shadow: var(--shadow-2xl);
          display: flex;
          flex-direction: column;
          padding: var(--space-4);
          overflow-y: auto;
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .drawer-brand {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .drawer-logo {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
        }

        .drawer-brand-name {
          font-family: var(--font-heading);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .brand-accent {
          color: var(--color-primary);
        }

        .drawer-close-btn {
          padding: var(--space-1);
          color: var(--color-text-subtle);
          border-radius: var(--radius-md);
        }

        .drawer-auth-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2);
          margin: var(--space-4) 0;
        }

        .drawer-login-btn {
          text-align: center;
          padding: var(--space-2);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
        }

        .drawer-signup-btn {
          text-align: center;
          padding: var(--space-2);
          background: var(--color-primary);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: #ffffff;
        }

        .drawer-user-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-cream-subtle);
          border-radius: var(--radius-lg);
          margin: var(--space-4) 0;
        }

        .drawer-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--color-primary);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-bold);
        }

        .drawer-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
        }

        .drawer-email {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .drawer-nav-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          flex: 1;
        }

        .drawer-nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-main);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .drawer-nav-item:hover,
        .drawer-nav-item.active {
          background: var(--color-cream-subtle);
          color: var(--color-primary);
          font-weight: var(--font-weight-semibold);
        }

        .admin-drawer-item {
          color: var(--color-primary-dark);
          border-left: 3px solid var(--color-primary);
        }

        .drawer-footer {
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
        }

        .drawer-logout-btn {
          width: 100%;
          padding: var(--space-2);
          color: var(--color-danger);
          background: var(--color-danger-bg);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
        }
      `}</style>
    </>
  );
};

export default MobileNav;

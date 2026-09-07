import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Menu, X, User } from 'lucide-react';
import UserDropdown from './UserDropdown';

/**
 * FitBite Sticky Main Navigation Bar Component
 */
export const Navbar = ({
  user = null,
  cartCount = 0,
  wishlistCount = 0,
  onLogout,
  onOpenMobileMenu,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="fitbite-header glass-panel">
      <div className="container flex-between header-container">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="header-left">
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={onOpenMobileMenu}
            aria-label="Open mobile navigation menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="brand-logo-link">
            <div className="brand-logo-img-wrapper">
              <img src="/images/logo.jpeg" alt="FitBite Logo" className="brand-logo-img" />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Fit<span className="brand-name-accent">Bite</span></span>
              <span className="brand-tagline">Protein Labs</span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="desktop-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            Home
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Products
          </NavLink>
          <NavLink to="/nutrition" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Nutrition
          </NavLink>
          <NavLink to="/recipes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Recipes
          </NavLink>
          <NavLink to="/fitness-tips" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Tips
          </NavLink>
          <NavLink to="/support" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Support
          </NavLink>
        </nav>

        {/* Right: Actions (Search, Wishlist, Cart, Auth) */}
        <div className="header-right">
          {/* Desktop Search Bar */}
          <form className="nav-search-form" onSubmit={handleSearchSubmit}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search protein bars, flavors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="nav-search-input"
            />
          </form>

          {/* Wishlist Link */}
          <Link to="/wishlist" className="action-icon-btn" aria-label="View Wishlist">
            <Heart size={20} />
            {wishlistCount > 0 && <span className="action-badge">{wishlistCount}</span>}
          </Link>

          {/* Cart Link */}
          <Link to="/cart" className="action-icon-btn cart-btn" aria-label="View Shopping Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="action-badge">{cartCount}</span>}
          </Link>

          {/* User Auth Profile / Login Button */}
          {user ? (
            <UserDropdown user={user} onLogout={onLogout} />
          ) : (
            <Link to="/login" className="login-link-btn">
              <User size={16} />
              <span className="login-btn-text">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .fitbite-header {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          border-radius: 0;
          border-top: none;
          border-left: none;
          border-right: none;
          padding: 0.65rem 0;
          transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
        }

        .header-container {
          gap: var(--space-4);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .mobile-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-2);
          color: var(--color-espresso);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        @media (min-width: 1024px) {
          .mobile-toggle-btn {
            display: none;
          }
        }

        .brand-logo-link {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          text-decoration: none;
        }

        .brand-logo-img-wrapper {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .brand-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .brand-text-group {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .brand-name {
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          letter-spacing: -0.02em;
        }

        .brand-name-accent {
          color: var(--color-primary);
        }

        .brand-tagline {
          font-size: 0.65rem;
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-subtle);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .desktop-nav {
          display: none;
          align-items: center;
          gap: var(--space-1);
        }

        @media (min-width: 1024px) {
          .desktop-nav {
            display: flex;
          }
        }

        .nav-link {
          padding: var(--space-2) var(--space-3);
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-espresso);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .nav-link:hover {
          color: var(--color-primary);
          background: var(--color-cream-subtle);
        }

        .nav-link.active {
          color: var(--color-primary);
          font-weight: var(--font-weight-bold);
          background: var(--color-primary-light);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        @media (min-width: 640px) {
          .header-right {
            gap: var(--space-3);
          }
        }

        .nav-search-form {
          display: none;
          position: relative;
          align-items: center;
          width: 220px;
        }

        @media (min-width: 768px) {
          .nav-search-form {
            display: flex;
          }
        }

        @media (min-width: 1280px) {
          .nav-search-form {
            width: 280px;
          }
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--color-text-subtle);
          pointer-events: none;
        }

        .nav-search-input {
          width: 100%;
          padding: 0.4rem 0.75rem 0.4rem 2.2rem;
          font-size: var(--font-size-xs);
          color: var(--color-text-main);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .nav-search-input:focus {
          background: #ffffff;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(200, 122, 62, 0.15);
        }

        .action-icon-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          color: var(--color-espresso);
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          transition: all var(--transition-fast);
        }

        .action-icon-btn:hover {
          color: var(--color-primary);
          border-color: var(--color-primary-light);
          transform: translateY(-1px);
        }

        .action-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--color-primary);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: var(--font-weight-bold);
          min-width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-shadow: 0 2px 5px rgba(200, 122, 62, 0.4);
          border: 2px solid #ffffff;
        }

        .login-link-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: 0.4rem 0.9rem;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
          color: #ffffff;
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          border-radius: var(--radius-full);
          box-shadow: 0 3px 8px rgba(200, 122, 62, 0.25);
          transition: all var(--transition-fast);
        }

        .login-link-btn:hover {
          background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary-dark) 100%);
          transform: translateY(-1px);
        }

        .login-btn-text {
          display: none;
        }

        @media (min-width: 640px) {
          .login-btn-text {
            display: inline-block;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;

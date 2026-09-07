import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Heart, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';

/**
 * User Profile & Authentication Dropdown Menu
 */
export const UserDropdown = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="user-dropdown-root" ref={dropdownRef}>
      <button
        type="button"
        className="user-trigger-btn"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-label="User account menu"
      >
        <div className="user-avatar">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user?.full_name || 'Avatar'}
              className="user-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <span style={{ display: user?.avatar_url ? 'none' : 'block' }}>
            {getInitials(user?.full_name)}
          </span>
        </div>
        <span className="user-name-label">{user?.full_name?.split(' ')[0] || 'Account'}</span>
        <ChevronDown size={14} className={`dropdown-chevron ${isOpen ? 'is-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu-card animate-slideDown">
          <div className="dropdown-user-info">
            <p className="dropdown-user-name">{user?.full_name || 'FitBite Athlete'}</p>
            <p className="dropdown-user-email">{user?.email}</p>
            {user?.role === 'admin' && (
              <span className="admin-chip">Administrator</span>
            )}
          </div>

          <div className="dropdown-divider" />

          <nav className="dropdown-nav">
            <Link
              to="/account/profile"
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} />
              <span>My Profile & Account</span>
            </Link>

            <Link
              to="/account/orders"
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <Package size={16} />
              <span>Order History</span>
            </Link>

            <Link
              to="/wishlist"
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <Heart size={16} />
              <span>Saved Wishlist</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="dropdown-item admin-link"
                onClick={() => setIsOpen(false)}
              >
                <ShieldCheck size={16} />
                <span>Admin Operations Portal</span>
              </Link>
            )}
          </nav>

          <div className="dropdown-divider" />

          <button
            type="button"
            className="dropdown-item logout-btn"
            onClick={() => {
              setIsOpen(false);
              onLogout && onLogout();
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      <style>{`
        .user-dropdown-root {
          position: relative;
        }

        .user-trigger-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 0.35rem 0.65rem;
          background: var(--color-cream-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .user-trigger-btn:hover {
          background: var(--color-cream-dark);
          border-color: var(--color-primary-light);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-amber) 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: var(--font-weight-bold);
          overflow: hidden;
          flex-shrink: 0;
        }

        .user-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-name-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-espresso);
          display: none;
        }

        @media (min-width: 640px) {
          .user-name-label {
            display: inline-block;
          }
        }

        .dropdown-chevron {
          color: var(--color-text-subtle);
          transition: transform var(--transition-fast);
        }

        .dropdown-chevron.is-open {
          transform: rotate(180deg);
        }

        .dropdown-menu-card {
          position: absolute;
          top: calc(100% + var(--space-2));
          right: 0;
          width: 240px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          padding: var(--space-2);
          z-index: var(--z-modal);
        }

        .dropdown-user-info {
          padding: var(--space-3) var(--space-3) var(--space-2);
        }

        .dropdown-user-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-espresso);
          line-height: 1.2;
        }

        .dropdown-user-email {
          font-size: var(--font-size-xs);
          color: var(--color-text-subtle);
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-chip {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          background: var(--color-espresso);
          color: var(--color-cream);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          margin-top: var(--space-1);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--color-border-subtle);
          margin: var(--space-1) 0;
        }

        .dropdown-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-main);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background: var(--color-cream-subtle);
          color: var(--color-primary);
        }

        .admin-link {
          color: var(--color-primary-dark);
          font-weight: var(--font-weight-semibold);
        }

        .logout-btn {
          color: var(--color-danger);
        }

        .logout-btn:hover {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }
      `}</style>
    </div>
  );
};

export default UserDropdown;

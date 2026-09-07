import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, BarChart3, LogOut, CheckCircle2, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ProfileInfoTab from './components/ProfileInfoTab';
import SecurityTab from './components/SecurityTab';
import AccountSummaryWidget from './components/AccountSummaryWidget';

export const ProfilePage = () => {
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Member';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    } catch (_) {
      return 'Member';
    }
  };

  return (
    <div className="account-page-wrapper">
      <div className="container section">
        {/* Top Account Header Card */}
        <Card glass padding="lg" className="account-header-card animate-fadeIn">
          <div className="account-hero-flex">
            {/* Left: Avatar & Identity */}
            <div className="account-identity-group">
              <div className="account-avatar-wrapper">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.full_name || 'Profile Avatar'}
                    className="account-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="account-avatar-fallback"
                  style={{ display: user?.avatar_url ? 'none' : 'flex' }}
                >
                  {getInitials(user?.full_name)}
                </div>
              </div>

              <div className="account-text-group">
                <div className="account-name-row">
                  <h1 className="account-user-name">{user?.full_name || 'FitBite Athlete'}</h1>
                  {isAdmin ? (
                    <Badge variant="espresso" size="sm">
                      <ShieldCheck size={12} /> Administrator
                    </Badge>
                  ) : (
                    <Badge variant="primary" size="sm">
                      <Sparkles size={12} /> Athlete Member
                    </Badge>
                  )}
                </div>

                <p className="account-user-email">
                  {user?.email}
                  <span className="email-verified-tag">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                </p>

                <div className="account-meta-row">
                  <span className="account-meta-item">
                    <Calendar size={13} />
                    <span>Member since {formatDate(user?.created_at)}</span>
                  </span>
                  {user?.phone && (
                    <span className="account-meta-item">
                      <span>•</span>
                      <span>{user.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Sign Out Button */}
            <div className="account-hero-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout(true)}
                leftIcon={<LogOut size={16} />}
                className="account-logout-btn"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabbed Navigation Shell */}
        <div className="account-tabs-container">
          <div className="account-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'profile'}
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} />
              <span>Profile Details</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'security'}
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={16} />
              <span>Security & Password</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={16} />
              <span>Activity & Overview</span>
            </button>
          </div>

          {/* Tab Panes */}
          <div className="account-tab-panel">
            {activeTab === 'profile' && <ProfileInfoTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'overview' && <AccountSummaryWidget />}
          </div>
        </div>
      </div>

      <style>{`
        .account-page-wrapper {
          min-height: calc(100vh - 200px);
          background: linear-gradient(180deg, rgba(200, 122, 62, 0.04) 0%, transparent 400px);
        }

        .account-header-card {
          margin-bottom: var(--space-8);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-md);
        }

        .account-hero-flex {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          justify-content: space-between;
        }

        @media (min-width: 768px) {
          .account-hero-flex {
            flex-direction: row;
            align-items: center;
          }
        }

        .account-identity-group {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .account-avatar-wrapper {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-full);
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: var(--shadow-md);
          border: 2px solid var(--color-primary-light);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-amber) 100%);
        }

        .account-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .account-avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-family: var(--font-heading);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
        }

        .account-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .account-name-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .account-user-name {
          font-family: var(--font-heading);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-espresso);
          line-height: 1.2;
        }

        .account-user-email {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .email-verified-tag {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: var(--color-success);
          font-weight: var(--font-weight-semibold);
          font-size: 0.7rem;
        }

        .account-meta-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-1);
        }

        .account-meta-item {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: 0.72rem;
          color: var(--color-text-subtle);
        }

        .account-hero-actions {
          display: flex;
          align-items: center;
        }

        .account-logout-btn {
          color: var(--color-danger) !important;
        }
        .account-logout-btn:hover {
          background: var(--color-danger-bg) !important;
        }

        /* --- Tabs --- */
        .account-tabs-container {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .account-tabs-bar {
          display: flex;
          border-bottom: 1px solid var(--color-border-subtle);
          background: var(--color-cream-subtle);
          overflow-x: auto;
          scrollbar-width: none;
        }

        .account-tabs-bar::-webkit-scrollbar {
          display: none;
        }

        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4) var(--space-6);
          font-family: var(--font-heading);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-muted);
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: var(--color-primary);
          background: rgba(200, 122, 62, 0.05);
        }

        .tab-btn.active {
          color: var(--color-primary);
          font-weight: var(--font-weight-bold);
          border-bottom-color: var(--color-primary);
          background: var(--color-bg-card);
        }

        .account-tab-panel {
          padding: var(--space-6);
        }

        @media (min-width: 768px) {
          .account-tab-panel {
            padding: var(--space-8);
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;

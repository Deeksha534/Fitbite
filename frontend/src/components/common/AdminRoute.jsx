import React from 'react';
import { Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, User } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import Spinner from './Spinner';

/**
 * Route Guard for Store Administrators
 * Verifies backend-provided 'admin' role claims.
 * Non-admins receive an explicit 403 Access Denied view.
 */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container section flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner size="lg" color="primary" />
          <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Verifying administrative access privileges...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container section flex-center" style={{ minHeight: '70vh', padding: 'var(--space-8) var(--space-4)' }}>
        <Card glass padding="lg" className="admin-denied-card animate-fadeIn">
          <div className="denied-icon-wrap">
            <ShieldAlert size={48} className="denied-icon" />
          </div>

          <div style={{ marginBottom: 'var(--space-2)' }}>
            <Badge variant="danger" size="md">
              403 Forbidden Access
            </Badge>
          </div>

          <h1 className="denied-title">Administrator Privileges Required</h1>
          <p className="denied-desc">
            You are signed in as <strong>{user?.email}</strong> (Role: <em>{user?.role || 'customer'}</em>). 
            This area is strictly reserved for FitBite Operations Administrators.
          </p>

          <div className="denied-actions">
            <Link to="/">
              <Button variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />}>
                Return to Home
              </Button>
            </Link>
            <Link to="/account/profile">
              <Button variant="primary" size="md" leftIcon={<User size={16} />}>
                My Account Profile
              </Button>
            </Link>
          </div>
        </Card>

        <style>{`
          .admin-denied-card {
            max-width: 540px;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            border-top: 4px solid var(--color-danger);
            box-shadow: var(--shadow-xl);
          }

          .denied-icon-wrap {
            width: 76px;
            height: 76px;
            border-radius: var(--radius-full);
            background: var(--color-danger-bg);
            color: var(--color-danger);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--space-4);
          }

          .denied-title {
            font-size: var(--font-size-xl);
            color: var(--color-espresso);
            margin-bottom: var(--space-2);
          }

          .denied-desc {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
            line-height: var(--line-height-relaxed);
            margin-bottom: var(--space-6);
          }

          .denied-actions {
            display: flex;
            gap: var(--space-3);
            flex-wrap: wrap;
            justify-content: center;
          }
        `}</style>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;

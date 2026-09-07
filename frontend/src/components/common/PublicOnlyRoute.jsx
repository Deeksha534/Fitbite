import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

/**
 * Route Guard for Guest-Only Pages (/login, /signup)
 * Redirects already authenticated users away to their profile or intended destination.
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container section flex-center" style={{ minHeight: '60vh' }}>
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || (isAdmin ? '/admin' : '/account/profile');
    return <Navigate to={destination} replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicOnlyRoute;

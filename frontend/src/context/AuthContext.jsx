import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getToken, clearToken } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('fitbite_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setTokenState] = useState(() => getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const toast = useToast();

  // 1. Session Restoration on Initial Mount
  const restoreSession = useCallback(async () => {
    const storedToken = getToken();
    if (!storedToken) {
      setUser(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      const userData = response?.user || response;
      if (userData && userData.id) {
        setUser(userData);
        setTokenState(storedToken);
        localStorage.setItem('fitbite_user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid user payload');
      }
    } catch (err) {
      console.warn('Session restoration failed:', err.message);
      clearToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen to custom session expired event from api.js
    const handleSessionExpired = () => {
      setUser(null);
      setTokenState(null);
      setSummary(null);
      localStorage.removeItem('fitbite_user');
      toast.warning('Your session has expired. Please sign in again to continue.');
    };

    window.addEventListener('fitbite:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('fitbite:session_expired', handleSessionExpired);
    };
  }, [restoreSession, toast]);

  // 2. Login
  const login = useCallback(
    async (credentials) => {
      setIsLoading(true);
      try {
        const response = await authService.login(credentials);
        const userData = response?.user || response?.data?.user;
        const authToken = response?.token || response?.data?.token;

        if (!authToken || !userData) {
          throw new Error('Login response missing authentication token or user details');
        }

        authService.saveToken(authToken);
        setTokenState(authToken);
        setUser(userData);
        localStorage.setItem('fitbite_user', JSON.stringify(userData));

        window.dispatchEvent(
          new CustomEvent('fitbite:auth_changed', { detail: { user: userData, token: authToken } })
        );

        toast.success(`Welcome back, ${userData.full_name?.split(' ')[0] || 'Athlete'}!`);
        return userData;
      } catch (err) {
        const msg = err.message || 'Login failed. Please check your credentials.';
        toast.error(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // 3. Register
  const register = useCallback(
    async (userDataPayload) => {
      setIsLoading(true);
      try {
        const response = await authService.register(userDataPayload);
        const userData = response?.user || response?.data?.user;
        const authToken = response?.token || response?.data?.token;

        if (!authToken || !userData) {
          throw new Error('Registration response missing authentication token');
        }

        authService.saveToken(authToken);
        setTokenState(authToken);
        setUser(userData);
        localStorage.setItem('fitbite_user', JSON.stringify(userData));

        window.dispatchEvent(
          new CustomEvent('fitbite:auth_changed', { detail: { user: userData, token: authToken } })
        );

        toast.success('Account created successfully! Welcome to FitBite.');
        return userData;
      } catch (err) {
        const msg = err.message || 'Registration failed. Please try again.';
        toast.error(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // 4. Logout
  const logout = useCallback(
    (showToast = true) => {
      authService.clearAuth();
      setUser(null);
      setTokenState(null);
      setSummary(null);

      window.dispatchEvent(
        new CustomEvent('fitbite:auth_changed', { detail: { user: null, token: null } })
      );

      if (showToast) {
        toast.info('You have been signed out.');
      }
    },
    [toast]
  );

  // 5. Update Profile
  const updateProfile = useCallback(
    async (profileData) => {
      try {
        const response = await authService.updateProfile(profileData);
        const updatedUser = response?.user || response?.data?.user;

        if (updatedUser) {
          setUser(updatedUser);
          localStorage.setItem('fitbite_user', JSON.stringify(updatedUser));
          window.dispatchEvent(
            new CustomEvent('fitbite:auth_changed', {
              detail: { user: updatedUser, token: getToken() },
            })
          );
        }

        toast.success('Profile updated successfully!');
        return updatedUser;
      } catch (err) {
        const msg = err.message || 'Failed to update profile.';
        toast.error(msg);
        throw err;
      }
    },
    [toast]
  );

  // 6. Change Password
  const changePassword = useCallback(
    async (passwordData) => {
      try {
        const response = await authService.changePassword(passwordData);
        toast.success('Password changed successfully! Please remember your new password.');
        return response;
      } catch (err) {
        const msg = err.message || 'Failed to change password.';
        toast.error(msg);
        throw err;
      }
    },
    [toast]
  );

  // 7. Fetch Account Summary Metrics
  const fetchSummary = useCallback(async () => {
    if (!token) return null;
    try {
      const summaryData = await authService.getSummary();
      setSummary(summaryData);
      return summaryData;
    } catch (err) {
      console.warn('Failed to load user summary metrics:', err.message);
      return null;
    }
  }, [token]);

  // 8. Refresh User Profile
  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const response = await authService.getMe();
      const userData = response?.user || response;
      if (userData) {
        setUser(userData);
        localStorage.setItem('fitbite_user', JSON.stringify(userData));
      }
      return userData;
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message);
      return null;
    }
  }, [token]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    summary,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    fetchSummary,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

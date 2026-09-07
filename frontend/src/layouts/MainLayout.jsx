import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Navbar from '../components/layout/Navbar';
import MobileNav from '../components/layout/MobileNav';
import Footer from '../components/layout/Footer';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * FitBite Primary Application Layout
 * Structures TopBar, Sticky Header, Main Content Container, Mobile Drawer, and Footer.
 */
export const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [apiOnline, setApiOnline] = useState(true);

  const { user, logout } = useAuth();

  // 1. Initial Health Check
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await api.get('/health');
        if (health && health.success) {
          setApiOnline(true);
        }
      } catch (err) {
        setApiOnline(false);
        console.warn('Backend API connection warning:', err.message);
      }
    };

    checkBackendHealth();

    // Listen to custom cart & wishlist events
    const handleCartChange = (event) => {
      setCartCount(event.detail?.count || 0);
    };

    const handleWishlistChange = (event) => {
      setWishlistCount(event.detail?.count || 0);
    };

    window.addEventListener('fitbite:cart_changed', handleCartChange);
    window.addEventListener('fitbite:wishlist_changed', handleWishlistChange);

    return () => {
      window.removeEventListener('fitbite:cart_changed', handleCartChange);
      window.removeEventListener('fitbite:wishlist_changed', handleWishlistChange);
    };
  }, []);

  return (
    <div className="fitbite-app-shell">
      {!apiOnline && (
        <div className="offline-banner">
          <span>⚠️ Warning: Cannot connect to backend server at {import.meta.env.VITE_API_BASE_URL}. Ensure backend is running.</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      <TopBar />

      {/* Sticky Main Navbar */}
      <Navbar
        user={user}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogout={logout}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Drawer & Bottom Bar */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogout={logout}
      />

      {/* Main Dynamic Viewport */}
      <main className="fitbite-main-content">
        <Outlet />
      </main>

      {/* Global 4-Column Footer */}
      <Footer />

      <style>{`
        .fitbite-app-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--color-bg-main);
          position: relative;
        }

        .offline-banner {
          background-color: var(--color-danger);
          color: #ffffff;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          text-align: center;
          padding: var(--space-2);
          z-index: var(--z-toast);
        }

        .fitbite-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-bottom: 60px; /* Space for mobile bottom bar */
        }

        @media (min-width: 1024px) {
          .fitbite-main-content {
            padding-bottom: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;

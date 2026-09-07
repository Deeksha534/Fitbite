import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/public/HomePage';
import NotFoundPage from './pages/public/NotFoundPage';
import PlaceholderPage from './pages/public/PlaceholderPage';
import ProductsPage from './pages/public/ProductsPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import NutritionPage from './pages/public/NutritionPage';
import RecipesPage from './pages/public/RecipesPage';
import FitnessTipsPage from './pages/public/FitnessTipsPage';
import FAQPage from './pages/public/FAQPage';
import SupportPage from './pages/public/SupportPage';
import CartPage from './pages/cart/CartPage';
import WishlistPage from './pages/wishlist/WishlistPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import TrackOrderPage from './pages/public/TrackOrderPage';
import OrderHistoryPage from './pages/account/OrderHistoryPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ProfilePage from './pages/account/ProfilePage';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import PublicOnlyRoute from './components/common/PublicOnlyRoute';

export const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Routes>
                {/* Main Application Layout Shell */}
                <Route path="/" element={<MainLayout />}>
                  {/* Public Routes */}
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />
                  <Route path="nutrition" element={<NutritionPage />} />
                  <Route path="recipes" element={<RecipesPage />} />
                  <Route path="fitness-tips" element={<FitnessTipsPage />} />
                  <Route path="faq" element={<FAQPage />} />
                  <Route path="support" element={<SupportPage />} />

                  {/* Cart & Wishlist Routes */}
                  <Route path="cart" element={<CartPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />

                  {/* Live 5-Stage Order Tracking */}
                  <Route path="track" element={<TrackOrderPage />} />
                  <Route path="track/:orderNumber" element={<TrackOrderPage />} />

                  {/* Guest-Only Authentication Routes */}
                  <Route
                    path="login"
                    element={
                      <PublicOnlyRoute>
                        <LoginPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="signup"
                    element={
                      <PublicOnlyRoute>
                        <SignupPage />
                      </PublicOnlyRoute>
                    }
                  />

                  {/* Customer / Authenticated Protected Routes */}
                  <Route
                    path="account/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="account/orders"
                    element={
                      <ProtectedRoute>
                        <OrderHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="account/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="checkout"
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin-Only Protected Route */}
                  <Route
                    path="admin"
                    element={
                      <AdminRoute>
                        <PlaceholderPage
                          title="Administrator Operations Portal"
                          subtitle="Live gross revenue metrics, product catalog management, order fulfillment, and ticket resolution."
                          phase="4F"
                        />
                      </AdminRoute>
                    }
                  />

                  {/* 404 Catch-All Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;

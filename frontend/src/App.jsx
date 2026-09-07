import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/public/HomePage';
import NotFoundPage from './pages/public/NotFoundPage';
import PlaceholderPage from './pages/public/PlaceholderPage';
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
        <BrowserRouter>
          <Routes>
            {/* Main Application Layout Shell */}
            <Route path="/" element={<MainLayout />}>
              {/* Public Routes */}
              <Route index element={<HomePage />} />
              <Route
                path="products"
                element={
                  <PlaceholderPage
                    title="Product Catalog & Filtering"
                    subtitle="Browse all protein bars with real-time search debounce, category selection, and flavor filters."
                    phase="4C"
                  />
                }
              />
              <Route
                path="products/:id"
                element={
                  <PlaceholderPage
                    title="Product Details & Nutrition Breakdown"
                    subtitle="Detailed macro nutrition breakdown, image gallery, customer ratings, and quantity selector."
                    phase="4C"
                  />
                }
              />
              <Route
                path="nutrition"
                element={
                  <PlaceholderPage
                    title="Nutrition Guide & Macro Targets"
                    subtitle="Science-backed nutrition formulas, daily protein intake standards, and clean fuel recommendations."
                    phase="4C"
                  />
                }
              />
              <Route
                path="recipes"
                element={
                  <PlaceholderPage
                    title="Gourmet High-Protein Recipes"
                    subtitle="Delicious healthy snack recipes, protein smoothies, and meal prep guides using FitBite bars."
                    phase="4C"
                  />
                }
              />
              <Route
                path="fitness-tips"
                element={
                  <PlaceholderPage
                    title="Fitness & Muscle Recovery Advice"
                    subtitle="Expert articles on athletic conditioning, pre/post workout nutrition, and hydration science."
                    phase="4C"
                  />
                }
              />
              <Route
                path="faq"
                element={
                  <PlaceholderPage
                    title="Frequently Asked Questions"
                    subtitle="Instant answers regarding shipping, ingredients, allergies, subscriptions, and order policies."
                    phase="4C"
                  />
                }
              />
              <Route
                path="support"
                element={
                  <PlaceholderPage
                    title="Customer Support & Contact Center"
                    subtitle="Submit inquiries directly to our nutrition desk with automated ticket tracking IDs."
                    phase="4C"
                  />
                }
              />
              <Route
                path="cart"
                element={
                  <PlaceholderPage
                    title="Persistent Shopping Cart"
                    subtitle="Real-time stock validation, free-shipping progress meter, and coupon code discounts."
                    phase="4D"
                  />
                }
              />
              <Route
                path="wishlist"
                element={
                  <PlaceholderPage
                    title="Saved Wishlist Items"
                    subtitle="Save your favorite flavors and transfer them to your cart with a single click."
                    phase="4D"
                  />
                }
              />
              <Route
                path="track"
                element={
                  <PlaceholderPage
                    title="Live 5-Stage Order Tracking"
                    subtitle="Real-time timeline tracking: Placed -> Confirmed -> Packed -> Shipped -> Delivered."
                    phase="4E"
                  />
                }
              />

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
                    <PlaceholderPage
                      title="My Order History & Invoices"
                      subtitle="View past orders, track deliveries, download GST tax invoices, and re-order with ease."
                      phase="4E"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage
                      title="Multi-Step Secure Checkout"
                      subtitle="Saved address selector, payment gateway simulation, and server-side pricing recalculation."
                      phase="4D"
                    />
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
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;

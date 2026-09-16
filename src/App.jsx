import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Hero from './components/Hero/hero';
import MenuPage from './pages/MenuPage';
import AboutUsPage from './pages/AboutUsPage';
import GalleryPage from './pages/GalleryPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

import AdminLoginPage from './admin/AdminLoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';

import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';

import ProtectedAdminRoute from './admin/components/ProtectedAdminRoute';
import AdminLayout from './admin/components/AdminLayout';

function HomePage() {
  return <Hero />;
}

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>

            {/* PUBLIC WEBSITE */}
            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/menu"
              element={<MenuPage />}
            />

            <Route
              path="/about"
              element={<AboutUsPage />}
            />

            <Route
              path="/gallery"
              element={<GalleryPage />}
            />

            <Route
              path="/checkout"
              element={<CheckoutPage />}
            />

            <Route
              path="/payment"
              element={<PaymentPage />}
            />

            <Route
              path="/order-confirmation"
              element={<OrderConfirmationPage />}
            />

            {/* ADMIN LOGIN */}
            <Route
              path="/admin/login"
              element={<AdminLoginPage />}
            />

            {/* PROTECTED ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route
                index
                element={<AdminDashboardPage />}
              />

              <Route
                path="products"
                element={<AdminProductsPage />}
              />

              <Route
                path="orders"
                element={<AdminOrdersPage />}
              />

              <Route
                path="customers"
                element={<AdminCustomersPage />}
              />

              <Route
                path="settings"
                element={<AdminSettingsPage />}
              />
            </Route>

          </Routes>
        </BrowserRouter>
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;
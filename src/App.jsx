import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero/hero';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import { LanguageProvider } from './context/LanguageContext';
import AdminProductsPage from './pages/AdminProductsPage';

function HomePage() {
  return (
    <>
      <Hero />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route
            path="/admin/products"
            element={<AdminProductsPage />}
          />
  
          <Route
            path="/order-confirmation"
            element={<OrderConfirmationPage />}
          />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
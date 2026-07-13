import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderTracking from './pages/OrderTracking';
import TrackLookup from './pages/TrackLookup';
import NotFound from './pages/NotFound';

import { AuthProvider } from './admin/AuthContext';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import AdminOrders from './admin/AdminOrders';
import AdminMenu from './admin/AdminMenu';

/** The customer site: navbar and footer, no auth anywhere. */
function StoreLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// React Router keeps the scroll position across navigations; reset it so each
// page opens at the top.
function ScrollToTop() {
  const { pathname } = useLocation();

  // The braces matter. With a concise body — `useEffect(() => window.scrollTo(0, 0))`
  // — the arrow returns whatever scrollTo() returns, and React takes an effect's
  // return value to be its cleanup function. Chromium returns undefined so it
  // gets ignored, but Edge returns a value: on the next navigation React tried to
  // call it, threw "destroy is not a function", and unmounted the whole tree.
  // The page went blank on every route change and only a reload brought it back.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin lives on its own tree — no store chrome, and everything under
            /admin (except login) is behind AdminLayout's auth check. */}
        <Route
          path="/admin/*"
          element={
            <AuthProvider>
              <Routes>
                <Route path="login" element={<AdminLogin />} />
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="menu" element={<AdminMenu />} />
                </Route>
              </Routes>
            </AuthProvider>
          }
        />

        <Route
          path="*"
          element={
            <StoreLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/track" element={<TrackLookup />} />
                <Route path="/order/:orderNumber" element={<OrderTracking />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </StoreLayout>
          }
        />
      </Routes>
    </>
  );
}

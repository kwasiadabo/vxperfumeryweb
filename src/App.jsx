import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import Toaster from './components/Toaster';
import ConfirmDialog from './components/ConfirmDialog';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutComplete from './pages/CheckoutComplete';
import Account from './pages/Account';
import TrackOrder from './pages/TrackOrder';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import RiderPortal from './pages/RiderPortal';
import RiderReport from './pages/RiderReport';
import ReportIssue from './pages/ReportIssue';
import NotFound from './pages/NotFound';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDelivery from './pages/admin/AdminDelivery';
import AdminRiders from './pages/admin/AdminRiders';
import AdminDeliveryFees from './pages/admin/AdminDeliveryFees';
import AdminIssues from './pages/admin/AdminIssues';
import AdminOrdersReport from './pages/admin/AdminOrdersReport';
import AdminRiderDeliveriesReport from './pages/admin/AdminRiderDeliveriesReport';
import AdminSalesReport from './pages/admin/AdminSalesReport';
import AdminProductSalesTrend from './pages/admin/AdminProductSalesTrend';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/complete" element={<CheckoutComplete />} />
          <Route path="/account" element={<Account />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/login" element={<Login />} />
          <Route path="/rider" element={<RiderPortal />} />
          <Route path="/rider/report" element={<RiderReport />} />
          <Route path="/report-issue" element={<ReportIssue />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="delivery" element={<AdminDelivery />} />
            <Route path="riders" element={<AdminRiders />} />
            <Route path="delivery-fees" element={<AdminDeliveryFees />} />
            <Route path="issues" element={<AdminIssues />} />
            <Route path="reports/orders" element={<AdminOrdersReport />} />
            <Route path="reports/sales" element={<AdminSalesReport />} />
            <Route path="reports/product-trend" element={<AdminProductSalesTrend />} />
            <Route path="reports/rider-deliveries" element={<AdminRiderDeliveriesReport />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
      <ConfirmDialog />
    </div>
  );
}

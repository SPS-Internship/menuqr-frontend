import { BrowserRouter, Routes, Route } from "react-router-dom";

import MenuPage from "./pages/customer/MenuPage";
import MenuDetailPage from "./pages/customer/MenuDetailPage";
import CartPage from "./pages/customer/CartPage";
import OrderPage from "./pages/customer/OrderPage";

import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ReportPage from "./pages/admin/ReportPage";
import SettingsPage from "./pages/admin/SettingsPage";
import MenuManagementPage from "./pages/admin/MenuManagementPage";
import CategoryPage from "./pages/admin/CategoryPage";
import VariantPage from "./pages/admin/VariantPage";
import AddonPage from "./pages/admin/AddonPage";
import OrdersPage from "./pages/admin/OrdersPage";
import TablePage from "./pages/admin/TablePage";
import PromoPage from "./pages/admin/PromoPage";

import ProtectedRoute from "./components/admin/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            CUSTOMER
        ========================== */}

        <Route
          path="/"
          element={<MenuPage />}
        />

        <Route
          path="/menu/:slug"
          element={<MenuPage />}
        />

        <Route
          path="/menu/:slug/:id"
          element={<MenuDetailPage />}
        />

        <Route
          path="/cart"
          element={<CartPage />}
        />

        <Route
          path="/order"
          element={<OrderPage />}
        />

        {/* =========================
            ADMIN LOGIN
        ========================== */}

        <Route
          path="/admin/login/:slug"
          element={<LoginPage />}
        />

        {/* =========================
            ADMIN YANG WAJIB LOGIN
        ========================== */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/admin/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/admin/report"
            element={<ReportPage />}
          />

          <Route
            path="/admin/settings"
            element={<SettingsPage />}
          />

          <Route
            path="/admin/menu"
            element={<MenuManagementPage />}
          />

          <Route
            path="/admin/category"
            element={<CategoryPage />}
          />

          <Route
            path="/admin/variant"
            element={<VariantPage />}
          />

          <Route
            path="/admin/addon"
            element={<AddonPage />}
          />

          <Route
            path="/admin/orders"
            element={<OrdersPage />}
          />

          <Route
            path="/admin/tables"
            element={<TablePage />}
          />

          <Route
            path="/admin/promo"
            element={<PromoPage />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import AppLayout from "./layouts/AppLayout";
import CategoryList from "./pages/category/CategoryList";
import BrandList from "./pages/brand/BrandList";
import ProductList from "./pages/product/ProductList";
import ProductDetail from "./pages/product/ProductDetail";
import LocationList from "./pages/location/LocationList";
import CreateProduct from "./pages/product/CreateProduct";
import EditProduct from "./pages/product/EditProduct";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerList from "./pages/customer/CustomerList";
import SupplierList from "./pages/supplier/SupplierList";
import ExportGoods from "./pages/inventory/ExportGoods";
import ImportGoods from "./pages/inventory/ImportGoods";
import VoucherDetailView from "./pages/inventory/VoucherDetailView";
import VoucherHistory from "./pages/inventory/VoucherHistory";

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    <Route path="/" element={<AppLayout />}>
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories/list"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <CategoryList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/brands/list"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <BrandList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/list"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <ProductList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/create"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <CreateProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/edit/:barcode"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <EditProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:barcode"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <ProductDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/locations/list"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <LocationList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/list"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <CustomerList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers/list"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <SupplierList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/export"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <ExportGoods />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/import"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <ImportGoods />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/vouchers/:id"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <VoucherDetailView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/vouchers"
        element={
          <ProtectedRoute requiredRole={["admin", "staff"]}>
            <VoucherHistory />
          </ProtectedRoute>
        }
      />
    </Route>
  </Routes>
);

export default AppRoutes;

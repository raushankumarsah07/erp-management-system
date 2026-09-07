import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductListPage from './pages/products/ProductListPage';
import CustomerListPage from './pages/customers/CustomerListPage';
import SupplierListPage from './pages/suppliers/SupplierListPage';
import SalesOrderListPage from './pages/sales/SalesOrderListPage';
import PurchaseOrderListPage from './pages/purchases/PurchaseOrderListPage';
import GRNListPage from './pages/grn/GRNListPage';
import InvoiceListPage from './pages/invoices/InvoiceListPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ApiDocsPage from './pages/docs/ApiDocsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Enterprise ERP Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/customers" element={<CustomerListPage />} />
              <Route path="/suppliers" element={<SupplierListPage />} />
              <Route path="/sales-orders" element={<SalesOrderListPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
              <Route path="/grn" element={<GRNListPage />} />
              <Route path="/invoices" element={<InvoiceListPage />} />
              <Route path="/docs" element={<ApiDocsPage />} />

              {/* Admin Only Route */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </AuthProvider>
  );
}

export default App;

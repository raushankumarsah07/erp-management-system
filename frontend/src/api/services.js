import axiosClient from './axiosClient';

export const authService = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (userData) => axiosClient.post('/auth/register', userData),
  getMe: () => axiosClient.get('/auth/me'),
};

export const dashboardService = {
  getStats: () => axiosClient.get('/dashboard/stats'),
};

export const productService = {
  getAll: (params) => axiosClient.get('/products', { params }),
  getById: (id) => axiosClient.get(`/products/${id}`),
  create: (data) => axiosClient.post('/products', data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data),
  delete: (id) => axiosClient.delete(`/products/${id}`),
  getLowStockAlerts: () => axiosClient.get('/products/alerts/low-stock'),
};

export const customerService = {
  getAll: (params) => axiosClient.get('/customers', { params }),
  getById: (id) => axiosClient.get(`/customers/${id}`),
  create: (data) => axiosClient.post('/customers', data),
  update: (id, data) => axiosClient.put(`/customers/${id}`, data),
  delete: (id) => axiosClient.delete(`/customers/${id}`),
};

export const supplierService = {
  getAll: (params) => axiosClient.get('/suppliers', { params }),
  getById: (id) => axiosClient.get(`/suppliers/${id}`),
  create: (data) => axiosClient.post('/suppliers', data),
  update: (id, data) => axiosClient.put(`/suppliers/${id}`, data),
  delete: (id) => axiosClient.delete(`/suppliers/${id}`),
};

export const salesService = {
  getAll: (params) => axiosClient.get('/sales-orders', { params }),
  getById: (id) => axiosClient.get(`/sales-orders/${id}`),
  create: (data) => axiosClient.post('/sales-orders', data),
  update: (id, data) => axiosClient.put(`/sales-orders/${id}`, data),
  delete: (id) => axiosClient.delete(`/sales-orders/${id}`),
};

export const purchaseService = {
  getAll: (params) => axiosClient.get('/purchase-orders', { params }),
  getById: (id) => axiosClient.get(`/purchase-orders/${id}`),
  create: (data) => axiosClient.post('/purchase-orders', data),
  update: (id, data) => axiosClient.put(`/purchase-orders/${id}`, data),
  delete: (id) => axiosClient.delete(`/purchase-orders/${id}`),
};

export const grnService = {
  getAll: (params) => axiosClient.get('/grn', { params }),
  getById: (id) => axiosClient.get(`/grn/${id}`),
  create: (data) => axiosClient.post('/grn', data),
};

export const invoiceService = {
  getAll: (params) => axiosClient.get('/invoices', { params }),
  getById: (id) => axiosClient.get(`/invoices/${id}`),
  create: (data) => axiosClient.post('/invoices', data),
  update: (id, data) => axiosClient.put(`/invoices/${id}`, data),
  delete: (id) => axiosClient.delete(`/invoices/${id}`),
};

export const userService = {
  getAll: (params) => axiosClient.get('/users', { params }),
  getById: (id) => axiosClient.get(`/users/${id}`),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  delete: (id) => axiosClient.delete(`/users/${id}`),
};

export const docsService = {
  getDocs: () => axiosClient.get('/docs'),
};

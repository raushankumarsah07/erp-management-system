import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../api/services';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  DollarSign,
  ShoppingCart,
  Truck,
  AlertTriangle,
  Package,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating ERP metrics & analytics..." />;
  }

  const kpi = stats?.kpi || {};
  const monthlyTrends = stats?.monthlyTrends || [];
  const statusCounts = stats?.orderStatusCounts || {};

  const orderPieData = [
    { name: 'Pending', value: statusCounts.pending || 0 },
    { name: 'Approved', value: statusCounts.approved || 0 },
    { name: 'Shipped', value: statusCounts.shipped || 0 },
    { name: 'Delivered', value: statusCounts.delivered || 0 },
    { name: 'Cancelled', value: statusCounts.cancelled || 0 },
  ].filter((item) => item.value > 0);

  return (
    <div className="pb-4">
      {/* Top Welcome & Summary Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Executive Dashboard</h4>
          <p className="text-muted small mb-0">
            Real-time overview of business operations, sales performance, and supply chain.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/sales-orders">
            <Button variant="primary" size="sm" className="d-flex align-items-center gap-1.5">
              <ShoppingCart size={15} />
              <span>New Sales Order</span>
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1.5">
              <Package size={15} />
              <span>View Inventory</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={`$${(kpi.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle={`$${(kpi.pendingRevenue || 0).toLocaleString()} pending`}
            icon={DollarSign}
            color="#10b981"
            trend={12.4}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Sales Orders"
            value={kpi.totalSalesOrders || 0}
            subtitle={`${kpi.pendingSalesOrders || 0} pending processing`}
            icon={ShoppingCart}
            color="#2563eb"
            trend={8.2}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Purchase Orders"
            value={kpi.totalPurchaseOrders || 0}
            subtitle={`${kpi.pendingPurchaseOrders || 0} awaiting delivery`}
            icon={Truck}
            color="#8b5cf6"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Inventory Alerts"
            value={kpi.lowStockCount || 0}
            subtitle={`${kpi.outOfStockCount || 0} out of stock`}
            icon={AlertTriangle}
            color={kpi.lowStockCount > 0 ? '#ef4444' : '#10b981'}
          />
        </Col>
      </Row>

      {/* Analytics Charts Row */}
      <Row className="g-3 mb-4">
        {/* Sales & Procurement Trends */}
        <Col lg={8}>
          <div className="erp-card p-3.5 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">Monthly Sales vs Purchases</h6>
                <small className="text-muted">Financial comparison across recent months ($ USD)</small>
              </div>
              <span className="badge badge-soft-primary">Financial Trends</span>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="purchGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales Total"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    name="Purchases Total"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#purchGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

        {/* Order Status Distribution */}
        <Col lg={4}>
          <div className="erp-card p-3.5 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold text-dark mb-0">Order Status Breakdown</h6>
              <span className="badge badge-soft-info">Distribution</span>
            </div>
            <p className="text-muted small mb-2">Proportion of orders by active lifecycle stage</p>
            <div className="flex-grow-1" style={{ height: '240px', width: '100%' }}>
              {orderPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {orderPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                  No orders recorded yet
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Tables Row: Low Stock & Recent Orders */}
      <Row className="g-3">
        {/* Low Stock Alerts */}
        <Col lg={6}>
          <div className="erp-card p-3.5 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <h6 className="fw-bold text-dark mb-0">Inventory Low Stock Alerts</h6>
              </div>
              <Link to="/products" className="text-primary small fw-semibold text-decoration-none d-flex align-items-center gap-1">
                Manage Stock <ArrowRight size={14} />
              </Link>
            </div>
            {stats?.lowStockList && stats.lowStockList.length > 0 ? (
              <div className="table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>In Stock</th>
                      <th>Reorder Pt</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStockList.map((item) => (
                      <tr key={item._id}>
                        <td className="fw-medium text-dark">{item.title}</td>
                        <td className="text-muted small">{item.sku}</td>
                        <td>
                          <span className={`fw-bold ${item.stock === 0 ? 'text-danger' : 'text-warning'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="text-muted">{item.reorderLevel}</td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted small mb-0 py-3 text-center">
                All product stock levels are currently healthy.
              </p>
            )}
          </div>
        </Col>

        {/* Recent Invoices */}
        <Col lg={6}>
          <div className="erp-card p-3.5 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Clock size={18} className="text-primary" />
                <h6 className="fw-bold text-dark mb-0">Recent Invoices</h6>
              </div>
              <Link to="/invoices" className="text-primary small fw-semibold text-decoration-none d-flex align-items-center gap-1">
                All Invoices <ArrowRight size={14} />
              </Link>
            </div>
            {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
              <div className="table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentInvoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className="fw-bold text-primary small">{inv.invoiceNumber}</td>
                        <td className="text-dark">{inv.customer?.name || 'Customer'}</td>
                        <td className="fw-semibold">${(inv.totalAmount || 0).toLocaleString()}</td>
                        <td className="text-muted small">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td>
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted small mb-0 py-3 text-center">No recent invoices generated yet.</p>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

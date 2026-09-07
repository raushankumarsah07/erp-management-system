import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';

// @desc    Get dashboard metrics, charts, and alerts
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalCustomers,
      totalSuppliers,
      salesOrders,
      purchaseOrders,
      invoices,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $and: [{ $lte: ['$stock', '$reorderLevel'] }, { $gt: ['$stock', 0] }] } }),
      Product.countDocuments({ stock: { $lte: 0 } }),
      Customer.countDocuments(),
      Supplier.countDocuments(),
      SalesOrder.find().sort({ createdAt: -1 }),
      PurchaseOrder.find().sort({ createdAt: -1 }),
      Invoice.find().sort({ createdAt: -1 }).populate('customer', 'name'),
    ]);

    // Financial KPI calculations
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    const pendingRevenue = invoices
      .filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    const totalPurchases = purchaseOrders
      .filter((po) => po.status !== 'cancelled')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    const pendingSalesOrdersCount = salesOrders.filter((so) => so.status === 'pending' || so.status === 'approved').length;
    const pendingPOsCount = purchaseOrders.filter((po) => po.status === 'ordered' || po.status === 'partially_received').length;

    // Monthly Chart Data (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyDataMap[key] = { month: key, sales: 0, purchases: 0, revenue: 0 };
    }

    salesOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyDataMap[key] && order.status !== 'cancelled') {
        monthlyDataMap[key].sales += order.totalPrice || 0;
      }
    });

    purchaseOrders.forEach((po) => {
      const d = new Date(po.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyDataMap[key] && po.status !== 'cancelled') {
        monthlyDataMap[key].purchases += po.totalAmount || 0;
      }
    });

    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyDataMap[key] && inv.status === 'paid') {
        monthlyDataMap[key].revenue += inv.totalAmount || 0;
      }
    });

    const monthlyTrends = Object.values(monthlyDataMap);

    // Order status breakdown
    const orderStatusCounts = {
      pending: salesOrders.filter((o) => o.status === 'pending').length,
      approved: salesOrders.filter((o) => o.status === 'approved').length,
      shipped: salesOrders.filter((o) => o.status === 'shipped').length,
      delivered: salesOrders.filter((o) => o.status === 'delivered').length,
      cancelled: salesOrders.filter((o) => o.status === 'cancelled').length,
    };

    // Low stock items list (top 5)
    const lowStockList = await Product.find({
      $expr: { $lte: ['$stock', '$reorderLevel'] },
    }).limit(5).select('title sku stock reorderLevel price status');

    // Recent orders (top 5)
    const recentOrders = await SalesOrder.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name company');

    // Recent invoices (top 5)
    const recentInvoices = invoices.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalRevenue,
          pendingRevenue,
          totalPurchases,
          totalProducts,
          lowStockCount: lowStockProducts + outOfStockProducts,
          outOfStockCount: outOfStockProducts,
          totalCustomers,
          totalSuppliers,
          totalSalesOrders: salesOrders.length,
          pendingSalesOrders: pendingSalesOrdersCount,
          totalPurchaseOrders: purchaseOrders.length,
          pendingPurchaseOrders: pendingPOsCount,
        },
        monthlyTrends,
        orderStatusCounts,
        lowStockList,
        recentOrders,
        recentInvoices,
      },
    });
  } catch (error) {
    next(error);
  }
};

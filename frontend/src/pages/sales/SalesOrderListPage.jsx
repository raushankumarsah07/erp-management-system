import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Table, Badge } from 'react-bootstrap';
import { salesService, customerService, productService, invoiceService } from '../../api/services';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Eye, Trash2, FileText, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';

const SalesOrderListPage = () => {
  const { hasRole } = useAuth();
  const canCreate = hasRole(['admin', 'sales']);

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  // Create Order Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');

  // View Order Modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Status Change
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await salesService.getAll({
        page,
        limit: 10,
        search: searchTerm,
        status: selectedStatus,
      });
      if (res.data) {
        setOrders(res.data.data || []);
        setPagination({
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        productService.getAll({ limit: 100 }),
      ]);
      setCustomers(cRes.data?.data || []);
      setProductList(pRes.data?.data || []);
    } catch (e) {
      console.error('Error fetching dropdowns', e);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus]);

  // Order Items Handlers
  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;

    if (field === 'productId') {
      const selected = productList.find((p) => p._id === value);
      if (selected) {
        updated[index].unitPrice = selected.price;
      }
    }

    setOrderItems(updated);
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  };

  const subtotal = calculateSubtotal();
  const taxAmount = (subtotal * Number(taxRate)) / 100;
  const totalPrice = Math.max(0, subtotal + taxAmount - Number(discount || 0));

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    const validItems = orderItems.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid product to the order');
      return;
    }

    try {
      await salesService.create({
        customerId: selectedCustomer,
        items: validItems,
        taxRate,
        discount,
        notes: orderNotes,
      });
      toast.success('Sales order created successfully!');
      setShowCreateModal(false);
      setSelectedCustomer('');
      setOrderItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      setDiscount(0);
      setOrderNotes('');
      fetchOrders(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sales order');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await salesService.update(orderId, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders(pagination.currentPage);
      if (viewingOrder && viewingOrder._id === orderId) {
        setViewingOrder({ ...viewingOrder, status: newStatus });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGenerateInvoice = async (order) => {
    try {
      await invoiceService.create({
        salesOrderId: order._id,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success(`Invoice generated for order ${order.orderNumber}!`);
      fetchOrders(pagination.currentPage);
      if (showViewModal) setShowViewModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await salesService.delete(deletingId);
      toast.success('Sales order deleted successfully');
      setShowDeleteModal(false);
      fetchOrders(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const columns = [
    {
      header: 'Order #',
      accessor: 'orderNumber',
      render: (row) => <span className="fw-bold text-primary">{row.orderNumber}</span>,
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark d-block">{row.customer?.name || 'Customer'}</span>
          {row.customer?.company && <span className="text-muted small">{row.customer.company}</span>}
        </div>
      ),
    },
    {
      header: 'Items',
      accessor: 'items',
      render: (row) => <span className="text-secondary small">{row.items?.length || 0} product(s)</span>,
    },
    {
      header: 'Total Amount',
      accessor: 'totalPrice',
      render: (row) => <span className="fw-bold text-dark">${Number(row.totalPrice).toFixed(2)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Payment',
      accessor: 'paymentStatus',
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      render: (row) => <span className="text-muted small">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <Button
            variant="light"
            size="sm"
            className="p-1.5 text-secondary border"
            onClick={() => {
              setViewingOrder(row);
              setShowViewModal(true);
            }}
            title="View Order Details"
          >
            <Eye size={14} />
          </Button>

          {!row.invoiced && (
            <Button
              variant="outline-primary"
              size="sm"
              className="p-1.5 d-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleGenerateInvoice(row)}
              title="Generate Invoice"
            >
              <FileText size={13} />
              <span className="d-none d-lg-inline">Invoice</span>
            </Button>
          )}

          {hasRole(['admin']) && (
            <Button
              variant="light"
              size="sm"
              className="p-1.5 text-danger border"
              onClick={() => {
                setDeletingId(row._id);
                setShowDeleteModal(true);
              }}
              title="Delete Order"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Sales Orders</h4>
          <p className="text-muted small mb-0">Track and fulfill customer sales orders, calculate margins, and issue invoices.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search order number or customer..."
        filterComponent={
          <Form.Select
            size="sm"
            style={{ width: '160px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </Form.Select>
        }
        actionButton={
          canCreate && (
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="d-flex align-items-center gap-1.5">
              <Plus size={16} />
              <span>Create Sales Order</span>
            </Button>
          )
        }
        pagination={pagination}
        onPageChange={(p) => fetchOrders(p)}
      />

      {/* Create Sales Order Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Create New Sales Order</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateOrder}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-4" controlId="soCustomer">
              <Form.Label className="small fw-semibold text-secondary">Select Customer</Form.Label>
              <Form.Select
                required
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Line Items */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small fw-semibold text-secondary text-uppercase" style={{ letterSpacing: '0.04em' }}>
                  Order Line Items
                </span>
                <Button variant="outline-primary" size="sm" onClick={handleAddItem} style={{ fontSize: '0.78rem' }}>
                  + Add Item
                </Button>
              </div>

              {orderItems.map((item, idx) => (
                <Row key={idx} className="g-2 mb-2 align-items-center">
                  <Col md={6}>
                    <Form.Select
                      size="sm"
                      required
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    >
                      <option value="">-- Select Product --</option>
                      {productList.map((p) => (
                        <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                          {p.title} (Stock: {p.stock}) - ${Number(p.price).toFixed(2)}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Control
                      size="sm"
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Control
                      size="sm"
                      type="number"
                      step="0.01"
                      placeholder="Unit $"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    />
                  </Col>
                  <Col md={2} className="d-flex align-items-center justify-content-between">
                    <span className="fw-semibold small text-dark">
                      ${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
                    </span>
                    {orderItems.length > 1 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0 ms-2"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
            </div>

            {/* Calculations & Summary */}
            <div className="p-3 bg-light rounded-3 border mt-3">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="soNotes">
                    <Form.Label className="small fw-semibold text-secondary">Order Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Shipping instructions, discount codes..."
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Subtotal:</span>
                    <span className="fw-semibold text-dark">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-1 align-items-center">
                    <span>Tax Rate (%):</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      style={{ width: '80px', height: '26px' }}
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                    />
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-2 align-items-center">
                    <span>Discount ($):</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      style={{ width: '80px', height: '26px' }}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                  <div className="d-flex justify-content-between border-top pt-2 fw-bold text-dark fs-6">
                    <span>Grand Total:</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </Col>
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm & Save Order
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Order Detail Modal */}
      {viewingOrder && (
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
              <span>Order Details: {viewingOrder.orderNumber}</span>
              <StatusBadge status={viewingOrder.status} />
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="mb-3">
              <Col md={6}>
                <h6 className="fw-bold small text-uppercase text-secondary mb-1">Customer Info</h6>
                <p className="mb-0 fw-semibold text-dark">{viewingOrder.customer?.name}</p>
                <p className="mb-0 text-muted small">{viewingOrder.customer?.company}</p>
                <p className="mb-0 text-muted small">{viewingOrder.customer?.email} | {viewingOrder.customer?.phone}</p>
              </Col>
              <Col md={6} className="text-md-end">
                <h6 className="fw-bold small text-uppercase text-secondary mb-1">Order Details</h6>
                <p className="mb-0 text-muted small">Date: {new Date(viewingOrder.createdAt).toLocaleString()}</p>
                <p className="mb-0 text-muted small">Payment: <StatusBadge status={viewingOrder.paymentStatus} /></p>
                {viewingOrder.shippingAddress && (
                  <p className="mb-0 text-muted small">Ship To: {viewingOrder.shippingAddress}</p>
                )}
              </Col>
            </Row>

            <Table responsive className="erp-table mb-3">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewingOrder.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="fw-medium text-dark">{item.title}</td>
                    <td className="text-muted small">{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="text-end fw-semibold text-dark">${Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-end">
              <div style={{ width: '240px' }}>
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Subtotal:</span>
                  <span>${Number(viewingOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Tax ({viewingOrder.taxRate || 10}%):</span>
                  <span>${Number(viewingOrder.taxAmount || 0).toFixed(2)}</span>
                </div>
                {viewingOrder.discount > 0 && (
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Discount:</span>
                    <span>-${Number(viewingOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between fw-bold text-dark border-top pt-2">
                  <span>Total Amount:</span>
                  <span className="text-primary">${Number(viewingOrder.totalPrice).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quick Status Control Toolbar */}
            <div className="p-3 bg-light rounded-3 border mt-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="small fw-semibold text-secondary">Update Order Lifecycle:</span>
              <div className="d-flex gap-1.5">
                <Button
                  variant="outline-success"
                  size="sm"
                  disabled={updatingStatus || viewingOrder.status === 'approved'}
                  onClick={() => handleUpdateStatus(viewingOrder._id, 'approved')}
                >
                  Approve
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={updatingStatus || viewingOrder.status === 'shipped'}
                  onClick={() => handleUpdateStatus(viewingOrder._id, 'shipped')}
                >
                  Ship
                </Button>
                <Button
                  variant="outline-dark"
                  size="sm"
                  disabled={updatingStatus || viewingOrder.status === 'delivered'}
                  onClick={() => handleUpdateStatus(viewingOrder._id, 'delivered')}
                >
                  Deliver
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  disabled={updatingStatus || viewingOrder.status === 'cancelled'}
                  onClick={() => handleUpdateStatus(viewingOrder._id, 'cancelled')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            {!viewingOrder.invoiced && (
              <Button
                variant="primary"
                size="sm"
                className="d-flex align-items-center gap-1.5"
                onClick={() => handleGenerateInvoice(viewingOrder)}
              >
                <FileText size={15} />
                <span>Generate Invoice</span>
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      )}

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteOrder}
        title="Delete Sales Order"
        message="Are you sure you want to delete this sales order?"
      />
    </div>
  );
};

export default SalesOrderListPage;

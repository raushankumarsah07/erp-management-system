import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { purchaseService, supplierService, productService, grnService } from '../../api/services';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Eye, Trash2, FileCheck, Truck, ArrowRight } from 'lucide-react';

const PurchaseOrderListPage = () => {
  const { hasRole } = useAuth();
  const canCreate = hasRole(['admin', 'purchase']);
  const canReceive = hasRole(['admin', 'inventory', 'purchase']);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  // Create PO Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [expectedDate, setExpectedDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // View PO Modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Quick GRN Modal
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [grnTargetOrder, setGrnTargetOrder] = useState(null);
  const [grnReceivedItems, setGrnReceivedItems] = useState([]);
  const [grnNotes, setGrnNotes] = useState('');

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await purchaseService.getAll({
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
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        supplierService.getAll({ limit: 100 }),
        productService.getAll({ limit: 100 }),
      ]);
      setSuppliers(sRes.data?.data || []);
      setProductList(pRes.data?.data || []);
    } catch (e) {
      console.error('Error fetching suppliers or products', e);
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

  // PO Items
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
        updated[index].unitPrice = selected.costPrice || selected.price;
      }
    }

    setOrderItems(updated);
  };

  const subtotal = orderItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );
  const taxAmount = (subtotal * 10) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }

    const validItems = orderItems.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid product');
      return;
    }

    try {
      await purchaseService.create({
        supplierId: selectedSupplier,
        items: validItems,
        expectedDeliveryDate: expectedDate,
        notes: orderNotes,
      });
      toast.success('Purchase order created successfully!');
      setShowCreateModal(false);
      setSelectedSupplier('');
      setOrderItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      setExpectedDate('');
      setOrderNotes('');
      fetchOrders(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const handleOpenGRNModal = (order) => {
    setGrnTargetOrder(order);
    const initialItems = order.items.map((it) => ({
      productId: it.product?._id || it.product,
      title: it.title,
      sku: it.sku,
      orderedQuantity: it.quantity,
      receivedQuantity: it.quantity,
      acceptedQuantity: it.quantity,
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      remarks: 'Inspected and verified.',
    }));
    setGrnReceivedItems(initialItems);
    setShowGRNModal(true);
  };

  const handleGRNQuantityChange = (idx, field, val) => {
    const updated = [...grnReceivedItems];
    updated[idx][field] = val;
    setGrnReceivedItems(updated);
  };

  const handleSubmitGRN = async (e) => {
    e.preventDefault();
    try {
      await grnService.create({
        purchaseOrderId: grnTargetOrder._id,
        receivedItems: grnReceivedItems,
        notes: grnNotes,
        status: 'accepted',
      });
      toast.success('Goods Receipt Note (GRN) created & inventory updated!');
      setShowGRNModal(false);
      fetchOrders(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create GRN');
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await purchaseService.delete(deletingId);
      toast.success('Purchase order deleted successfully');
      setShowDeleteModal(false);
      fetchOrders(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete purchase order');
    }
  };

  const columns = [
    {
      header: 'PO Number',
      accessor: 'poNumber',
      render: (row) => <span className="fw-bold text-primary">{row.poNumber}</span>,
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark d-block">{row.supplier?.name || 'Supplier'}</span>
          {row.supplier?.company && <span className="text-muted small">{row.supplier.company}</span>}
        </div>
      ),
    },
    {
      header: 'Items',
      accessor: 'items',
      render: (row) => <span className="text-secondary small">{row.items?.length || 0} product line(s)</span>,
    },
    {
      header: 'Total Cost',
      accessor: 'totalAmount',
      render: (row) => <span className="fw-bold text-dark">${Number(row.totalAmount).toFixed(2)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Expected Date',
      accessor: 'expectedDeliveryDate',
      render: (row) => (
        <span className="text-muted small">
          {row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
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
            title="View Details"
          >
            <Eye size={14} />
          </Button>

          {canReceive && row.status !== 'received' && row.status !== 'cancelled' && (
            <Button
              variant="outline-success"
              size="sm"
              className="p-1.5 d-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleOpenGRNModal(row)}
              title="Receive Goods (GRN)"
            >
              <FileCheck size={13} />
              <span className="d-none d-lg-inline">Receive</span>
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
              title="Delete PO"
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
          <h4 className="fw-bold text-dark mb-1">Purchase Orders</h4>
          <p className="text-muted small mb-0">Manage supplier purchase orders, track incoming restocks, and generate receipt notes.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search PO number or supplier name..."
        filterComponent={
          <Form.Select
            size="sm"
            style={{ width: '160px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </Form.Select>
        }
        actionButton={
          canCreate && (
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="d-flex align-items-center gap-1.5">
              <Plus size={16} />
              <span>Create Purchase Order</span>
            </Button>
          )
        }
        pagination={pagination}
        onPageChange={(p) => fetchOrders(p)}
      />

      {/* Create Purchase Order Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">New Purchase Order</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateOrder}>
          <Modal.Body className="p-4">
            <Row className="g-3 mb-3">
              <Col md={7}>
                <Form.Group controlId="poSupplier">
                  <Form.Label className="small fw-semibold text-secondary">Select Supplier</Form.Label>
                  <Form.Select
                    required
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">-- Choose Vendor --</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.company ? `(${s.company})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group controlId="poExpDate">
                  <Form.Label className="small fw-semibold text-secondary">Expected Delivery Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Line items */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small fw-semibold text-secondary text-uppercase" style={{ letterSpacing: '0.04em' }}>
                  Restock Products
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
                        <option key={p._id} value={p._id}>
                          {p.title} (Stock: {p.stock}) - Cost: ${Number(p.costPrice || p.price).toFixed(2)}
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
                      placeholder="Unit Cost"
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

            <div className="p-3 bg-light rounded-3 border mt-3">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="poNotes">
                    <Form.Label className="small fw-semibold text-secondary">Procurement Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Delivery terms, special warehouse dock instructions..."
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Subtotal:</span>
                    <span className="fw-semibold text-dark">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-2">
                    <span>Tax (10%):</span>
                    <span className="fw-semibold text-dark">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between border-top pt-2 fw-bold text-dark fs-6">
                    <span>Total Purchase Cost:</span>
                    <span className="text-primary">${totalAmount.toFixed(2)}</span>
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
              Issue Purchase Order
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Goods Receipt (GRN) Receipt Form Modal */}
      {grnTargetOrder && (
        <Modal show={showGRNModal} onHide={() => setShowGRNModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              Receive Goods (GRN) for {grnTargetOrder.poNumber}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmitGRN}>
            <Modal.Body className="p-4">
              <div className="alert alert-info py-2 small mb-3">
                Recording and accepting this Goods Receipt Note will <strong>automatically increment</strong> your inventory stock levels in MongoDB.
              </div>

              <Table responsive className="erp-table mb-3">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Ordered</th>
                    <th>Received Qty</th>
                    <th>Accepted Qty</th>
                    <th>Batch / Lot #</th>
                  </tr>
                </thead>
                <tbody>
                  {grnReceivedItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-medium text-dark">{item.title}</td>
                      <td className="text-muted">{item.orderedQuantity}</td>
                      <td style={{ width: '120px' }}>
                        <Form.Control
                          size="sm"
                          type="number"
                          min="0"
                          value={item.receivedQuantity}
                          onChange={(e) => handleGRNQuantityChange(idx, 'receivedQuantity', e.target.value)}
                        />
                      </td>
                      <td style={{ width: '120px' }}>
                        <Form.Control
                          size="sm"
                          type="number"
                          min="0"
                          value={item.acceptedQuantity}
                          onChange={(e) => handleGRNQuantityChange(idx, 'acceptedQuantity', e.target.value)}
                        />
                      </td>
                      <td style={{ width: '150px' }}>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleGRNQuantityChange(idx, 'batchNumber', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Form.Group controlId="grnNoteText">
                <Form.Label className="small fw-semibold text-secondary">Inspection / Warehouse Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={grnNotes}
                  onChange={(e) => setGrnNotes(e.target.value)}
                  placeholder="Items inspected and verified without defects..."
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" size="sm" onClick={() => setShowGRNModal(false)}>
                Cancel
              </Button>
              <Button variant="success" size="sm" type="submit">
                Accept & Update Stock
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* View PO Modal */}
      {viewingOrder && (
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
              <span>Purchase Order: {viewingOrder.poNumber}</span>
              <StatusBadge status={viewingOrder.status} />
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="mb-3">
              <Col md={6}>
                <h6 className="fw-bold small text-uppercase text-secondary mb-1">Vendor Info</h6>
                <p className="mb-0 fw-semibold text-dark">{viewingOrder.supplier?.name}</p>
                <p className="mb-0 text-muted small">{viewingOrder.supplier?.company}</p>
                <p className="mb-0 text-muted small">{viewingOrder.supplier?.email} | {viewingOrder.supplier?.phone}</p>
              </Col>
              <Col md={6} className="text-md-end">
                <h6 className="fw-bold small text-uppercase text-secondary mb-1">Order Details</h6>
                <p className="mb-0 text-muted small">Date: {new Date(viewingOrder.createdAt).toLocaleString()}</p>
                <p className="mb-0 text-muted small">
                  Expected Delivery: {viewingOrder.expectedDeliveryDate ? new Date(viewingOrder.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                </p>
              </Col>
            </Row>

            <Table responsive className="erp-table mb-3">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
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
              <div style={{ width: '220px' }}>
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Subtotal:</span>
                  <span>${Number(viewingOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Tax (10%):</span>
                  <span>${Number(viewingOrder.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold text-dark border-top pt-2">
                  <span>Total Amount:</span>
                  <span className="text-primary">${Number(viewingOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteOrder}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order?"
      />
    </div>
  );
};

export default PurchaseOrderListPage;

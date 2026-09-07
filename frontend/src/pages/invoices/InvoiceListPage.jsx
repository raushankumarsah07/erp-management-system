import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Table, Badge } from 'react-bootstrap';
import { invoiceService, salesService, customerService } from '../../api/services';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Eye, Trash2, Download, CheckCircle, CreditCard, DollarSign } from 'lucide-react';

const InvoiceListPage = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'sales', 'finance']);

  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  // Create Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  // View Modal & PDF
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchInvoices = async (page = 1) => {
    try {
      setLoading(true);
      const res = await invoiceService.getAll({
        page,
        limit: 10,
        search: searchTerm,
        status: selectedStatus,
      });
      if (res.data) {
        setInvoices(res.data.data || []);
        setPagination({
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [soRes, cRes] = await Promise.all([
        salesService.getAll({ limit: 100 }),
        customerService.getAll({ limit: 100 }),
      ]);
      setSalesOrders(soRes.data?.data || []);
      setCustomers(cRes.data?.data || []);
    } catch (e) {
      console.error('Error fetching dependencies', e);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      toast.error('Please choose a sales order');
      return;
    }

    try {
      await invoiceService.create({
        salesOrderId: selectedOrderId,
        dueDate,
        paymentMethod,
        notes,
      });
      toast.success('Invoice issued successfully');
      setShowCreateModal(false);
      setSelectedOrderId('');
      setNotes('');
      fetchInvoices(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const handleMarkAsPaid = async (inv) => {
    try {
      await invoiceService.update(inv._id, {
        status: 'paid',
        paymentDate: new Date().toISOString(),
      });
      toast.success(`Invoice ${inv.invoiceNumber} marked as Paid!`);
      fetchInvoices(pagination.currentPage);
      if (viewingInvoice && viewingInvoice._id === inv._id) {
        setViewingInvoice({ ...viewingInvoice, status: 'paid' });
      }
    } catch (err) {
      toast.error('Failed to update invoice status');
    }
  };

  // Export to PDF using jsPDF + autotable
  const handleExportPDF = (inv) => {
    try {
      const doc = new jsPDF();

      // Brand Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('APEX ENTERPRISE ERP', 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('INVOICE DOCUMENT', 160, 20);

      // Invoice & Customer Info
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Invoice #: ${inv.invoiceNumber}`, 14, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(`Issue Date: ${new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}`, 14, 52);
      doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`, 14, 59);
      doc.text(`Payment Status: ${(inv.status || 'unpaid').toUpperCase()}`, 14, 66);

      // Customer Details (Right column)
      doc.setFont('helvetica', 'bold');
      doc.text('Billed To:', 130, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(`${inv.customer?.name || 'Customer'}`, 130, 52);
      if (inv.customer?.company) doc.text(`${inv.customer.company}`, 130, 59);
      if (inv.customer?.email) doc.text(`${inv.customer.email}`, 130, 66);
      if (inv.customer?.phone) doc.text(`${inv.customer.phone}`, 130, 73);

      // Table of Items
      const tableRows = (inv.items || []).map((item, idx) => [
        idx + 1,
        item.title,
        item.sku || 'N/A',
        item.quantity,
        `$${Number(item.unitPrice).toFixed(2)}`,
        `$${Number(item.total).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 82,
        head: [['#', 'Item Description', 'SKU', 'Qty', 'Unit Price', 'Amount']],
        body: tableRows,
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3.5 },
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // Summary
      doc.setFontSize(10);
      doc.text(`Subtotal: $${Number(inv.subtotal || 0).toFixed(2)}`, 140, finalY);
      doc.text(`Tax (${inv.taxRate || 10}%): $${Number(inv.taxAmount || 0).toFixed(2)}`, 140, finalY + 6);
      if (inv.discount > 0) {
        doc.text(`Discount: -$${Number(inv.discount).toFixed(2)}`, 140, finalY + 12);
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(`Total Amount: $${Number(inv.totalAmount).toFixed(2)}`, 140, finalY + 20);

      // Payment Terms / Notes
      if (inv.notes) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(`Note: ${inv.notes}`, 14, finalY + 28);
      }

      doc.save(`Invoice_${inv.invoiceNumber}.pdf`);
      toast.success('Invoice exported as PDF successfully!');
    } catch (err) {
      console.error('PDF Generation error', err);
      toast.error('Failed to export PDF');
    }
  };

  const handleDelete = async () => {
    try {
      await invoiceService.delete(deletingId);
      toast.success('Invoice deleted');
      setShowDeleteModal(false);
      fetchInvoices(pagination.currentPage);
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      render: (row) => <span className="fw-bold text-primary">{row.invoiceNumber}</span>,
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
      header: 'Total Amount',
      accessor: 'totalAmount',
      render: (row) => <span className="fw-bold text-dark">${Number(row.totalAmount).toFixed(2)}</span>,
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      render: (row) => <span className="text-secondary small">{new Date(row.dueDate).toLocaleDateString()}</span>,
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (row) => <span className="text-capitalize small text-muted">{row.paymentMethod?.replace('_', ' ')}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
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
              setViewingInvoice(row);
              setShowViewModal(true);
            }}
            title="View Invoice"
          >
            <Eye size={14} />
          </Button>

          <Button
            variant="light"
            size="sm"
            className="p-1.5 text-primary border"
            onClick={() => handleExportPDF(row)}
            title="Download PDF"
          >
            <Download size={14} />
          </Button>

          {canManage && row.status !== 'paid' && (
            <Button
              variant="outline-success"
              size="sm"
              className="p-1.5 d-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleMarkAsPaid(row)}
              title="Mark as Paid"
            >
              <CheckCircle size={13} />
              <span className="d-none d-lg-inline">Paid</span>
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
              title="Delete Invoice"
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
          <h4 className="fw-bold text-dark mb-1">Invoices & Billing</h4>
          <p className="text-muted small mb-0">Generate customer invoices, track payment receipts, and download PDF statements.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search invoice number..."
        filterComponent={
          <Form.Select
            size="sm"
            style={{ width: '150px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Invoices</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Form.Select>
        }
        actionButton={
          canManage && (
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="d-flex align-items-center gap-1.5">
              <Plus size={16} />
              <span>Issue Invoice</span>
            </Button>
          )
        }
        pagination={pagination}
        onPageChange={(p) => fetchInvoices(p)}
      />

      {/* Create Invoice Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="md" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Issue New Invoice</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateInvoice}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3" controlId="invOrder">
              <Form.Label className="small fw-semibold text-secondary">Linked Sales Order</Form.Label>
              <Form.Select
                required
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              >
                <option value="">-- Choose Sales Order --</option>
                {salesOrders.map((so) => (
                  <option key={so._id} value={so._id}>
                    {so.orderNumber} - {so.customer?.name} (${Number(so.totalPrice).toFixed(2)})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="invDueDate">
                  <Form.Label className="small fw-semibold text-secondary">Payment Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="invPayMethod">
                  <Form.Label className="small fw-semibold text-secondary">Payment Method</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="bank_transfer">Bank Transfer (ACH)</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="invNotes">
              <Form.Label className="small fw-semibold text-secondary">Invoice Terms & Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment is due within 15 days of invoice date..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create & Issue Invoice
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
              <span>Invoice: {viewingInvoice.invoiceNumber}</span>
              <StatusBadge status={viewingInvoice.status} />
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="mb-4">
              <Col md={6}>
                <span className="small text-uppercase fw-bold text-secondary d-block mb-1">Customer Details</span>
                <h6 className="fw-bold text-dark mb-0">{viewingInvoice.customer?.name}</h6>
                <p className="mb-0 text-muted small">{viewingInvoice.customer?.company}</p>
                <p className="mb-0 text-muted small">{viewingInvoice.customer?.email}</p>
              </Col>
              <Col md={6} className="text-md-end">
                <span className="small text-uppercase fw-bold text-secondary d-block mb-1">Billing Summary</span>
                <p className="mb-0 text-muted small">Date: {new Date(viewingInvoice.issueDate || viewingInvoice.createdAt).toLocaleDateString()}</p>
                <p className="mb-0 text-muted small">Due Date: <strong>{new Date(viewingInvoice.dueDate).toLocaleDateString()}</strong></p>
                <p className="mb-0 text-muted small text-capitalize">Method: {viewingInvoice.paymentMethod?.replace('_', ' ')}</p>
              </Col>
            </Row>

            <Table responsive className="erp-table mb-3">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewingInvoice.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="fw-medium text-dark">{it.title}</td>
                    <td className="text-muted small">{it.sku || 'N/A'}</td>
                    <td>{it.quantity}</td>
                    <td>${Number(it.unitPrice).toFixed(2)}</td>
                    <td className="text-end fw-semibold text-dark">${Number(it.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-end">
              <div style={{ width: '220px' }}>
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Subtotal:</span>
                  <span>${Number(viewingInvoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Tax ({viewingInvoice.taxRate || 10}%):</span>
                  <span>${Number(viewingInvoice.taxAmount || 0).toFixed(2)}</span>
                </div>
                {viewingInvoice.discount > 0 && (
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Discount:</span>
                    <span>-${Number(viewingInvoice.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between fw-bold text-dark border-top pt-2">
                  <span>Grand Total:</span>
                  <span className="text-primary">${Number(viewingInvoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              className="d-flex align-items-center gap-1.5"
              onClick={() => handleExportPDF(viewingInvoice)}
            >
              <Download size={15} />
              <span>Export PDF</span>
            </Button>
            {canManage && viewingInvoice.status !== 'paid' && (
              <Button
                variant="success"
                size="sm"
                className="d-flex align-items-center gap-1.5"
                onClick={() => handleMarkAsPaid(viewingInvoice)}
              >
                <CheckCircle size={15} />
                <span>Mark as Paid</span>
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      )}

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice statement?"
      />
    </div>
  );
};

export default InvoiceListPage;

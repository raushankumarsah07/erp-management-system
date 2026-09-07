import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { supplierService } from '../../api/services';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Mail, Phone, MapPin, CreditCard } from 'lucide-react';

const SupplierListPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'purchase']);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contact: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    paymentTerms: 'Net 30',
    taxNumber: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSuppliers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await supplierService.getAll({ page, limit: 10, search: searchTerm });
      if (res.data) {
        setSuppliers(res.data.data || []);
        setPagination({
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      company: '',
      contact: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      paymentTerms: 'Net 30',
      taxNumber: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (supp) => {
    setModalMode('edit');
    setSelectedSupplier(supp);
    setFormData({
      name: supp.name,
      company: supp.company || '',
      contact: supp.contact || '',
      email: supp.email,
      phone: supp.phone,
      street: supp.address?.street || '',
      city: supp.address?.city || '',
      state: supp.address?.state || '',
      zipCode: supp.address?.zipCode || '',
      country: supp.address?.country || 'USA',
      paymentTerms: supp.paymentTerms || 'Net 30',
      taxNumber: supp.taxNumber || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      company: formData.company,
      contact: formData.contact,
      email: formData.email,
      phone: formData.phone,
      paymentTerms: formData.paymentTerms,
      taxNumber: formData.taxNumber,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      },
    };

    try {
      if (modalMode === 'create') {
        await supplierService.create(payload);
        toast.success('Supplier added successfully');
      } else {
        await supplierService.update(selectedSupplier._id, payload);
        toast.success('Supplier updated successfully');
      }
      setShowModal(false);
      fetchSuppliers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await supplierService.delete(deletingId);
      toast.success('Supplier deleted successfully');
      setShowDeleteModal(false);
      fetchSuppliers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete supplier');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Supplier / Vendor',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark d-block">{row.name}</span>
          {row.company && <span className="text-secondary small">{row.company}</span>}
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: 'contact',
      render: (row) => <span className="text-dark">{row.contact || 'Account Rep'}</span>,
    },
    {
      header: 'Email & Phone',
      accessor: 'email',
      render: (row) => (
        <div className="small">
          <div className="d-flex align-items-center gap-1.5 text-muted">
            <Mail size={13} className="text-secondary" />
            <span>{row.email}</span>
          </div>
          <div className="d-flex align-items-center gap-1.5 text-muted mt-0.5">
            <Phone size={13} className="text-secondary" />
            <span>{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Terms',
      accessor: 'paymentTerms',
      render: (row) => (
        <div className="d-flex align-items-center gap-1.5 small text-dark fw-medium">
          <CreditCard size={13} className="text-muted" />
          <span>{row.paymentTerms || 'Net 30'}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: 'address',
      render: (row) => (
        <div className="d-flex align-items-center gap-1.5 text-secondary small">
          <MapPin size={13} className="text-muted flex-shrink-0" />
          <span>
            {row.address?.city ? `${row.address.city}, ${row.address.state || ''}` : 'Not Specified'}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          {canEdit && (
            <Button
              variant="light"
              size="sm"
              className="p-1.5 text-secondary border"
              onClick={() => handleOpenEditModal(row)}
            >
              <Edit2 size={14} />
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
          <h4 className="fw-bold text-dark mb-1">Supplier Directory</h4>
          <p className="text-muted small mb-0">Manage authorized vendors, payment terms, and procurement points.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search supplier by name, company, email, or terms..."
        actionButton={
          canEdit && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="d-flex align-items-center gap-1.5">
              <Plus size={16} />
              <span>Add Supplier</span>
            </Button>
          )
        }
        pagination={pagination}
        onPageChange={(p) => fetchSuppliers(p)}
      />

      {/* Add / Edit Supplier Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {modalMode === 'create' ? 'Add New Supplier' : 'Edit Supplier'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="suppName">
                  <Form.Label className="small fw-semibold text-secondary">Supplier / Vendor Name</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Global Machineries Corp"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="suppCompany">
                  <Form.Label className="small fw-semibold text-secondary">Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Global Machineries Inc."
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="suppContact">
                  <Form.Label className="small fw-semibold text-secondary">Primary Contact Person</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="e.g. Klaus Schmidt"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="suppEmail">
                  <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="supply@global.com"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="suppPhone">
                  <Form.Label className="small fw-semibold text-secondary">Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="suppTerms">
                  <Form.Label className="small fw-semibold text-secondary">Payment Terms</Form.Label>
                  <Form.Select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Advance Payment">Advance Payment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="suppTax">
                  <Form.Label className="small fw-semibold text-secondary">Tax / VAT Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="SUP-991823"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="suppStreet">
                  <Form.Label className="small fw-semibold text-secondary">Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="250 Factory Lane"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="suppCity">
                  <Form.Label className="small fw-semibold text-secondary">City</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Detroit"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="suppState">
                  <Form.Label className="small fw-semibold text-secondary">State / Province</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="MI"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="suppZip">
                  <Form.Label className="small fw-semibold text-secondary">ZIP / Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="48201"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {modalMode === 'create' ? 'Save Supplier' : 'Update Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message="Are you sure you want to remove this supplier from the directory?"
        loading={deleteLoading}
      />
    </div>
  );
};

export default SupplierListPage;

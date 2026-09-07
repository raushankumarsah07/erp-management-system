import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { customerService } from '../../api/services';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Mail, Phone, MapPin } from 'lucide-react';

const CustomerListPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'sales']);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
    taxNumber: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await customerService.getAll({ page, limit: 10, search: searchTerm });
      if (res.data) {
        setCustomers(res.data.data || []);
        setPagination({
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1);
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
      taxNumber: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (cust) => {
    setModalMode('edit');
    setSelectedCustomer(cust);
    setFormData({
      name: cust.name,
      company: cust.company || '',
      contact: cust.contact || '',
      email: cust.email,
      phone: cust.phone,
      street: cust.address?.street || '',
      city: cust.address?.city || '',
      state: cust.address?.state || '',
      zipCode: cust.address?.zipCode || '',
      country: cust.address?.country || 'USA',
      taxNumber: cust.taxNumber || '',
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
        await customerService.create(payload);
        toast.success('Customer added successfully');
      } else {
        await customerService.update(selectedCustomer._id, payload);
        toast.success('Customer updated successfully');
      }
      setShowModal(false);
      fetchCustomers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await customerService.delete(deletingId);
      toast.success('Customer deleted successfully');
      setShowDeleteModal(false);
      fetchCustomers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Customer / Company',
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
      render: (row) => <span className="text-dark">{row.contact || 'Primary Contact'}</span>,
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
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
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
          <h4 className="fw-bold text-dark mb-1">Customer Directory</h4>
          <p className="text-muted small mb-0">Manage customer relationships, addresses, and order history.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customer by name, company, email, or phone..."
        actionButton={
          canEdit && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="d-flex align-items-center gap-1.5">
              <Plus size={16} />
              <span>Add Customer</span>
            </Button>
          )
        }
        pagination={pagination}
        onPageChange={(p) => fetchCustomers(p)}
      />

      {/* Add / Edit Customer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {modalMode === 'create' ? 'Add New Customer' : 'Edit Customer'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="custName">
                  <Form.Label className="small fw-semibold text-secondary">Customer / Entity Name</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex Industrial Solutions"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="custCompany">
                  <Form.Label className="small fw-semibold text-secondary">Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Apex Industries Inc."
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="custContact">
                  <Form.Label className="small fw-semibold text-secondary">Primary Contact Person</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="e.g. Robert Taylor"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="custEmail">
                  <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="orders@apex.com"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="custPhone">
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

              <Col md={12}>
                <Form.Group controlId="custStreet">
                  <Form.Label className="small fw-semibold text-secondary">Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="100 Industrial Parkway"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="custCity">
                  <Form.Label className="small fw-semibold text-secondary">City</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Chicago"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="custState">
                  <Form.Label className="small fw-semibold text-secondary">State / Province</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="IL"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="custZip">
                  <Form.Label className="small fw-semibold text-secondary">ZIP / Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="60607"
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
              {modalMode === 'create' ? 'Save Customer' : 'Update Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to remove this customer from the directory?"
        loading={deleteLoading}
      />
    </div>
  );
};

export default CustomerListPage;

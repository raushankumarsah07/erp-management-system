import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import { userService } from '../../api/services';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Shield, Edit2, Trash2, UserCheck, Mail, Building } from 'lucide-react';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  // Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'sales',
    department: '',
    phone: '',
    status: 'active',
  });

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await userService.getAll({
        page,
        limit: 10,
        search: searchTerm,
        role: selectedRole,
      });
      if (res.data) {
        setUsers(res.data.data || []);
        setPagination({
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedRole]);

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setEditFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || '',
      phone: u.phone || '',
      status: u.status || 'active',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.update(selectedUser._id, editFormData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userService.delete(deletingId);
      toast.success('User account deleted');
      setShowDeleteModal(false);
      fetchUsers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const columns = [
    {
      header: 'Employee Name',
      accessor: 'name',
      render: (row) => (
        <div className="d-flex align-items-center gap-2.5">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
          >
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="fw-semibold text-dark d-block">{row.name}</span>
            <span className="text-muted small">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (row) => (
        <span className="badge badge-soft-primary text-uppercase" style={{ letterSpacing: '0.04em' }}>
          {row.role}
        </span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => <span className="text-secondary small">{row.department || 'Operations'}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Joined Date',
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
            onClick={() => handleOpenEdit(row)}
            title="Edit Role & Status"
          >
            <Edit2 size={14} />
          </Button>

          {currentUser?.id !== row._id && (
            <Button
              variant="light"
              size="sm"
              className="p-1.5 text-danger border"
              onClick={() => {
                setDeletingId(row._id);
                setShowDeleteModal(true);
              }}
              title="Delete User"
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
          <h4 className="fw-bold text-dark mb-1">User & Role Management</h4>
          <p className="text-muted small mb-0">Administer employee accounts, assign module permissions, and control access.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employee by name, email, or department..."
        filterComponent={
          <Form.Select
            size="sm"
            style={{ width: '160px' }}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="sales">Sales</option>
            <option value="purchase">Purchase</option>
            <option value="inventory">Inventory</option>
            <option value="finance">Finance</option>
          </Form.Select>
        }
        pagination={pagination}
        onPageChange={(p) => fetchUsers(p)}
      />

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="md" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Update Employee Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3" controlId="uName">
              <Form.Label className="small fw-semibold text-secondary">Full Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="uEmail">
              <Form.Label className="small fw-semibold text-secondary">Email</Form.Label>
              <Form.Control
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="uRole">
                  <Form.Label className="small fw-semibold text-secondary">Security Role</Form.Label>
                  <Form.Select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    <option value="admin">Admin (Full Access)</option>
                    <option value="sales">Sales</option>
                    <option value="purchase">Purchase</option>
                    <option value="inventory">Inventory</option>
                    <option value="finance">Finance</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="uStatus">
                  <Form.Label className="small fw-semibold text-secondary">Account Status</Form.Label>
                  <Form.Select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="uDept">
              <Form.Label className="small fw-semibold text-secondary">Department</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message="Are you sure you want to permanently delete this user account?"
      />
    </div>
  );
};

export default UserManagementPage;

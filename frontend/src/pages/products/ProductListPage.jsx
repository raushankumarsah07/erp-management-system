import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import { productService } from '../../api/services';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';

const ProductListPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'inventory']);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    category: 'Power Tools',
    price: '',
    costPrice: '',
    stock: '',
    reorderLevel: '10',
    unit: 'pcs',
    description: '',
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await productService.getAll({
        page,
        limit: 10,
        search: searchTerm,
        category: selectedCategory,
      });
      if (res.data) {
        setProducts(res.data.data || []);
        setPagination({
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      title: '',
      sku: '',
      category: 'Power Tools',
      price: '',
      costPrice: '',
      stock: '',
      reorderLevel: '10',
      unit: 'pcs',
      description: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      sku: product.sku,
      category: product.category || 'General',
      price: product.price,
      costPrice: product.costPrice || '',
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      unit: product.unit || 'pcs',
      description: product.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await productService.create(formData);
        toast.success('Product created successfully');
      } else {
        await productService.update(selectedProduct._id, formData);
        toast.success('Product updated successfully');
      }
      setShowModal(false);
      fetchProducts(pagination.currentPage);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save product';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await productService.delete(deletingId);
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      fetchProducts(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Product Name',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark d-block">{row.title}</span>
          <span className="text-muted small">{row.description ? `${row.description.slice(0, 45)}...` : row.unit}</span>
        </div>
      ),
    },
    {
      header: 'SKU',
      accessor: 'sku',
      render: (row) => <code className="fw-semibold text-primary">{row.sku}</code>,
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => <span className="badge badge-soft-secondary">{row.category}</span>,
    },
    {
      header: 'Selling Price',
      accessor: 'price',
      render: (row) => <span className="fw-semibold text-dark">${Number(row.price).toFixed(2)}</span>,
    },
    {
      header: 'Stock Level',
      accessor: 'stock',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <span className={`fw-bold ${row.stock <= row.reorderLevel ? 'text-danger' : 'text-dark'}`}>
            {row.stock} {row.unit}
          </span>
          {row.stock <= row.reorderLevel && (
            <span className="badge badge-soft-danger" title="Low Stock Warning" style={{ fontSize: '0.68rem' }}>
              Low
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Reorder Point',
      accessor: 'reorderLevel',
      render: (row) => <span className="text-muted">{row.reorderLevel}</span>,
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
              title="Edit Product"
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
              title="Delete Product"
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
          <h4 className="fw-bold text-dark mb-1">Product Inventory</h4>
          <p className="text-muted small mb-0">Manage catalog, track SKU stock levels, and configure reorder alerts.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search product by title, SKU, or category..."
        filterComponent={
          <Form.Select
            size="sm"
            style={{ width: '170px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Power Tools">Power Tools</option>
            <option value="Measurement">Measurement</option>
            <option value="Safety Equipment">Safety Equipment</option>
            <option value="Machinery">Machinery</option>
            <option value="Storage & Workstations">Storage & Workstations</option>
          </Form.Select>
        }
        actionButton={
          canEdit && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="d-flex align-items-center gap-1.5">
              <Plus size={16} />
              <span>Add Product</span>
            </Button>
          )
        }
        pagination={pagination}
        onPageChange={(p) => fetchProducts(p)}
      />

      {/* Add / Edit Product Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={8}>
                <Form.Group controlId="prodTitle">
                  <Form.Label className="small fw-semibold text-secondary">Product Title</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Industrial Cordless Drill 18V"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="prodSku">
                  <Form.Label className="small fw-semibold text-secondary">SKU Code</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. DRL-001"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="prodCategory">
                  <Form.Label className="small fw-semibold text-secondary">Category</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Power Tools">Power Tools</option>
                    <option value="Measurement">Measurement</option>
                    <option value="Safety Equipment">Safety Equipment</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Storage & Workstations">Storage & Workstations</option>
                    <option value="Hardware">Hardware</option>
                    <option value="General">General</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="prodUnit">
                  <Form.Label className="small fw-semibold text-secondary">Measurement Unit</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, sets, kg, boxes"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="prodPrice">
                  <Form.Label className="small fw-semibold text-secondary">Selling Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="prodCostPrice">
                  <Form.Label className="small fw-semibold text-secondary">Cost Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="prodStock">
                  <Form.Label className="small fw-semibold text-secondary">Current Stock Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="prodReorder">
                  <Form.Label className="small fw-semibold text-secondary">Reorder Alert Threshold</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    placeholder="10"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="prodDesc">
                  <Form.Label className="small fw-semibold text-secondary">Description / Specs</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product specifications and details..."
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
              {modalMode === 'create' ? 'Save Product' : 'Update Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
};

export default ProductListPage;

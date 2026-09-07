import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Badge, Row, Col } from 'react-bootstrap';
import { grnService } from '../../api/services';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';
import { Eye, FileCheck, CheckCircle, Package } from 'lucide-react';

const GRNListPage = () => {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingGRN, setViewingGRN] = useState(null);

  const fetchGRNs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await grnService.getAll({ page, limit: 10, search: searchTerm });
      if (res.data) {
        setGrns(res.data.data || []);
        setPagination({
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load Goods Receipt Notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGRNs(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const columns = [
    {
      header: 'GRN Number',
      accessor: 'grnNumber',
      render: (row) => <span className="fw-bold text-primary">{row.grnNumber}</span>,
    },
    {
      header: 'Purchase Order',
      accessor: 'purchaseOrder',
      render: (row) => <code className="fw-semibold text-secondary">{row.purchaseOrder?.poNumber || 'PO'}</code>,
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
      header: 'Items Count',
      accessor: 'receivedItems',
      render: (row) => <span className="text-secondary small">{row.receivedItems?.length || 0} product(s)</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Stock Updated',
      accessor: 'stockUpdated',
      render: (row) =>
        row.stockUpdated ? (
          <span className="badge badge-soft-success d-inline-flex align-items-center gap-1">
            <CheckCircle size={12} /> Yes
          </span>
        ) : (
          <span className="badge badge-soft-secondary">No</span>
        ),
    },
    {
      header: 'Receipt Date',
      accessor: 'receivedDate',
      render: (row) => <span className="text-muted small">{new Date(row.receivedDate || row.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="d-flex justify-content-end">
          <Button
            variant="light"
            size="sm"
            className="p-1.5 text-secondary border"
            onClick={() => {
              setViewingGRN(row);
              setShowViewModal(true);
            }}
            title="Inspect Note"
          >
            <Eye size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Goods Receipt Notes (GRN)</h4>
          <p className="text-muted small mb-0">Audit goods delivery logs, inspection reports, and warehouse stock updates.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={grns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search GRN number..."
        pagination={pagination}
        onPageChange={(p) => fetchGRNs(p)}
      />

      {/* View GRN Details Modal */}
      {viewingGRN && (
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
              <span>GRN Record: {viewingGRN.grnNumber}</span>
              <StatusBadge status={viewingGRN.status} />
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="mb-3">
              <Col md={6}>
                <h6 className="fw-bold small text-uppercase text-secondary mb-1">Supplier / Vendor</h6>
                <p className="mb-0 fw-semibold text-dark">{viewingGRN.supplier?.name}</p>
                <p className="mb-0 text-muted small">{viewingGRN.supplier?.company}</p>
              </Col>
              <Col md={6} className="text-md-end">
                <h6 className="fw-bold small text-uppercase text-secondary mb-1">Receipt Information</h6>
                <p className="mb-0 text-muted small">PO Link: <strong>{viewingGRN.purchaseOrder?.poNumber}</strong></p>
                <p className="mb-0 text-muted small">Received Date: {new Date(viewingGRN.receivedDate).toLocaleString()}</p>
                <p className="mb-0 text-muted small">Inspector: {viewingGRN.receivedBy?.name || 'Warehouse Staff'}</p>
              </Col>
            </Row>

            <Table responsive className="erp-table mb-3">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>Accepted</th>
                  <th>Batch Number</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {viewingGRN.receivedItems?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="fw-medium text-dark">{it.title}</td>
                    <td className="text-muted small">{it.sku}</td>
                    <td>{it.orderedQuantity}</td>
                    <td>{it.receivedQuantity}</td>
                    <td className="fw-bold text-success">{it.acceptedQuantity}</td>
                    <td><code className="small">{it.batchNumber || 'N/A'}</code></td>
                    <td className="text-muted small">{it.remarks || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {viewingGRN.notes && (
              <div className="p-3 bg-light rounded-3 border">
                <span className="fw-bold small text-dark d-block mb-1">Receipt Remarks & Quality Notes:</span>
                <p className="mb-0 text-muted small">{viewingGRN.notes}</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default GRNListPage;

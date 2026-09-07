import React from 'react';
import { Table, Pagination, Form, InputGroup, Button } from 'react-bootstrap';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const DataTable = ({
  columns,
  data = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterComponent,
  actionButton,
  pagination = { currentPage: 1, totalPages: 1, total: 0 },
  onPageChange,
  emptyMessage = 'No records found',
}) => {
  const { currentPage, totalPages, total } = pagination;

  return (
    <div className="erp-card">
      {/* Header Toolbar */}
      <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center flex-grow-1 gap-2" style={{ maxWidth: '450px' }}>
          {onSearchChange && (
            <InputGroup size="sm">
              <InputGroup.Text className="bg-white border-end-0 text-muted">
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="border-start-0 ps-0"
              />
            </InputGroup>
          )}
          {filterComponent}
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>

      {/* Table Content */}
      <div className="table-responsive">
        <table className="erp-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  <LoadingSpinner message="Fetching data..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-5 text-muted">
                  <Inbox size={42} className="text-secondary opacity-50 mb-2" />
                  <p className="mb-0 fw-medium">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row._id || row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      {!loading && total > 0 && onPageChange && (
        <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="text-muted small">
            Showing <strong className="text-dark">{data.length}</strong> of <strong className="text-dark">{total}</strong> items
          </span>
          {totalPages > 1 && (
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronLeft size={14} />
              </Pagination.Prev>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Only show around current page if many pages
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                ) {
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                }
                if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                  return <Pagination.Ellipsis key={pageNum} disabled />;
                }
                return null;
              })}
              <Pagination.Next
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                <ChevronRight size={14} />
              </Pagination.Next>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;

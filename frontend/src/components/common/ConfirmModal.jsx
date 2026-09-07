import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Body className="p-4 text-center">
        <div
          className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: '54px',
            height: '54px',
            backgroundColor: variant === 'danger' ? '#fee2e2' : '#fef3c7',
            color: variant === 'danger' ? '#ef4444' : '#f59e0b',
          }}
        >
          <AlertTriangle size={28} />
        </div>
        <h5 className="fw-bold text-dark mb-2">{title}</h5>
        <p className="text-muted small mb-4">{message}</p>
        <div className="d-flex justify-content-center gap-2">
          <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmModal;

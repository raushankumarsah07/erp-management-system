import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ message = 'Loading records...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
      <Spinner animation="border" variant="primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <span className="mt-3 fw-medium text-secondary" style={{ fontSize: '0.9rem' }}>
        {message}
      </span>
    </div>
  );
};

export default LoadingSpinner;

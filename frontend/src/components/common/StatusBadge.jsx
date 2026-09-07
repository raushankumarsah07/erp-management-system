import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let badgeClass = 'badge-soft-secondary';
  let label = status.replace(/_/g, ' ');

  switch (normalized) {
    case 'active':
    case 'paid':
    case 'delivered':
    case 'received':
    case 'accepted':
    case 'in_stock':
      badgeClass = 'badge-soft-success';
      break;

    case 'pending':
    case 'ordered':
    case 'partially_received':
    case 'partially_paid':
    case 'partially_accepted':
    case 'low_stock':
      badgeClass = 'badge-soft-warning';
      break;

    case 'cancelled':
    case 'rejected':
    case 'overdue':
    case 'out_of_stock':
    case 'inactive':
      badgeClass = 'badge-soft-danger';
      break;

    case 'approved':
    case 'shipped':
    case 'unpaid':
      badgeClass = 'badge-soft-primary';
      break;

    case 'draft':
    case 'pending_inspection':
      badgeClass = 'badge-soft-info';
      break;

    default:
      badgeClass = 'badge-soft-secondary';
  }

  return (
    <span className={`badge ${badgeClass} text-capitalize`}>
      {label}
    </span>
  );
};

export default StatusBadge;

/**
 * Enterprise clinical and financial formatting utilities
 * Uses the new professional healthcare color palette & status system
 */

export const formatCurrency = (amount, includeDecimals = true) => {
  const num = Number(amount || 0);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
      return 'badge-status-confirmed border px-2 py-1 rounded-pill small';

    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return 'badge-status-inprogress border px-2 py-1 rounded-pill small';

    case 'AVAILABLE':
    case 'ACTIVE':
    case 'SUCCESS':
    case 'PAID':
    case 'COMPLETED':
    case 'DISPENSED':
      return 'badge-status-success border px-2 py-1 rounded-pill small';

    case 'PENDING':
    case 'PARTIALLY_PAID':
    case 'SAMPLE_COLLECTED':
      return 'badge-status-pending border px-2 py-1 rounded-pill small';

    case 'MAINTENANCE':
    case 'UNDER_MAINTENANCE':
    case 'CLEANING':
      return 'badge-status-maintenance border px-2 py-1 rounded-pill small';

    case 'OCCUPIED':
      return 'badge-status-occupied border px-2 py-1 rounded-pill small';

    case 'CANCELLED':
    case 'DISCHARGED':
    case 'OUT_OF_STOCK':
    case 'UNPAID':
      return 'badge-status-cancelled border px-2 py-1 rounded-pill small';

    default:
      return 'badge bg-light text-dark border px-2 py-1 rounded-pill small';
  }
};

export const getPriorityBadgeClass = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'STAT':
    case 'CRITICAL':
    case 'EMERGENCY':
      return 'bg-danger text-white fw-bold px-2 py-1 rounded-pill small';
    case 'URGENT':
      return 'bg-warning text-dark fw-semibold px-2 py-1 rounded-pill small';
    case 'ROUTINE':
    default:
      return 'bg-light text-muted border px-2 py-1 rounded-pill small';
  }
};

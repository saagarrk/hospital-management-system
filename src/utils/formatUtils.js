/**
 * Enterprise clinical and financial formatting utilities
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
    case 'ACTIVE':
    case 'AVAILABLE':
    case 'PAID':
    case 'COMPLETED':
    case 'DISPENSED':
      return 'bg-success-subtle text-success border border-success-subtle';

    case 'PENDING':
    case 'IN_PROGRESS':
    case 'PARTIALLY_PAID':
    case 'SAMPLE_COLLECTED':
      return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';

    case 'CANCELLED':
    case 'DISCHARGED':
    case 'OCCUPIED':
    case 'OUT_OF_STOCK':
    case 'UNPAID':
      return 'bg-danger-subtle text-danger border border-danger-subtle';

    case 'UNDER_MAINTENANCE':
    case 'CLEANING':
      return 'bg-secondary-subtle text-secondary border border-secondary-subtle';

    default:
      return 'bg-light text-dark border';
  }
};

export const getPriorityBadgeClass = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'STAT':
    case 'CRITICAL':
    case 'EMERGENCY':
      return 'bg-danger text-white font-bold animate-pulse';
    case 'URGENT':
      return 'bg-warning text-dark font-semibold';
    case 'ROUTINE':
    default:
      return 'bg-light text-muted border';
  }
};

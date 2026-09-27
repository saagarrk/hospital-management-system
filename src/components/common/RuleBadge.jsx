import React from 'react';

export const RuleBadge = ({ ruleNumber, title, status = 'enforced' }) => {
  return (
    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 shadow-sm font-monospace text-xs">
      <span className="badge rounded-pill bg-primary text-white" style={{ fontSize: '0.7rem' }}>
        Rule {ruleNumber}
      </span>
      <span>{title}</span>
    </span>
  );
};

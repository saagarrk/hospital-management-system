import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => {
  return (
    <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-muted small fw-semibold text-uppercase tracking-wider">{title}</span>
          <div className={`p-2 rounded-2 bg-${color}-subtle text-${color}`}>
            <Icon size={18} />
          </div>
        </div>
        <div className="fs-3 fw-bold text-dark mb-1">{value}</div>
        {subtitle && <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{subtitle}</div>}
      </div>
    </div>
  );
};

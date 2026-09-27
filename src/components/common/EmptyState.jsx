import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data matching your query.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-5 px-3 bg-white rounded-3 border border-slate-200 ${className}`}>
      <div className="d-inline-flex p-3 rounded-circle bg-slate-100 text-slate-400 mb-3">
        <Icon size={32} />
      </div>
      <h6 className="fw-bold text-dark mb-1">{title}</h6>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '360px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn btn-sm btn-primary shadow-sm px-3">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

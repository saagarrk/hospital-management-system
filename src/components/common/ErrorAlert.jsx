import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorAlert = ({
  title = 'An error occurred',
  message = 'Failed to load content from the server.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`alert alert-danger d-flex align-items-start gap-3 p-3 rounded-3 shadow-sm border-danger-subtle ${className}`}>
      <AlertCircle size={22} className="text-danger flex-shrink-0 mt-0.5" />
      <div className="flex-grow-1">
        <h6 className="alert-heading fw-bold mb-1 text-danger-emphasis">{title}</h6>
        <div className="small text-danger mb-2">{message}</div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 py-1 px-2.5"
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;

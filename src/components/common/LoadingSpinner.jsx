import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading data...', size = 32, className = '' }) => {
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center p-5 text-muted ${className}`}>
      <Loader2 size={size} className="text-primary animate-spin mb-3" />
      <span className="small fw-medium tracking-wide">{message}</span>
    </div>
  );
};

export default LoadingSpinner;

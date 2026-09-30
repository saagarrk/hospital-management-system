import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl',
  }[size] || '';

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)' }}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`modal-dialog modal-dialog-centered ${sizeClass}`}
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 rounded-3 shadow-lg overflow-hidden">
          {/* Modal Header */}
          <div
            className="modal-header text-white p-3.5 d-flex align-items-center justify-content-between"
            style={{ backgroundColor: '#0B5C75', borderBottom: '1px solid #084C61' }}
          >
            <div>
              <h5 className="modal-title fs-6 fw-bold text-white mb-0">{title}</h5>
              {subtitle && <div className="small mt-0.5" style={{ color: '#E6F4F7', opacity: 0.9 }}>{subtitle}</div>}
            </div>
            <button
              type="button"
              className="btn btn-sm border-0 rounded-circle p-1.5 text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} color="#FFFFFF" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 bg-white" style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
            {children}
          </div>

          {/* Modal Footer */}
          {footer && (
            <div className="modal-footer bg-slate-50 border-top border-slate-200 p-3 d-flex align-items-center justify-content-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;

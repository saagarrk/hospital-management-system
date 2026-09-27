import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = '',
}) => {
  if (totalPages <= 1 && totalItems <= pageSize) {
    return (
      <div className={`d-flex align-items-center justify-content-between p-3 border-top border-slate-200 small text-muted ${className}`}>
        <div>
          Showing <span className="fw-semibold text-dark">{totalItems > 0 ? 1 : 0}</span> to{' '}
          <span className="fw-semibold text-dark">{totalItems}</span> of{' '}
          <span className="fw-semibold text-dark">{totalItems}</span> entries
        </div>
      </div>
    );
  }

  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }

    return pages;
  };

  return (
    <div className={`d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 p-3 border-top border-slate-200 small text-muted ${className}`}>
      <div className="d-flex align-items-center gap-3">
        <div>
          Showing <span className="fw-semibold text-dark font-mono">{startEntry}</span> to{' '}
          <span className="fw-semibold text-dark font-mono">{endEntry}</span> of{' '}
          <span className="fw-semibold text-dark font-mono">{totalItems}</span> entries
        </div>
        {onPageSizeChange && (
          <div className="d-flex align-items-center gap-1.5">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="form-select form-select-sm py-0.5 px-2 text-dark font-mono"
              style={{ width: 'auto' }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav aria-label="Pagination Navigation">
        <ul className="pagination pagination-sm mb-0 gap-1">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link rounded-2 border-slate-200 px-2.5 py-1 text-dark"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
          </li>

          {getPageNumbers().map((pageNum) => (
            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
              <button
                type="button"
                className={`page-link rounded-2 border-slate-200 px-3 py-1 font-mono ${
                  currentPage === pageNum ? 'bg-primary text-white border-primary' : 'text-dark'
                }`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link rounded-2 border-slate-200 px-2.5 py-1 text-dark"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;

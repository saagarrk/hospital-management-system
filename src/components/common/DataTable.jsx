import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
  sortField,
  sortDirection = 'asc',
  onSort,
  pagination,
  rowKey = (row, index) => row.id || index,
  onRowClick,
  className = '',
}) => {
  return (
    <div className={`card border border-slate-200 bg-white rounded-3 shadow-sm overflow-hidden ${className}`}>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light border-bottom border-slate-200 small text-uppercase text-muted">
            <tr>
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`py-3 px-3 fw-semibold ${col.align === 'end' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start'} ${col.className || ''}`}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="btn btn-link text-decoration-none text-muted p-0 d-inline-flex align-items-center gap-1 fw-semibold text-uppercase small"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <span>{col.label}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={13} className="text-primary" />
                          ) : (
                            <ArrowDown size={13} className="text-primary" />
                          )
                        ) : (
                          <ArrowUpDown size={13} className="opacity-50" />
                        )}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem' }}>{col.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="small">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-5">
                  <LoadingSpinner message="Retrieving clinical records..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-4">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey] || index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 ${col.align === 'end' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start'} ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
};

export default DataTable;

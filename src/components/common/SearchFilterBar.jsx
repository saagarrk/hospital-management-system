import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export const SearchFilterBar = ({
  searchTerm = '',
  onSearchChange,
  placeholder = 'Search by name, ID, or keyword...',
  filters = [],
  filterValues = {},
  onFilterChange,
  onResetFilters,
  className = '',
}) => {
  return (
    <div className={`p-3 bg-white border border-slate-200 rounded-3 shadow-sm mb-3 ${className}`}>
      <div className="row g-2 align-items-center">
        {/* Search input with clear button */}
        <div className="col-12 col-md">
          <div className="position-relative">
            <Search
              size={16}
              className="position-absolute text-muted"
              style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="form-control form-control-sm ps-5 pe-5 py-2 border-slate-200 rounded-2"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="btn btn-sm position-absolute border-0 text-muted p-0"
                style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter) => (
          <div key={filter.id} className="col-12 col-sm-6 col-md-auto">
            <select
              value={filterValues[filter.id] || ''}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
              className="form-select form-select-sm py-2 border-slate-200 rounded-2 text-dark"
              style={{ minWidth: '140px' }}
            >
              <option value="">{filter.placeholder || `All ${filter.label}`}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Reset button if filters active */}
        {onResetFilters && (
          <div className="col-auto">
            <button
              type="button"
              onClick={onResetFilters}
              className="btn btn-sm btn-outline-secondary py-2 px-3 d-flex align-items-center gap-1 rounded-2"
              title="Reset all filters"
            >
              <Filter size={14} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;

import React from 'react';

export const FormField = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  disabled = false,
  icon: Icon,
  className = '',
  rows,
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label small fw-semibold text-dark mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="position-relative">
        {Icon && (
          <div
            className="position-absolute text-muted"
            style={{ left: '12px', top: type === 'textarea' ? '12px' : '50%', transform: type === 'textarea' ? 'none' : 'translateY(-50%)' }}
          >
            <Icon size={16} />
          </div>
        )}

        {type === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows || 3}
            className={`form-control form-control-sm rounded-2 border-slate-200 ${Icon ? 'ps-5' : ''} ${
              error ? 'is-invalid border-danger' : ''
            }`}
            {...props}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`form-control form-control-sm rounded-2 border-slate-200 ${Icon ? 'ps-5' : ''} ${
              error ? 'is-invalid border-danger' : ''
            }`}
            {...props}
          />
        )}
      </div>

      {error && <div className="invalid-feedback d-block small mt-1">{error}</div>}
      {!error && helperText && <div className="form-text small text-muted mt-1">{helperText}</div>}
    </div>
  );
};

export default FormField;

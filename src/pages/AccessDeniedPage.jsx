import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home, UserCheck, Lock } from 'lucide-react';

export const AccessDeniedPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center min-vh-75">
      <div className="card border border-danger-subtle bg-white shadow-sm rounded-4 p-4 p-md-5 text-center" style={{ maxWidth: '540px' }}>
        <div className="d-inline-flex p-3 rounded-circle bg-danger-subtle text-danger mb-3 mx-auto shadow-sm">
          <ShieldAlert size={48} />
        </div>
        <h3 className="fw-bold text-slate-900 mb-2">Access Denied (HTTP 403)</h3>
        <p className="text-muted small mb-4">
          You do not possess the required RBAC permissions to access this clinical or administrative route.
        </p>

        <div className="p-3 rounded-3 bg-slate-50 border border-slate-200 text-start small mb-4">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Authenticated User:</span>
            <strong className="text-dark">{currentUser?.fullName || 'Anonymous'}</strong>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Current Role:</span>
            <span className="badge bg-primary">{currentUser?.role || 'NONE'}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted">Security Policy:</span>
            <span className="text-danger font-mono fw-semibold">Spring Security Method / URL Guard</span>
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline-secondary btn-sm px-3 d-flex align-items-center gap-1"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
          <Link to="/" className="btn btn-primary-custom btn-sm px-4 d-flex align-items-center gap-1 shadow-sm">
            <Home size={14} />
            <span>Return to My Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, currentUser, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <AccessDeniedPage />;
  }

  return children;
};

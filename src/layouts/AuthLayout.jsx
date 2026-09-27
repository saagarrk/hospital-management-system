import React from 'react';

/**
 * Clean layout shell for unauthenticated entry flows (Login, Register, Password Recovery)
 */
export const AuthLayout = ({ children }) => {
  return (
    <div className="min-vh-100 bg-slate-50 d-flex flex-column justify-content-between">
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3 p-md-4">
        {children}
      </div>
      <footer className="py-3 text-center text-muted small border-top border-slate-200 bg-white">
        <div>&copy; {new Date().getFullYear()} Shree Jeevan Multispeciality Hospital, Pune, Maharashtra. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default AuthLayout;

import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';

/**
 * Enterprise Application Shell Layout
 * Provides persistent responsive header, collapsible role-tailored sidebar,
 * and clean scrollable content view.
 */
export const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100 bg-slate-50">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="d-flex flex-grow-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main
          className="flex-grow-1 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 58px)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

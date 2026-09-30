import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';

/**
 * Enterprise Application Shell Layout
 * Supports:
 * - Desktop (>= 1200px) & Laptop (992px-1199px): Sidebar open (~260px) or collapsed (~68px) with tooltip icons
 * - Tablet (768px-991px): Collapsible in-flow sidebar
 * - Mobile (< 768px): Closed by default; slides in as an overlay drawer with semi-transparent backdrop
 */
export const MainLayout = ({ children }) => {
  const location = useLocation();

  // Breakpoint helper (< 768px is mobile drawer per Section 4)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Desktop sidebar collapsed state (persisted in localStorage)
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hms_sidebar_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      // On tablet (768px - 991px), default collapsed for spaciousness; on laptop/desktop (>= 992px) default open
      return window.innerWidth >= 768 && window.innerWidth < 992;
    }
    return false;
  });

  // Mobile overlay drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Responsive window resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        // If transitioning to tablet/desktop, always dismiss mobile overlay drawer
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Automatically close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Master sidebar toggle (header hamburger button)
  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('hms_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
  };

  const handleToggleDesktop = () => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('hms_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-slate-50 overflow-x-hidden">
      {/* Sticky Header with integrated toggle & branding */}
      <Navbar
        onToggleSidebar={handleToggleSidebar}
        isMobile={isMobile}
        sidebarCollapsed={!isMobile && desktopCollapsed}
      />

      {/* Main Content Area + Role-tailored Sidebar */}
      <div className="d-flex flex-grow-1 position-relative overflow-hidden">
        <Sidebar
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          desktopCollapsed={desktopCollapsed}
          onCloseMobile={handleCloseMobile}
          onToggleDesktop={handleToggleDesktop}
        />

        <main
          id="main-content"
          className="flex-grow-1 overflow-y-auto overflow-x-hidden px-3 py-3 p-md-4"
          style={{
            maxHeight: 'calc(100vh - 58px)',
            minWidth: 0, // Critical flexbox rule to prevent wide tables/cards from breaking page width
            transition: 'all 0.25s ease',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

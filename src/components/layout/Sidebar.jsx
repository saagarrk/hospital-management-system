import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  Pill,
  Package,
  BedDouble,
  CreditCard,
  Server,
  FlaskConical,
  User,
  ShieldCheck,
  LogOut,
  HeartPulse,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
} from 'lucide-react';

export const Sidebar = ({
  isMobile = false,
  mobileOpen = false,
  desktopCollapsed = false,
  onCloseMobile,
  onToggleDesktop,
}) => {
  const { currentUser, confirmLogout } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role || 'PATIENT';

  // Role-specific navigation specifications based on Section 9
  const getNavItemsForRole = (currentRole) => {
    switch (currentRole) {
      case 'ADMIN':
        return [
          { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { to: '/doctors', label: 'Doctors', icon: Stethoscope },
          { to: '/patients', label: 'Patients', icon: Users },
          { to: '/appointments', label: 'Appointments', icon: Calendar },
          { to: '/inpatient', label: 'Admissions & Beds', icon: BedDouble },
          { to: '/records', label: 'Medical Records', icon: FileText },
          { to: '/prescriptions', label: 'Prescriptions', icon: Pill },
          { to: '/pharmacy', label: 'Pharmacy & Stock', icon: Package },
          { to: '/laboratory', label: 'Laboratory', icon: FlaskConical },
          { to: '/billing', label: 'Billing & Clearance', icon: CreditCard },
          { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
          { to: '/backend-hub', label: 'Spring Boot Hub', icon: Server, highlight: true },
          { to: '/profile', label: 'Profile', icon: User },
        ];

      case 'DOCTOR':
        return [
          { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { to: '/appointments', label: 'My Appointments', icon: Calendar },
          { to: '/patients', label: 'My Patients', icon: Users },
          { to: '/records', label: 'Medical Records', icon: FileText },
          { to: '/prescriptions', label: 'Prescriptions', icon: Pill },
          { to: '/laboratory', label: 'Laboratory Reports', icon: FlaskConical },
          { to: '/profile', label: 'Profile', icon: User },
        ];

      case 'RECEPTIONIST':
        return [
          { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { to: '/patients', label: 'Patients', icon: Users },
          { to: '/appointments', label: 'Appointments', icon: Calendar },
          { to: '/inpatient', label: 'Admissions', icon: BedDouble },
          { to: '/inpatient', label: 'Rooms & Beds', icon: Layers },
          { to: '/billing', label: 'Billing & Cashier', icon: CreditCard },
          { to: '/profile', label: 'Profile', icon: User },
        ];

      case 'NURSE':
        return [
          { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { to: '/patients', label: 'Assigned Patients', icon: Users },
          { to: '/records', label: 'Vitals & Observation', icon: Activity },
          { to: '/inpatient', label: 'Admissions', icon: BedDouble },
          { to: '/prescriptions', label: 'Patient Care & Meds', icon: Pill },
          { to: '/profile', label: 'Profile', icon: User },
        ];

      case 'PHARMACIST':
        return [
          { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { to: '/pharmacy', label: 'Medicines Catalog', icon: Package },
          { to: '/pharmacy', label: 'Inventory & Stock', icon: Layers },
          { to: '/prescriptions', label: 'Prescriptions Queue', icon: Pill },
          { to: '/profile', label: 'Profile', icon: User },
        ];

      case 'LAB_TECHNICIAN':
        return [
          { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { to: '/laboratory', label: 'Lab Requests', icon: FlaskConical },
          { to: '/laboratory', label: 'Sample Processing', icon: Activity },
          { to: '/laboratory', label: 'Lab Reports', icon: FileText },
          { to: '/profile', label: 'Profile', icon: User },
        ];

      case 'PATIENT':
      default:
        return [
          { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { to: '/appointments', label: 'My Appointments', icon: Calendar },
          { to: '/records', label: 'My Medical Records', icon: FileText },
          { to: '/prescriptions', label: 'My Prescriptions', icon: Pill },
          { to: '/laboratory', label: 'My Lab Reports', icon: FlaskConical },
          { to: '/billing', label: 'My Bills & Payments', icon: CreditCard },
          { to: '/profile', label: 'Profile', icon: User },
        ];
    }
  };

  const navItems = getNavItemsForRole(role);

  // Centralized SweetAlert2 Logout Confirmation
  const handleLogout = async () => {
    if (onCloseMobile) onCloseMobile();
    await confirmLogout(() => navigate('/login', { replace: true }), onCloseMobile);
  };

  const getRoleBadgeColor = (r) => {
    switch (r) {
      case 'ADMIN': return 'bg-danger text-white';
      case 'DOCTOR': return 'bg-primary text-white';
      case 'RECEPTIONIST': return 'bg-info text-dark';
      case 'NURSE': return 'bg-success text-white';
      case 'PHARMACIST': return 'bg-warning text-dark';
      case 'LAB_TECHNICIAN': return 'bg-secondary text-white';
      case 'PATIENT': return 'bg-dark text-white';
      default: return 'bg-light text-dark';
    }
  };

  // =========================================================================
  // 1. MOBILE DRAWER MODE (< 768px)
  // =========================================================================
  if (isMobile) {
    return (
      <>
        {/* Semi-transparent Backdrop Overlay */}
        {mobileOpen && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50"
            style={{ zIndex: 1040, backdropFilter: 'blur(2px)' }}
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        )}

        {/* Mobile Slide-in Drawer */}
        <aside
          className="bg-white d-flex flex-column h-100 shadow-lg"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            maxWidth: '85vw',
            zIndex: 1050,
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
          }}
          aria-label="Mobile navigation drawer"
        >
          {/* Mobile Drawer Header */}
          <div className="p-3 border-bottom border-slate-200 d-flex align-items-center justify-content-between bg-slate-50">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary text-white p-1.5 rounded-2 d-flex align-items-center justify-content-center shadow-sm">
                <HeartPulse size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="fw-bold text-slate-900 small leading-tight">Shree Jeevan</div>
                <div className="text-muted" style={{ fontSize: '0.68rem' }}>Multispeciality Hospital</div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary p-1 border-0 rounded-circle text-slate-600 hover:bg-slate-200"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Banner in Drawer */}
          <div className="p-3 border-bottom border-slate-200 bg-white">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                style={{ width: 38, height: 38, fontSize: '0.9rem', fontWeight: 600 }}
              >
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-slate-900 small text-truncate">{currentUser?.fullName}</div>
                <div className="d-flex align-items-center gap-1 mt-0.5">
                  <span className={`badge ${getRoleBadgeColor(role)} py-0 px-1.5`} style={{ fontSize: '0.62rem' }}>
                    {role}
                  </span>
                  {currentUser?.patientCode && (
                    <span className="text-muted font-mono" style={{ fontSize: '0.65rem' }}>
                      ({currentUser.patientCode})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Category Label */}
          <div className="text-muted text-uppercase fw-bold px-3 pt-3 pb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
            {role} Modules ({navItems.length})
          </div>

          {/* Navigation List */}
          <div className="nav flex-column gap-1 px-2 flex-grow-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={`${item.to}-${index}`}
                  to={item.to}
                  end={item.exact}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `d-flex align-items-center gap-2.5 px-3 py-2 rounded-2 text-decoration-none sidebar-nav-item ${
                      isActive ? 'active' : ''
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={2} className="flex-shrink-0" />
                  <span className="small">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Bottom Actions: Logout Button */}
          <div className="p-3 border-top border-slate-200 mt-auto bg-slate-50">
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-2 py-2 shadow-sm fw-semibold"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
            <div className="text-center text-muted mt-2" style={{ fontSize: '0.68rem' }}>
              Pune, Maharashtra · Trusted Healthcare
            </div>
          </div>
        </aside>
      </>
    );
  }

  // =========================================================================
  // 2. DESKTOP / TABLET MODE (>= 768px): COLLAPSIBLE IN-FLOW SIDEBAR
  // =========================================================================
  return (
    <aside
      className="bg-white border-end border-slate-200 d-flex flex-column h-100 shadow-sm"
      style={{
        width: desktopCollapsed ? '70px' : '260px',
        minWidth: desktopCollapsed ? '70px' : '260px',
        minHeight: 'calc(100vh - 58px)',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
      aria-label="Sidebar navigation"
    >
      {/* Top Banner / User identity + Collapse toggle */}
      <div className="p-2 p-md-3 border-bottom border-slate-200 bg-white">
        {!desktopCollapsed ? (
          <div className="card bg-slate-50 border border-slate-200 p-2 rounded-3 shadow-none">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                  style={{ width: 34, height: 34, fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <div className="fw-bold text-slate-900 small text-truncate" style={{ maxWidth: '130px' }}>
                    {currentUser?.fullName}
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-0.5">
                    <span className={`badge ${getRoleBadgeColor(role)} py-0 px-1`} style={{ fontSize: '0.6rem' }}>
                      {role}
                    </span>
                    {currentUser?.patientCode && (
                      <span className="text-muted font-mono" style={{ fontSize: '0.62rem' }}>
                        {currentUser.patientCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {onToggleDesktop && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-xs p-1 border-0 text-slate-500 hover:text-slate-800"
                  onClick={onToggleDesktop}
                  title="Collapse sidebar (icons only)"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column align-items-center py-1">
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: 36, height: 36, fontSize: '0.88rem', fontWeight: 600 }}
              title={`${currentUser?.fullName || 'User'} (${role})`}
            >
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            {onToggleDesktop && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-xs p-1 mt-2 border-slate-200 text-slate-600 w-100 d-flex justify-content-center shadow-sm"
                onClick={onToggleDesktop}
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category header when open */}
      {!desktopCollapsed && (
        <div className="text-muted text-uppercase fw-bold px-3 pt-3 pb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
          {role} Modules ({navItems.length})
        </div>
      )}

      {/* Navigation Links */}
      <div className={`nav flex-column gap-1 flex-grow-1 ${desktopCollapsed ? 'px-2 py-2' : 'px-2 py-2'}`}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={`${item.to}-${index}`}
              to={item.to}
              end={item.exact}
              title={desktopCollapsed ? item.label : undefined}
              aria-label={item.label}
              className={({ isActive }) =>
                `d-flex align-items-center rounded-2 text-decoration-none sidebar-nav-item ${
                  desktopCollapsed
                    ? 'justify-content-center px-0 py-2.5 my-0.5'
                    : 'justify-content-between px-3 py-2'
                } ${isActive ? 'active' : ''}`
              }
            >
              <div className={`d-flex align-items-center gap-2.5 small ${desktopCollapsed ? 'justify-content-center' : ''}`}>
                <Icon size={desktopCollapsed ? 19 : 16} strokeWidth={2} className="flex-shrink-0" />
                {!desktopCollapsed && <span className="text-truncate">{item.label}</span>}
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Actions: Sign Out Button + Branding */}
      <div className={`border-top border-slate-200 mt-auto bg-white ${desktopCollapsed ? 'p-2' : 'p-3'}`}>
        <button
          type="button"
          onClick={handleLogout}
          title={desktopCollapsed ? "Sign Out" : undefined}
          aria-label="Sign Out"
          className={`btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center rounded-2 transition-all ${
            desktopCollapsed ? 'w-100 p-2' : 'w-100 gap-2 py-1.5 fw-semibold'
          }`}
        >
          <LogOut size={desktopCollapsed ? 18 : 15} />
          {!desktopCollapsed && <span className="small">Sign Out</span>}
        </button>

        {!desktopCollapsed && (
          <div className="p-2 mt-2 rounded-2 bg-slate-50 border border-slate-200 text-muted d-flex align-items-center gap-2">
            <HeartPulse size={15} className="text-primary flex-shrink-0" />
            <div style={{ fontSize: '0.68rem', lineHeight: '1.2' }}>
              <div className="fw-semibold text-slate-800">Shree Jeevan HMS</div>
              <div>Pune, Maharashtra</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

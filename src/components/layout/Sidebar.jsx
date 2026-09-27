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
  Bell,
  HeartPulse,
  ClipboardList,
  AlertTriangle,
  History,
  Activity,
  Layers,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
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

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-lg-none"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`bg-white border-end border-slate-200 d-flex flex-column p-3 h-100 shadow-sm transition-all ${
          isOpen ? 'position-fixed top-0 start-0 h-100 z-3' : 'd-none d-lg-flex'
        }`}
        style={{
          width: '260px',
          minHeight: 'calc(100vh - 58px)',
          zIndex: isOpen ? 1045 : 'auto',
        }}
      >
        {/* User Identity Banner */}
        <div className="card bg-slate-50 border border-slate-200 mb-3 p-2.5 rounded-3">
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
                    {currentUser.patientCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Category Header */}
        <div className="text-muted text-uppercase fw-bold px-2 mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
          {role} Modules ({navItems.length})
        </div>

        {/* Navigation Links */}
        <div className="nav flex-column gap-1 flex-grow-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={`${item.to}-${index}`}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `d-flex align-items-center justify-content-between px-3 py-2 rounded-2 text-decoration-none transition-all ${
                    isActive
                      ? 'bg-primary text-white fw-semibold shadow-sm'
                      : item.highlight
                      ? 'text-teal bg-light hover-bg-light fw-medium'
                      : 'text-slate-600 hover-bg-light'
                  }`
                }
              >
                <div className="d-flex align-items-center gap-2.5 small">
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Actions: Logout Button */}
        <div className="pt-3 border-top border-slate-200 mt-auto d-flex flex-column gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-2 py-1.5"
          >
            <LogOut size={15} />
            <span className="small fw-semibold">Sign Out</span>
          </button>

          <div className="p-2 rounded-2 bg-slate-50 border border-slate-200 text-muted d-flex align-items-center gap-2">
            <HeartPulse size={15} className="text-primary flex-shrink-0" />
            <div style={{ fontSize: '0.68rem', lineHeight: '1.2' }}>
              <div className="fw-semibold text-slate-800">Shree Jeevan HMS</div>
              <div>Pune, Maharashtra</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

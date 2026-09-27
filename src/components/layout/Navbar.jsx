import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HeartPulse,
  Search,
  Bell,
  User,
  LogOut,
  ShieldCheck,
  RefreshCw,
  Menu,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { mockDataService } from '../../services/mockDataService';

export const Navbar = ({ onToggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Appointment Confirmed',
      desc: 'Dr. Priya Deshmukh confirmed consultation with Aarav Sharma (10:30 AM)',
      time: '10m ago',
    },
    {
      id: 2,
      title: 'Diagnostic Lab Alert',
      desc: 'Complete Blood Count (CBC) report ready for patient Rohan Patil',
      time: '25m ago',
    },
    {
      id: 3,
      title: 'Pharmacy Low Stock',
      desc: 'Paracetamol 500mg has reached reorder threshold (18 strips remaining)',
      time: '1h ago',
    },
    {
      id: 4,
      title: 'Payment Received',
      desc: '₹2,500 received via UPI/PhonePe for Bill #INV-2026-0042',
      time: '2h ago',
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    if (q.includes('pt') || q.includes('patient') || q.includes('aarav') || q.includes('rohan')) {
      navigate('/patients');
    } else if (q.includes('bed') || q.includes('room') || q.includes('icu') || q.includes('ward')) {
      navigate('/inpatient');
    } else if (q.includes('doc') || q.includes('cardio') || q.includes('aniket') || q.includes('dr')) {
      navigate('/doctors');
    } else if (q.includes('rx') || q.includes('med') || q.includes('pill') || q.includes('paracetamol')) {
      navigate('/pharmacy');
    } else if (q.includes('lab') || q.includes('test') || q.includes('cbc') || q.includes('sugar')) {
      navigate('/laboratory');
    } else if (q.includes('bill') || q.includes('pay') || q.includes('fee')) {
      navigate('/billing');
    } else {
      navigate('/appointments');
    }
  };

  const handleResetData = () => {
    Swal.fire({
      title: 'Reset Hospital Demo Data?',
      text: 'This will restore all Indian hospital patients, doctors, beds, and OPD records.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0F4C81',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, reset store',
    }).then((result) => {
      if (result.isConfirmed) {
        mockDataService.resetAll();
        Swal.fire({
          icon: 'success',
          title: 'Database Reset',
          text: 'Indian hospital dataset refreshed successfully.',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.reload();
        });
      }
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
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
    <header className="navbar navbar-expand-lg bg-white border-bottom border-slate-200 sticky-top px-3 py-2 shadow-sm z-3">
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        {/* Left: Mobile Toggle & Indian Hospital Branding */}
        <div className="d-flex align-items-center gap-2">
          {onToggleSidebar && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-lg-none p-1 border-slate-200"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar navigation"
            >
              <Menu size={20} />
            </button>
          )}

          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold text-slate-900 m-0 text-decoration-none">
            <div className="bg-primary p-2 rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm">
              <HeartPulse size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-1.5 leading-none">
                <span className="text-primary fw-extrabold tracking-tight">Shree Jeevan</span>{' '}
                <span className="fw-semibold text-slate-800">Hospital</span>
              </div>
              <div className="d-none d-md-flex align-items-center gap-1 text-muted mt-0.5" style={{ fontSize: '0.68rem' }}>
                <MapPin size={10} className="text-primary" />
                <span>Pune, Maharashtra · Compassionate Care</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="d-none d-md-flex align-items-center mx-3 flex-grow-1" style={{ maxWidth: '420px' }}>
          <form onSubmit={handleSearch} className="w-100 position-relative">
            <input
              type="text"
              className="form-control form-control-sm bg-slate-50 border-slate-200 ps-5 rounded-pill text-slate-800"
              placeholder="Search patients, OPD doctors, beds, tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={15}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted pointer-events-none"
            />
          </form>
        </div>

        {/* Right Section: Notifications, Reset DB, User Info (NO ROLE SWITCHER) */}
        <div className="d-flex align-items-center gap-2">
          {/* Reset Demo Data button */}
          <button
            onClick={handleResetData}
            title="Reset Indian hospital seed data"
            className="btn btn-outline-secondary btn-sm border-slate-200 text-slate-600 d-none d-sm-flex align-items-center gap-1 px-2.5 py-1 rounded-2"
          >
            <RefreshCw size={13} />
            <span className="small" style={{ fontSize: '0.75rem' }}>Reset DB</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="position-relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-outline-secondary btn-sm border-slate-200 text-slate-600 p-2 rounded-circle position-relative"
              aria-label="View notifications"
            >
              <Bell size={16} />
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-white rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            </button>

            {showNotifications && (
              <div
                className="card position-absolute end-0 mt-2 shadow-lg border border-slate-200 rounded-3 p-0"
                style={{ width: '340px', zIndex: 1050 }}
              >
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold text-slate-900 small">Hospital Notifications</h6>
                  <span className="badge bg-primary-subtle text-primary small">4 New</span>
                </div>
                <div className="list-group list-group-flush small" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div key={n.id} className="list-group-item list-group-item-action p-2.5">
                      <div className="d-flex justify-content-between fw-semibold text-slate-800">
                        <span>{n.title}</span>
                        <span className="text-muted font-mono" style={{ fontSize: '0.65rem' }}>{n.time}</span>
                      </div>
                      <div className="text-muted mt-0.5" style={{ fontSize: '0.74rem' }}>{n.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="card-footer bg-slate-50 text-center p-2 border-top border-slate-200">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="btn btn-link btn-xs text-muted text-decoration-none small"
                  >
                    Close Alerts
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Authenticated Role Tag (Display Only - No Switching) */}
          <div className="d-none d-md-flex align-items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-pill">
            <span className={`badge ${getRoleBadgeColor(currentUser?.role)} py-0 px-1.5 rounded-pill`} style={{ fontSize: '0.65rem' }}>
              {currentUser?.role}
            </span>
            <span className="small text-slate-700 fw-medium text-truncate" style={{ maxWidth: '130px' }}>
              {currentUser?.fullName?.split(' ')[0]}
            </span>
          </div>

          {/* User Avatar & Menu */}
          <div className="dropdown">
            <button
              className="btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2"
              type="button"
              id="userAccountDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: 34, height: 34, fontSize: '0.85rem', fontWeight: 600 }}
              >
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-slate-200 mt-2 p-2 rounded-3" aria-labelledby="userAccountDropdown" style={{ minWidth: '240px' }}>
              <li className="px-2 py-1.5 mb-2 border-bottom border-slate-100">
                <div className="fw-bold text-slate-900 small text-truncate">{currentUser?.fullName}</div>
                <div className="text-muted small text-truncate font-mono" style={{ fontSize: '0.72rem' }}>
                  {currentUser?.email}
                </div>
                <div className="mt-1 d-flex align-items-center gap-1">
                  <span className={`badge ${getRoleBadgeColor(currentUser?.role)} py-0 px-1.5`} style={{ fontSize: '0.65rem' }}>
                    {currentUser?.role}
                  </span>
                  {currentUser?.patientCode && (
                    <span className="text-muted small font-mono" style={{ fontSize: '0.68rem' }}>
                      ({currentUser.patientCode})
                    </span>
                  )}
                </div>
              </li>
              <li>
                <Link to="/profile" className="dropdown-item rounded-2 py-1.5 small d-flex align-items-center gap-2 text-slate-700">
                  <User size={15} />
                  <span>My Hospital Profile</span>
                </Link>
              </li>
              <li>
                <Link to="/backend-hub" className="dropdown-item rounded-2 py-1.5 small d-flex align-items-center gap-2 text-slate-700">
                  <ShieldCheck size={15} />
                  <span>Spring Boot Backend Hub</span>
                </Link>
              </li>
              <li><hr className="dropdown-divider my-1" /></li>
              <li>
                <button
                  type="button"
                  onClick={logout}
                  className="dropdown-item rounded-2 py-1.5 small d-flex align-items-center gap-2 text-danger"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

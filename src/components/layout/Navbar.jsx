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

export const Navbar = ({ onToggleSidebar, isMobile = false, sidebarCollapsed = false }) => {
  const { currentUser, confirmLogout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' | 'unread'

  const [notificationsList, setNotificationsList] = useState([
    {
      id: 1,
      title: 'Appointment Confirmed',
      desc: 'Dr. Priya Deshmukh confirmed consultation with Aarav Sharma (10:30 AM)',
      time: '10m ago',
      unread: true,
      link: '/appointments',
    },
    {
      id: 2,
      title: 'New Laboratory Report Available',
      desc: 'Complete Blood Count (CBC) report finalized for patient Rohan Patil',
      time: '25m ago',
      unread: true,
      link: '/laboratory',
    },
    {
      id: 3,
      title: 'Prescription Updated',
      desc: 'Dr. Aniket Kulkarni updated e-prescription with Paracetamol & Amoxicillin',
      time: '45m ago',
      unread: true,
      link: '/prescriptions',
    },
    {
      id: 4,
      title: 'Pharmacy Low Stock',
      desc: 'Paracetamol 500mg has reached reorder threshold (18 strips remaining)',
      time: '1h ago',
      unread: true,
      link: '/pharmacy',
    },
    {
      id: 5,
      title: 'Payment Received',
      desc: '₹2,500 received via UPI/PhonePe for Bill #INV-2026-0042',
      time: '2h ago',
      unread: false,
      link: '/billing',
    },
    {
      id: 6,
      title: 'Bed Allocation Updated',
      desc: 'Patient Rajesh Deshmukh admitted to Ward Bed 102 under Dr. Verma',
      time: '3h ago',
      unread: false,
      link: '/inpatient',
    },
  ]);

  const unreadCount = notificationsList.filter((n) => n.unread).length;

  const handleMarkAsRead = (id, e) => {
    if (e) e.stopPropagation();
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (item) => {
    // Mark as read and navigate
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    setShowNotifications(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const displayedNotifications =
    notificationFilter === 'unread'
      ? notificationsList.filter((n) => n.unread)
      : notificationsList;

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
      confirmButtonColor: '#0B5C75',
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

  const handleSignOut = async () => {
    await confirmLogout(() => navigate('/login', { replace: true }));
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
    <header className="navbar navbar-expand-lg navbar-hospital-header sticky-top px-3 py-2 shadow-sm z-3">
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        {/* Left: Responsive Toggle & Indian Hospital Branding */}
        <div className="d-flex align-items-center gap-2">
          {onToggleSidebar && (
            <button
              type="button"
              className="btn btn-sm p-1.5 border border-white-50 text-white d-flex align-items-center justify-content-center shadow-sm"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
              onClick={onToggleSidebar}
              title={isMobile ? "Toggle navigation menu" : (sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}
              aria-label={isMobile ? "Toggle navigation menu" : (sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}
            >
              <Menu size={18} color="#FFFFFF" />
            </button>
          )}

          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white m-0 text-decoration-none">
            <div className="p-2 rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm" style={{ backgroundColor: '#084C61', border: '1px solid rgba(255,255,255,0.2)' }}>
              <HeartPulse size={22} strokeWidth={2.5} color="#FFFFFF" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-1.5 leading-none">
                <span className="text-white fw-extrabold tracking-tight">Shree Jeevan</span>{' '}
                <span className="fw-semibold text-white">Hospital</span>
              </div>
              <div className="d-none d-md-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.68rem', color: '#E6F4F7' }}>
                <MapPin size={10} color="#E6F4F7" />
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
              className="form-control form-control-sm navbar-dark-search ps-5 rounded-pill"
              placeholder="Search patients, OPD doctors, beds, tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={15}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-white pointer-events-none opacity-75"
            />
          </form>
        </div>

        {/* Right Section: Notifications, Reset DB, User Info (NO ROLE SWITCHER) */}
        <div className="d-flex align-items-center gap-2">
          {/* Reset Demo Data button */}
          <button
            onClick={handleResetData}
            title="Reset Indian hospital seed data"
            className="btn btn-sm text-white d-none d-sm-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.3)' }}
          >
            <RefreshCw size={13} color="#FFFFFF" />
            <span className="small text-white" style={{ fontSize: '0.75rem' }}>Reset DB</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="position-relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-sm text-white p-2 rounded-circle position-relative shadow-sm"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.3)' }}
              aria-label="View notifications"
              title="Hospital notifications and alerts"
            >
              <Bell size={16} color="#FFFFFF" />
              {unreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white font-mono shadow-sm"
                  style={{ fontSize: '0.65rem', padding: '0.2em 0.45em' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="card position-absolute end-0 mt-2 shadow-lg border border-slate-200 rounded-3 p-0"
                style={{ width: '380px', maxWidth: '90vw', zIndex: 1050 }}
              >
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="mb-0 fw-bold text-slate-900 small">Notifications</h6>
                    {unreadCount > 0 && (
                      <span className="badge bg-primary-subtle text-primary small">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="btn btn-link btn-xs text-decoration-none text-primary p-0 small fw-semibold"
                      style={{ fontSize: '0.72rem' }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="d-flex border-bottom border-slate-200 px-3 pt-2 bg-slate-50 gap-2">
                  <button
                    type="button"
                    onClick={() => setNotificationFilter('all')}
                    className={`btn btn-xs pb-2 border-0 rounded-0 small fw-semibold ${
                      notificationFilter === 'all'
                        ? 'text-primary border-bottom border-primary border-2'
                        : 'text-muted'
                    }`}
                    style={{ fontSize: '0.75rem', background: 'transparent' }}
                  >
                    All ({notificationsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationFilter('unread')}
                    className={`btn btn-xs pb-2 border-0 rounded-0 small fw-semibold ${
                      notificationFilter === 'unread'
                        ? 'text-primary border-bottom border-primary border-2'
                        : 'text-muted'
                    }`}
                    style={{ fontSize: '0.75rem', background: 'transparent' }}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="list-group list-group-flush small" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {displayedNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <CheckCircle2 size={24} className="text-success mx-auto mb-2 opacity-75" />
                      <p className="small mb-0">No unread notifications at this time.</p>
                    </div>
                  ) : (
                    displayedNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`list-group-item list-group-item-action p-3 notification-item ${
                          n.unread ? 'unread' : ''
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div className="d-flex align-items-center gap-1.5">
                            {n.unread && (
                              <span
                                className="d-inline-block rounded-circle bg-primary"
                                style={{ width: '6px', height: '6px' }}
                              />
                            )}
                            <span className={`fw-semibold ${n.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </span>
                          </div>
                          <span className="text-muted font-mono" style={{ fontSize: '0.65rem' }}>
                            {n.time}
                          </span>
                        </div>
                        <div className="text-muted small mb-2" style={{ fontSize: '0.74rem', lineHeight: '1.4' }}>
                          {n.desc}
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="text-primary small fw-medium" style={{ fontSize: '0.7rem' }}>
                            View details &rarr;
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="btn btn-link btn-xs text-muted text-decoration-none p-0"
                            style={{ fontSize: '0.68rem' }}
                          >
                            {n.unread ? 'Mark read' : 'Mark unread'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="card-footer bg-slate-50 text-center p-2 border-top border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="btn btn-link btn-xs text-muted text-decoration-none small"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Authenticated Role Tag (Display Only - No Switching) */}
          <div className="d-none d-md-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <span className={`badge ${getRoleBadgeColor(currentUser?.role)} py-0 px-1.5 rounded-pill`} style={{ fontSize: '0.65rem' }}>
              {currentUser?.role}
            </span>
            <span className="small text-white fw-medium text-truncate" style={{ maxWidth: '130px' }}>
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
                className="text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: 34, height: 34, fontSize: '0.85rem', fontWeight: 600, backgroundColor: '#084C61', border: '1.5px solid #FFFFFF' }}
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
                  onClick={handleSignOut}
                  className="dropdown-item rounded-2 py-1.5 small d-flex align-items-center gap-2 text-danger fw-semibold"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

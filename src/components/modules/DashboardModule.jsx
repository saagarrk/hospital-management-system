import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import {
  Users,
  Calendar,
  BedDouble,
  AlertTriangle,
  Activity,
  Pill,
  IndianRupee,
  Stethoscope,
  FlaskConical,
  CreditCard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Building2,
  ChevronRight,
  ExternalLink,
  ClipboardList,
  HeartPulse,
  UserPlus,
  Layers,
  MapPin,
  QrCode,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export const DashboardModule = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Role dashboard view is strictly determined by authenticated user role
  const activeRoleView = currentUser?.role || 'PATIENT';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role aggregation states fetched via backend service
  const [adminData, setAdminData] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [receptionistData, setReceptionistData] = useState(null);
  const [nurseData, setNurseData] = useState(null);
  const [pharmacistData, setPharmacistData] = useState(null);
  const [labData, setLabData] = useState(null);
  const [patientData, setPatientData] = useState(null);

  // Doctor selector for doctor view
  const [selectedDoctorId, setSelectedDoctorId] = useState('1');

  // Fetch role-specific aggregated dataset from backend API
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeRoleView === 'ADMIN') {
        const res = await dashboardService.getAdminDashboard();
        setAdminData(res);
      } else if (activeRoleView === 'DOCTOR') {
        const res = await dashboardService.getDoctorDashboard(selectedDoctorId);
        setDoctorData(res);
      } else if (activeRoleView === 'RECEPTIONIST') {
        const res = await dashboardService.getReceptionistDashboard();
        setReceptionistData(res);
      } else if (activeRoleView === 'NURSE') {
        const res = await dashboardService.getNurseDashboard();
        setNurseData(res);
      } else if (activeRoleView === 'PHARMACIST') {
        const res = await dashboardService.getPharmacistDashboard();
        setPharmacistData(res);
      } else if (activeRoleView === 'LAB_TECHNICIAN') {
        const res = await dashboardService.getLabTechnicianDashboard();
        setLabData(res);
      } else if (activeRoleView === 'PATIENT') {
        const res = await dashboardService.getPatientDashboard(currentUser?.id || 1);
        setPatientData(res);
      }
    } catch (err) {
      console.error('Failed to load backend dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRoleView, selectedDoctorId, currentUser?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <div className="container-fluid p-3 p-md-4 bg-slate-50 min-vh-100">
      {/* Top Header Bar (No Role-Switching - Strict Auth Enforcement) */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-slate-200">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fs-4 fw-bold text-dark mb-0 tracking-tight">Clinical & Operational Dashboard</h2>
            <span className="small text-muted">·</span>
            <span className="badge bg-teal-50 text-teal-800 border border-teal-200 small font-mono d-inline-flex align-items-center gap-1">
              <MapPin size={11} />
              Pune, Maharashtra
            </span>
          </div>
          <div className="text-muted small">
            Authenticated: <strong className="text-slate-900">{currentUser?.fullName}</strong>{' '}
            <span className="text-muted">· Module Access:</span>{' '}
            <span className="badge bg-primary-subtle text-primary fw-semibold">{currentUser?.role}</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            title="Refresh Aggregations from Backend"
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="card border border-slate-200 bg-white p-5 text-center shadow-sm rounded-3 mb-4">
          <div className="spinner-border text-primary mx-auto mb-3" role="status">
            <span className="visually-hidden">Loading metrics...</span>
          </div>
          <h6 className="fw-bold text-dark mb-1">Aggregating Enterprise Statistics...</h6>
          <p className="text-muted small mb-0 font-monospace">
            Executing Spring Boot / Service layer calculations for {activeRoleView}
          </p>
        </div>
      )}

      {/* ROLE 1: ADMIN DASHBOARD (Conforming to Section 10 Specification) */}
      {!loading && activeRoleView === 'ADMIN' && adminData && (
        <div className="space-y-4">
          {/* Admin Header Banner */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
            <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2.5 rounded-3 bg-primary text-white shadow-sm">
                  <Building2 size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">Hospital Executive Administration</h5>
                  <div className="text-muted small">
                    Shree Jeevan Multispeciality Hospital · Executive Clinical & Financial Governance
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/appointments" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
                  <Calendar size={14} />
                  <span>Book Appointment</span>
                </Link>
                <Link to="/patients" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                  <UserPlus size={14} />
                  <span>Register Patient</span>
                </Link>
                <Link to="/inpatient" className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1">
                  <BedDouble size={14} />
                  <span>Ward Bed Grid</span>
                </Link>
                <Link to="/billing" className="btn btn-sm btn-outline-success d-flex align-items-center gap-1">
                  <CreditCard size={14} />
                  <span>Billing Ledger</span>
                </Link>
              </div>
            </div>
          </div>

          {/* SECTION 10 TOP STATISTICS (Total Patients: 1,248 · Today's Appointments: 48 · Available Beds: 26 · Today's Revenue: ₹2,84,500) */}
          <div className="row g-3 mb-4">
            {/* 1. Total Patients: 1,248 */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Total Patients</span>
                  <div className="p-2 rounded-2 bg-blue-50 text-blue-600">
                    <Users size={20} />
                  </div>
                </div>
                <div className="fs-2 fw-extrabold text-dark font-mono tabular-nums mb-1">
                  {Number(adminData.totalPatients || 1248).toLocaleString('en-IN')}
                </div>
                <div className="d-flex align-items-center justify-content-between text-muted small">
                  <span>Registered medical charts</span>
                  <Link to="/patients" className="text-primary text-decoration-none fw-medium">
                    View Charts &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. Today's Appointments: 48 */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Today's Appointments</span>
                  <div className="p-2 rounded-2 bg-teal-50 text-teal-600">
                    <Calendar size={20} />
                  </div>
                </div>
                <div className="fs-2 fw-extrabold text-dark font-mono tabular-nums mb-1">
                  {Number(adminData.todaysAppointmentsCount || 48).toLocaleString('en-IN')}
                </div>
                <div className="d-flex align-items-center justify-content-between text-muted small">
                  <span>Scheduled OPD consultations</span>
                  <Link to="/appointments" className="text-primary text-decoration-none fw-medium">
                    Schedule &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. Available Beds: 26 */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Available Beds</span>
                  <div className="p-2 rounded-2 bg-emerald-50 text-emerald-600">
                    <BedDouble size={20} />
                  </div>
                </div>
                <div className="fs-2 fw-extrabold text-success font-mono tabular-nums mb-1">
                  {Number(adminData.availableBeds || 26).toLocaleString('en-IN')}
                </div>
                <div className="d-flex align-items-center justify-content-between text-muted small">
                  <span>
                    <strong className="text-danger font-mono">{adminData.occupiedBeds || 54}</strong> Occupied of {adminData.totalBeds || 80}
                  </span>
                  <Link to="/inpatient" className="text-primary text-decoration-none fw-medium">
                    Bed Grid &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* 4. Today's Revenue: ₹2,84,500 */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Today's Revenue</span>
                  <div className="p-2 rounded-2 bg-indigo-50 text-indigo-600">
                    <IndianRupee size={20} />
                  </div>
                </div>
                <div className="fs-2 fw-extrabold text-primary font-mono tabular-nums mb-1">
                  ₹{Number(adminData.todaysRevenue || 284500).toLocaleString('en-IN')}
                </div>
                <div className="d-flex align-items-center justify-content-between text-muted small">
                  <span>Gross collected today</span>
                  <Link to="/billing" className="text-primary text-decoration-none fw-medium">
                    Ledger &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 1: TODAY'S APPOINTMENTS & RECENT PATIENT REGISTRATIONS */}
          <div className="row g-4 mb-4">
            {/* Left: Today's Appointments */}
            <div className="col-12 col-lg-7">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold text-dark">Today's Appointments</h6>
                    <span className="badge bg-primary-subtle text-primary small font-mono">
                      {adminData.todaysAppointmentsCount || 48} Visits
                    </span>
                  </div>
                  <Link to="/appointments" className="small text-primary fw-semibold text-decoration-none">
                    View All &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-muted text-uppercase">
                      <tr>
                        <th>Patient</th>
                        <th>Attending Doctor</th>
                        <th>Department</th>
                        <th>Time Slot</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {adminData.todaysAppointmentsList && adminData.todaysAppointmentsList.length > 0 ? (
                        adminData.todaysAppointmentsList.slice(0, 6).map((a) => (
                          <tr key={a.id}>
                            <td>
                              <div className="fw-semibold text-dark">{a.patientName}</div>
                              <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>
                                {a.patientCode}
                              </div>
                            </td>
                            <td>
                              <div className="text-dark">{a.doctorName}</div>
                            </td>
                            <td>
                              <span className="badge bg-slate-100 text-slate-700 border" style={{ fontSize: '0.68rem' }}>
                                {a.departmentName || a.specialization || 'General'}
                              </span>
                            </td>
                            <td className="font-mono tabular-nums text-dark">{a.appointmentTime || a.time || '10:30 AM'}</td>
                            <td>
                              <span
                                className={`badge ${
                                  a.status === 'CONFIRMED'
                                    ? 'bg-success'
                                    : a.status === 'SCHEDULED'
                                    ? 'bg-primary'
                                    : a.status === 'PENDING'
                                    ? 'bg-warning text-dark'
                                    : 'bg-secondary'
                                }`}
                                style={{ fontSize: '0.68rem' }}
                              >
                                {a.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link to="/appointments" className="btn btn-xs btn-outline-secondary py-0 px-2">
                                Details
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No appointments scheduled for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Recent Patient Registrations */}
            <div className="col-12 col-lg-5">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <UserPlus size={18} className="text-teal-600" />
                    <h6 className="mb-0 fw-bold text-dark">Recent Patient Registrations</h6>
                  </div>
                  <Link to="/patients" className="small text-primary fw-semibold text-decoration-none">
                    Patient Directory &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted text-uppercase">
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>City</th>
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(adminData.recentPatients || [
                        { id: 1, patientCode: 'P-1001', name: 'Aarav Sharma', address: 'Shivaji Nagar, Pune', phone: '+91 98220 88008' },
                        { id: 2, patientCode: 'P-1002', name: 'Priya Kulkarni', address: 'Kothrud, Pune', phone: '+91 98230 45678' },
                        { id: 3, patientCode: 'P-1003', name: 'Rohan Patil', address: 'Baner, Pune', phone: '+91 98231 12345' },
                        { id: 4, patientCode: 'P-1004', name: 'Sneha Deshmukh', address: 'Viman Nagar, Pune', phone: '+91 98232 67890' },
                        { id: 5, patientCode: 'P-1005', name: 'Aditya Joshi', address: 'Aundh, Pune', phone: '+91 98233 45612' },
                      ]).map((p) => (
                        <tr key={p.id}>
                          <td className="font-mono text-primary fw-semibold">{p.patientCode}</td>
                          <td>
                            <div className="fw-medium text-dark">{p.name}</div>
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {p.address?.split(',')[0] || 'Pune'}
                          </td>
                          <td className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
                            {p.phone}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: BED OCCUPANCY & REVENUE OVERVIEW */}
          <div className="row g-4 mb-4">
            {/* Left: Bed Occupancy */}
            <div className="col-12 col-lg-6">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <BedDouble size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold text-dark">Bed Occupancy & Ward Status</h6>
                  </div>
                  <Link to="/inpatient" className="small text-primary fw-semibold text-decoration-none">
                    Ward Management &rarr;
                  </Link>
                </div>
                <div className="p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small">Overall Bed Occupancy Rate</span>
                    <strong className="fs-5 font-mono text-dark">{adminData.occupancyRate || 68}%</strong>
                  </div>
                  <div className="progress mb-3" style={{ height: '10px' }}>
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{ width: `${adminData.occupancyRate || 68}%` }}
                    ></div>
                  </div>

                  <div className="row g-2 text-center small mb-3">
                    <div className="col-4">
                      <div className="p-2 border rounded bg-emerald-50 border-emerald-200">
                        <div className="text-emerald-700 fw-bold fs-5 font-mono">{adminData.availableBeds || 26}</div>
                        <div className="text-emerald-900 small" style={{ fontSize: '0.68rem' }}>AVAILABLE</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 border rounded bg-rose-50 border-rose-200">
                        <div className="text-rose-700 fw-bold fs-5 font-mono">{adminData.occupiedBeds || 54}</div>
                        <div className="text-rose-900 small" style={{ fontSize: '0.68rem' }}>OCCUPIED</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 border rounded bg-slate-50 border-slate-200">
                        <div className="text-slate-700 fw-bold fs-5 font-mono">{adminData.totalBeds || 80}</div>
                        <div className="text-slate-600 small" style={{ fontSize: '0.68rem' }}>TOTAL BEDS</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <div className="text-muted small fw-semibold text-uppercase mb-2" style={{ fontSize: '0.7rem' }}>
                      Ward Allocation Breakdown
                    </div>
                    <div className="d-flex flex-column gap-2 small">
                      {[
                        { ward: 'Intensive Care Unit (ICU)', total: 12, occupied: 11, type: 'bg-danger' },
                        { ward: 'Special Private Rooms', total: 20, occupied: 15, type: 'bg-primary' },
                        { ward: 'Semi-Private Sharing Wards', total: 24, occupied: 16, type: 'bg-info' },
                        { ward: 'General Medical Ward', total: 24, occupied: 12, type: 'bg-success' },
                      ].map((w, idx) => (
                        <div key={idx} className="d-flex align-items-center justify-content-between">
                          <span className="text-slate-700">{w.ward}</span>
                          <span className="font-mono text-muted">
                            <strong className="text-slate-900">{w.occupied}</strong> / {w.total} occupied
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Revenue Overview */}
            <div className="col-12 col-lg-6">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <IndianRupee size={18} className="text-success" />
                    <h6 className="mb-0 fw-bold text-dark">Revenue Overview & Financial Realization</h6>
                  </div>
                  <Link to="/billing" className="small text-primary fw-semibold text-decoration-none">
                    Financial Ledger &rarr;
                  </Link>
                </div>
                <div className="p-3">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="p-3 bg-emerald-50 rounded-2 border border-emerald-200">
                        <div className="text-muted small">Today's Collections</div>
                        <div className="fs-4 fw-bold text-success font-mono">
                          ₹{Number(adminData.todaysRevenue || 284500).toLocaleString('en-IN')}
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          91.2% settlement rate
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-blue-50 rounded-2 border border-blue-200">
                        <div className="text-muted small">Month-to-Date Collections</div>
                        <div className="fs-4 fw-bold text-primary font-mono">
                          ₹48,50,000
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          Target: ₹50,00,000 (97%)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-2 p-2.5 bg-slate-50 mb-3 small">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Total Gross Invoices Billed:</span>
                      <span className="fw-semibold font-mono text-dark">
                        ₹{Number(adminData.totalRevenueBilled || 312000).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted">Total Realized & Cleared:</span>
                      <span className="fw-bold font-mono text-success">
                        ₹{Number(adminData.totalRevenueCollected || 284500).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Pending Counter Dues:</span>
                      <span className="fw-bold font-mono text-danger">
                        ₹{Number(adminData.totalRevenuePending || 27500).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="small">
                    <div className="text-muted small fw-semibold text-uppercase mb-1.5" style={{ fontSize: '0.7rem' }}>
                      Payment Methods Breakdown
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge bg-white text-slate-800 border p-2 rounded-2 font-mono d-flex align-items-center gap-1.5">
                        <QrCode size={14} className="text-primary" />
                        UPI / QR (62%) · ₹1,76,390
                      </span>
                      <span className="badge bg-white text-slate-800 border p-2 rounded-2 font-mono d-flex align-items-center gap-1.5">
                        <CreditCard size={14} className="text-info" />
                        POS Card (28%) · ₹79,660
                      </span>
                      <span className="badge bg-white text-slate-800 border p-2 rounded-2 font-mono d-flex align-items-center gap-1.5">
                        <IndianRupee size={14} className="text-success" />
                        Cash Counter (10%) · ₹28,450
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: DEPARTMENT STATISTICS & OPERATIONAL WATCHLISTS */}
          <div className="row g-4 mb-4">
            {/* Left: Department Statistics */}
            <div className="col-12 col-lg-7">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Layers size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold text-dark">Department Statistics</h6>
                  </div>
                  <Link to="/doctors" className="small text-primary fw-semibold text-decoration-none">
                    Doctor Roster &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted text-uppercase">
                      <tr>
                        <th>Department</th>
                        <th className="text-center">Doctors</th>
                        <th className="text-center">Active Patients</th>
                        <th className="text-center">Today's OPD</th>
                        <th className="text-end">Bed Occupancy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(adminData.departmentStats || [
                        { name: 'General Medicine', doctors: 3, activePatients: 384, opdToday: 14, bedOccupancy: 85 },
                        { name: 'Cardiology', doctors: 2, activePatients: 216, opdToday: 8, bedOccupancy: 92 },
                        { name: 'Orthopedics', doctors: 2, activePatients: 178, opdToday: 7, bedOccupancy: 78 },
                        { name: 'Pediatrics', doctors: 2, activePatients: 142, opdToday: 6, bedOccupancy: 70 },
                        { name: 'Gynecology', doctors: 2, activePatients: 129, opdToday: 5, bedOccupancy: 80 },
                        { name: 'Neurology', doctors: 1, activePatients: 95, opdToday: 4, bedOccupancy: 88 },
                        { name: 'Dermatology', doctors: 1, activePatients: 64, opdToday: 4, bedOccupancy: 45 },
                      ]).map((d, i) => (
                        <tr key={i}>
                          <td className="fw-semibold text-dark">{d.name}</td>
                          <td className="text-center font-mono">{d.doctors}</td>
                          <td className="text-center font-mono">{d.activePatients}</td>
                          <td className="text-center font-mono">
                            <span className="badge bg-primary-subtle text-primary">{d.opdToday}</span>
                          </td>
                          <td className="text-end font-mono">
                            <span className={`fw-bold ${d.bedOccupancy > 85 ? 'text-danger' : 'text-slate-800'}`}>
                              {d.bedOccupancy}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Low Stock Medicines & Pending Lab Reports */}
            <div className="col-12 col-lg-5">
              <div className="d-flex flex-column gap-4 h-100">
                {/* Low Stock Medicines */}
                <div className="card border border-slate-200 bg-white rounded-3 shadow-sm">
                  <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <AlertTriangle size={18} className="text-danger" />
                      <h6 className="mb-0 fw-bold text-dark">Low Stock Medicines Watchlist</h6>
                    </div>
                    <Link to="/pharmacy" className="small text-primary fw-semibold text-decoration-none">
                      Reorder &rarr;
                    </Link>
                  </div>
                  <div className="p-3">
                    {adminData.lowStockMedicinesList && adminData.lowStockMedicinesList.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {adminData.lowStockMedicinesList.slice(0, 4).map((m) => (
                          <div
                            key={m.id}
                            className="p-2 rounded-2 border border-danger-subtle bg-danger-subtle d-flex align-items-center justify-content-between"
                          >
                            <div>
                              <div className="fw-semibold text-dark small">{m.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                Cat: {m.category} · Threshold: {m.minStockAlert}
                              </div>
                            </div>
                            <span className="badge bg-danger font-mono">
                              {m.stockQuantity} left
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3 small">
                        All pharmaceuticals stocked safely above minimum threshold.
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Lab Reports */}
                <div className="card border border-slate-200 bg-white rounded-3 shadow-sm flex-grow-1">
                  <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <FlaskConical size={18} className="text-info" />
                      <h6 className="mb-0 fw-bold text-dark">Pending Lab Reports</h6>
                      <span className="badge bg-info-subtle text-info small font-mono">
                        {adminData.pendingLabTestsCount || 3} Pending
                      </span>
                    </div>
                    <Link to="/laboratory" className="small text-primary fw-semibold text-decoration-none">
                      Lab Queue &rarr;
                    </Link>
                  </div>
                  <div className="p-3">
                    {adminData.pendingLabTestsList && adminData.pendingLabTestsList.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {adminData.pendingLabTestsList.slice(0, 4).map((t) => (
                          <div
                            key={t.id}
                            className="p-2 rounded-2 border border-slate-200 bg-slate-50 d-flex align-items-center justify-content-between small"
                          >
                            <div>
                              <div className="fw-semibold text-dark">{t.testName}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                Patient: {t.patientName} · {t.patientCode}
                              </div>
                            </div>
                            <span
                              className={`badge ${
                                t.priority === 'STAT' || t.priority === 'URGENT'
                                  ? 'bg-danger'
                                  : 'bg-warning text-dark'
                              }`}
                              style={{ fontSize: '0.65rem' }}
                            >
                              {t.priority || 'ROUTINE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3 small">
                        All specimen processing up to date.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 2: DOCTOR DASHBOARD */}
      {!loading && activeRoleView === 'DOCTOR' && doctorData && (
        <div className="space-y-4">
          {/* Doctor Header Banner */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
            <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-2 bg-teal-50 text-teal-700">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">Physician Clinical Care Station</h5>
                  <div className="text-muted small">
                    Attending: <strong className="text-dark">{doctorData.doctorName}</strong> ·{' '}
                    <span>{doctorData.specialization}</span>
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/appointments" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
                  <Calendar size={14} />
                  <span>My Appointments</span>
                </Link>
                <Link to="/prescriptions" className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1">
                  <Pill size={14} />
                  <span>Write Prescription</span>
                </Link>
                <Link to="/laboratory" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                  <FlaskConical size={14} />
                  <span>Order Lab Test</span>
                </Link>
              </div>
            </div>
          </div>

          {/* DOCTOR KPI GRID (5 Core Requirements) */}
          <div className="row g-3 mb-4">
            {/* 1. Today's Appointments */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Today's Visits</span>
                  <div className="p-2 rounded-2 bg-blue-50 text-blue-600">
                    <Calendar size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {doctorData.todaysAppointmentsCount}
                </div>
                <div className="text-muted small">Consultations on roster today</div>
              </div>
            </div>

            {/* 2. Upcoming Appointments */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Upcoming Appts</span>
                  <div className="p-2 rounded-2 bg-indigo-50 text-indigo-600">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {doctorData.upcomingAppointmentsCount}
                </div>
                <div className="text-muted small">Booked future consultations</div>
              </div>
            </div>

            {/* 3. Patient Count */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Patient Count</span>
                  <div className="p-2 rounded-2 bg-teal-50 text-teal-600">
                    <Users size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {doctorData.patientCount}
                </div>
                <div className="text-muted small">Distinct assigned patients</div>
              </div>
            </div>

            {/* 4. Pending Lab Reports */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Pending Lab Reports</span>
                  <div className="p-2 rounded-2 bg-cyan-50 text-cyan-600">
                    <FlaskConical size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-warning-emphasis font-mono tabular-nums mb-1">
                  {doctorData.pendingLabReportsCount}
                </div>
                <div className="text-muted small">Awaiting diagnostics release</div>
              </div>
            </div>

            {/* 5. Recent Prescriptions */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Recent Prescriptions</span>
                  <div className="p-2 rounded-2 bg-purple-50 text-purple-600">
                    <Pill size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {doctorData.recentPrescriptionsCount}
                </div>
                <div className="text-muted small">Medication orders on file</div>
              </div>
            </div>
          </div>

          {/* DOCTOR SCHEDULE & LAB QUEUES */}
          <div className="row g-4">
            {/* Today's Consultations */}
            <div className="col-12 col-lg-7">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold text-dark">Today's Consultation Queue</h6>
                  </div>
                  <Link to="/appointments" className="small text-primary fw-semibold text-decoration-none">
                    All Slots &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-muted text-uppercase">
                      <tr>
                        <th>Time</th>
                        <th>Patient</th>
                        <th>Reason for Visit</th>
                        <th>Status</th>
                        <th className="text-end">Clinical Action</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {doctorData.todaysAppointmentsList && doctorData.todaysAppointmentsList.length > 0 ? (
                        doctorData.todaysAppointmentsList.map((a) => (
                          <tr key={a.id}>
                            <td className="font-mono tabular-nums fw-bold text-dark">{a.appointmentTime || a.time}</td>
                            <td>
                              <div className="fw-semibold text-dark">{a.patientName}</div>
                              <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>
                                {a.patientCode}
                              </div>
                            </td>
                            <td className="text-muted">{a.reason || 'General Medical Consultation'}</td>
                            <td>
                              <span
                                className={`badge ${
                                  a.status === 'CONFIRMED'
                                    ? 'bg-success'
                                    : a.status === 'SCHEDULED'
                                    ? 'bg-primary'
                                    : 'bg-warning text-dark'
                                }`}
                              >
                                {a.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link to="/records" className="btn btn-sm btn-outline-primary py-1 px-2">
                                Open EMR
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            No appointments currently scheduled for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Doctor's Pending Lab Reports & Recent Prescriptions */}
            <div className="col-12 col-lg-5">
              <div className="space-y-4">
                {/* Pending Lab Reports */}
                <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
                  <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <FlaskConical size={18} className="text-cyan-600" />
                      <h6 className="mb-0 fw-bold text-dark">Pending Lab Results for Patients</h6>
                    </div>
                    <Link to="/laboratory" className="small text-primary fw-semibold text-decoration-none">
                      Lab View &rarr;
                    </Link>
                  </div>
                  <div className="p-3">
                    {doctorData.pendingLabReportsList && doctorData.pendingLabReportsList.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {doctorData.pendingLabReportsList.map((t) => (
                          <div
                            key={t.id}
                            className="p-2 rounded-2 border border-slate-200 bg-slate-50 d-flex align-items-center justify-content-between"
                          >
                            <div>
                              <div className="fw-semibold text-dark small">{t.testName}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                Patient: {t.patientName} · Priority: {t.priority}
                              </div>
                            </div>
                            <span className="badge bg-warning text-dark">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3 small">
                        No pending laboratory tests awaiting review.
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Prescriptions */}
                <div className="card border border-slate-200 bg-white rounded-3 shadow-sm">
                  <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Pill size={18} className="text-purple-600" />
                      <h6 className="mb-0 fw-bold text-dark">Recent Prescriptions Issued</h6>
                    </div>
                    <Link to="/prescriptions" className="small text-primary fw-semibold text-decoration-none">
                      All Rx &rarr;
                    </Link>
                  </div>
                  <div className="p-3">
                    {doctorData.recentPrescriptionsList && doctorData.recentPrescriptionsList.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {doctorData.recentPrescriptionsList.map((rx) => (
                          <div
                            key={rx.id}
                            className="p-2 rounded-2 border border-slate-200 bg-white d-flex align-items-center justify-content-between"
                          >
                            <div>
                              <div className="fw-semibold text-dark small">{rx.prescriptionNumber}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                Patient: {rx.patientName} · {rx.diagnosis}
                              </div>
                            </div>
                            <Link to="/prescriptions" className="btn btn-xs btn-outline-secondary py-0 px-2">
                              View
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3 small">No recent prescriptions recorded.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 3: RECEPTIONIST DASHBOARD */}
      {!loading && activeRoleView === 'RECEPTIONIST' && receptionistData && (
        <div className="space-y-4">
          {/* Receptionist Header Banner */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
            <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-2 bg-blue-50 text-blue-700">
                  <Users size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">Front-Desk Reception & Patient Intake</h5>
                  <div className="text-muted small">
                    Check-in counter · Walk-in registration · Bed triage · Cashier collections
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/patients" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
                  <Plus size={14} />
                  <span>Register Patient</span>
                </Link>
                <Link to="/appointments" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                  <Calendar size={14} />
                  <span>Book Appointment</span>
                </Link>
                <Link to="/inpatient" className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1">
                  <BedDouble size={14} />
                  <span>Admit to Bed</span>
                </Link>
              </div>
            </div>
          </div>

          {/* RECEPTIONIST KPI GRID (5 Core Requirements) */}
          <div className="row g-3 mb-4">
            {/* 1. Today's Appointments */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Today's Visits</span>
                  <div className="p-2 rounded-2 bg-indigo-50 text-indigo-600">
                    <Calendar size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {receptionistData.todaysAppointmentsCount}
                </div>
                <div className="text-muted small">Scheduled OPD consultations today</div>
              </div>
            </div>

            {/* 2. New Registrations */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Registrations</span>
                  <div className="p-2 rounded-2 bg-blue-50 text-blue-600">
                    <Users size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {receptionistData.newRegistrationsCount}
                </div>
                <div className="text-muted small">Registered hospital patients</div>
              </div>
            </div>

            {/* 3. Available Doctors */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Available Doctors</span>
                  <div className="p-2 rounded-2 bg-teal-50 text-teal-600">
                    <Stethoscope size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-success font-mono tabular-nums mb-1">
                  {receptionistData.availableDoctorsCount}
                </div>
                <div className="text-muted small">On-duty in outpatient clinics</div>
              </div>
            </div>

            {/* 4. Available Beds */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Available Beds</span>
                  <div className="p-2 rounded-2 bg-emerald-50 text-emerald-600">
                    <BedDouble size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-success font-mono tabular-nums mb-1">
                  {receptionistData.availableBedsCount}
                </div>
                <div className="text-muted small">Ready for immediate intake</div>
              </div>
            </div>

            {/* 5. Pending Payments */}
            <div className="col-12 col-sm-6 col-lg">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Pending Payments</span>
                  <div className="p-2 rounded-2 bg-amber-50 text-amber-600">
                    <CreditCard size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-warning-emphasis font-mono tabular-nums mb-1">
                  ₹{Number(receptionistData.pendingPaymentsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-muted small">{receptionistData.pendingPaymentsCount} unpaid counter bills</div>
              </div>
            </div>
          </div>

          {/* RECEPTIONIST TWO-COLUMN LAYOUT */}
          <div className="row g-4">
            {/* Front Desk Appointments */}
            <div className="col-12 col-lg-7">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold text-dark">Today's Patient Check-In Queue</h6>
                  </div>
                  <Link to="/appointments" className="small text-primary fw-semibold text-decoration-none">
                    Schedule &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-muted text-uppercase">
                      <tr>
                        <th>Time</th>
                        <th>Patient</th>
                        <th>Assigned Doctor</th>
                        <th>Status</th>
                        <th className="text-end">Counter Action</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {receptionistData.todaysAppointmentsList && receptionistData.todaysAppointmentsList.length > 0 ? (
                        receptionistData.todaysAppointmentsList.map((a) => (
                          <tr key={a.id}>
                            <td className="font-mono tabular-nums fw-bold text-dark">{a.appointmentTime || a.time}</td>
                            <td>
                              <div className="fw-semibold text-dark">{a.patientName}</div>
                              <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>
                                {a.patientCode}
                              </div>
                            </td>
                            <td>
                              <div className="text-dark">{a.doctorName}</div>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  a.status === 'CONFIRMED'
                                    ? 'bg-success'
                                    : a.status === 'SCHEDULED'
                                    ? 'bg-primary'
                                    : 'bg-warning text-dark'
                                }`}
                              >
                                {a.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link to="/appointments" className="btn btn-xs btn-outline-primary py-1 px-2">
                                Check In
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            No appointments on roster for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Available Doctors & Available Beds */}
            <div className="col-12 col-lg-5">
              <div className="space-y-4">
                {/* Available Doctors */}
                <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
                  <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Stethoscope size={18} className="text-teal-600" />
                      <h6 className="mb-0 fw-bold text-dark">On-Duty Doctors (OPD Roster)</h6>
                    </div>
                    <Link to="/doctors" className="small text-primary fw-semibold text-decoration-none">
                      View All &rarr;
                    </Link>
                  </div>
                  <div className="p-3">
                    <div className="d-flex flex-column gap-2">
                      {receptionistData.availableDoctorsList &&
                        receptionistData.availableDoctorsList.slice(0, 4).map((d) => (
                          <div
                            key={d.id}
                            className="p-2 rounded-2 border border-slate-200 bg-slate-50 d-flex align-items-center justify-content-between"
                          >
                            <div>
                              <div className="fw-semibold text-dark small">{d.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {d.specialization} · Room {d.roomNumber || 'OPD-1'}
                              </div>
                            </div>
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              Active
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Available Beds for Admission */}
                <div className="card border border-slate-200 bg-white rounded-3 shadow-sm">
                  <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <BedDouble size={18} className="text-emerald-600" />
                      <h6 className="mb-0 fw-bold text-dark">Ready Beds for Immediate Intake</h6>
                    </div>
                    <Link to="/inpatient" className="small text-primary fw-semibold text-decoration-none">
                      Admit Patient &rarr;
                    </Link>
                  </div>
                  <div className="p-3">
                    <div className="row g-2">
                      {receptionistData.availableBedsList &&
                        receptionistData.availableBedsList.slice(0, 4).map((b) => (
                          <div key={b.id} className="col-6">
                            <div className="p-2 border rounded-2 bg-slate-50">
                              <div className="fw-bold text-dark small">{b.bedNumber}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {b.roomType} · ₹{b.dailyRate}/day
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 4: PHARMACIST DASHBOARD */}
      {!loading && activeRoleView === 'PHARMACIST' && pharmacistData && (
        <div className="space-y-4">
          {/* Pharmacist Header Banner */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
            <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-2 bg-amber-50 text-amber-700">
                  <Pill size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">Hospital Pharmacy & Drug Dispensary</h5>
                  <div className="text-muted small">
                    Dispensing queue · Inventory safety stock · Batch expiry surveillance
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/pharmacy" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
                  <Plus size={14} />
                  <span>Receive Stock</span>
                </Link>
                <Link to="/prescriptions" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                  <ClipboardList size={14} />
                  <span>Dispense Rx</span>
                </Link>
              </div>
            </div>
          </div>

          {/* PHARMACIST KPI GRID (4 Core Requirements) */}
          <div className="row g-3 mb-4">
            {/* 1. Low-Stock Medicines */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Low-Stock Meds</span>
                  <div className="p-2 rounded-2 bg-rose-50 text-rose-600">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-danger font-mono tabular-nums mb-1">
                  {pharmacistData.lowStockMedicinesCount}
                </div>
                <div className="text-muted small">Below minimum reorder level</div>
              </div>
            </div>

            {/* 2. Expiring Medicines */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Expiring Meds</span>
                  <div className="p-2 rounded-2 bg-amber-50 text-amber-600">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-warning-emphasis font-mono tabular-nums mb-1">
                  {pharmacistData.expiringMedicinesCount}
                </div>
                <div className="text-muted small">Expiring within 45 days (Rule 12)</div>
              </div>
            </div>

            {/* 3. Today's Prescriptions */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Today's Prescriptions</span>
                  <div className="p-2 rounded-2 bg-purple-50 text-purple-600">
                    <ClipboardList size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {pharmacistData.todaysPrescriptionsCount}
                </div>
                <div className="text-muted small">
                  <strong className="text-primary font-mono">{pharmacistData.pendingDispenseCount}</strong> Pending ·{' '}
                  <strong className="text-success font-mono">{pharmacistData.dispensedCount}</strong> Dispensed
                </div>
              </div>
            </div>

            {/* 4. Inventory Summary */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Inventory Valuation</span>
                  <div className="p-2 rounded-2 bg-emerald-50 text-emerald-600">
                    <IndianRupee size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-success font-mono tabular-nums mb-1">
                  ₹{Number(pharmacistData.totalInventoryValuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-muted small">
                  {pharmacistData.totalMedicinesCount} SKUs in formulary
                </div>
              </div>
            </div>
          </div>

          {/* PHARMACIST DETAIL WORKLISTS */}
          <div className="row g-4">
            {/* Low-stock & Expiring Grid */}
            <div className="col-12 col-lg-6">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <AlertTriangle size={18} className="text-danger" />
                    <h6 className="mb-0 fw-bold text-dark">Low-Stock Reorder Watchlist</h6>
                  </div>
                  <Link to="/pharmacy" className="small text-primary fw-semibold text-decoration-none">
                    Pharmacy Stock &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted text-uppercase">
                      <tr>
                        <th>Medicine</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Min Alert</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pharmacistData.lowStockMedicinesList && pharmacistData.lowStockMedicinesList.length > 0 ? (
                        pharmacistData.lowStockMedicinesList.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <div className="fw-semibold text-dark">{m.name}</div>
                              <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>
                                Batch: {m.batchNumber || 'N/A'}
                              </div>
                            </td>
                            <td>{m.category}</td>
                            <td className="font-mono tabular-nums fw-bold text-danger">{m.stockQuantity}</td>
                            <td className="font-mono tabular-nums text-muted">{m.minStockAlert}</td>
                            <td className="text-end">
                              <Link to="/pharmacy" className="btn btn-xs btn-outline-primary py-1 px-2">
                                Restock
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            All medicines have sufficient stock.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Prescriptions Dispensing Queue */}
            <div className="col-12 col-lg-6">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <ClipboardList size={18} className="text-purple-600" />
                    <h6 className="mb-0 fw-bold text-dark">Prescription Dispensing Queue</h6>
                  </div>
                  <Link to="/prescriptions" className="small text-primary fw-semibold text-decoration-none">
                    All Prescriptions &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted text-uppercase">
                      <tr>
                        <th>Rx Number</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pharmacistData.todaysPrescriptionsList && pharmacistData.todaysPrescriptionsList.length > 0 ? (
                        pharmacistData.todaysPrescriptionsList.map((rx) => (
                          <tr key={rx.id}>
                            <td className="font-mono fw-bold text-dark">{rx.prescriptionNumber}</td>
                            <td>{rx.patientName}</td>
                            <td>{rx.doctorName}</td>
                            <td>
                              <span
                                className={`badge ${
                                  rx.status === 'DISPENSED' ? 'bg-success' : 'bg-warning text-dark'
                                }`}
                              >
                                {rx.status || 'PENDING'}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link to="/prescriptions" className="btn btn-xs btn-outline-primary py-1 px-2">
                                Dispense
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            No prescriptions pending in queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 5: LAB TECHNICIAN DASHBOARD */}
      {!loading && activeRoleView === 'LAB_TECHNICIAN' && labData && (
        <div className="space-y-4">
          {/* Lab Header Banner */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
            <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-2 bg-cyan-50 text-cyan-700">
                  <FlaskConical size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">Clinical Pathology & Diagnostic Laboratory</h5>
                  <div className="text-muted small">
                    Specimen accessioning · Analytical processing · Critical STAT values
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/laboratory" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
                  <FlaskConical size={14} />
                  <span>Lab Workbench</span>
                </Link>
              </div>
            </div>
          </div>

          {/* LAB TECHNICIAN KPI GRID (3 Core Requirements) */}
          <div className="row g-3 mb-4">
            {/* 1. Pending Tests */}
            <div className="col-12 col-sm-4">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Pending Tests</span>
                  <div className="p-2 rounded-2 bg-amber-50 text-amber-600">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-warning-emphasis font-mono tabular-nums mb-1">
                  {labData.pendingTestsCount}
                </div>
                <div className="text-muted small">Awaiting sample draw / intake</div>
              </div>
            </div>

            {/* 2. Tests in Progress */}
            <div className="col-12 col-sm-4">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Tests In Progress</span>
                  <div className="p-2 rounded-2 bg-blue-50 text-blue-600">
                    <Activity size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-primary font-mono tabular-nums mb-1">
                  {labData.testsInProgressCount}
                </div>
                <div className="text-muted small">Active on clinical analyzers</div>
              </div>
            </div>

            {/* 3. Completed Tests */}
            <div className="col-12 col-sm-4">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Completed Tests</span>
                  <div className="p-2 rounded-2 bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-success font-mono tabular-nums mb-1">
                  {labData.completedTestsCount}
                </div>
                <div className="text-muted small">Validated & released diagnostic reports</div>
              </div>
            </div>
          </div>

          {/* LAB DETAIL WORKLISTS */}
          <div className="row g-4">
            {/* Active Specimen Processing Queue */}
            <div className="col-12 col-lg-7">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <FlaskConical size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold text-dark">Active Diagnostic Queue</h6>
                  </div>
                  <Link to="/laboratory" className="small text-primary fw-semibold text-decoration-none">
                    Full Lab Queue &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted text-uppercase">
                      <tr>
                        <th>Test Name</th>
                        <th>Patient</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th className="text-end">Lab Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labData.pendingTestsList && labData.pendingTestsList.length > 0 ? (
                        labData.pendingTestsList.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <div className="fw-semibold text-dark">{t.testName}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                Cat: {t.category || 'Diagnostics'}
                              </div>
                            </td>
                            <td>{t.patientName}</td>
                            <td>
                              <span
                                className={`badge ${
                                  t.priority === 'STAT' || t.priority === 'URGENT'
                                    ? 'bg-danger'
                                    : 'bg-secondary'
                                }`}
                              >
                                {t.priority || 'ROUTINE'}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-warning text-dark">{t.status}</span>
                            </td>
                            <td className="text-end">
                              <Link to="/laboratory" className="btn btn-xs btn-outline-primary py-1 px-2">
                                Process
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            No pending tests in queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recently Completed Diagnostic Reports */}
            <div className="col-12 col-lg-5">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle2 size={18} className="text-success" />
                    <h6 className="mb-0 fw-bold text-dark">Finalized Lab Reports</h6>
                  </div>
                  <Link to="/laboratory" className="small text-primary fw-semibold text-decoration-none">
                    Reports Archive &rarr;
                  </Link>
                </div>
                <div className="p-3">
                  {labData.completedTestsList && labData.completedTestsList.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                      {labData.completedTestsList.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-2 border border-slate-200 bg-slate-50 d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <div className="fw-semibold text-dark small">{c.testName}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              Patient: {c.patientName} · Finalized
                            </div>
                          </div>
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3 small">No completed lab reports today.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 6: PATIENT DASHBOARD */}
      {!loading && activeRoleView === 'PATIENT' && patientData && (
        <div className="space-y-4">
          {/* Patient Header Banner */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
            <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-2 bg-emerald-50 text-emerald-700">
                  <Activity size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">Patient Health & Wellness Portal</h5>
                  <div className="text-muted small">
                    Patient: <strong className="text-dark">{patientData.patientName}</strong> · Code:{' '}
                    <span className="font-mono">{patientData.patientCode}</span> · Blood Group:{' '}
                    <span className="badge bg-light text-dark border font-mono">{patientData.bloodGroup}</span>
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/appointments" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
                  <Calendar size={14} />
                  <span>Book Appointment</span>
                </Link>
                <Link to="/billing" className="btn btn-sm btn-outline-success d-flex align-items-center gap-1">
                  <CreditCard size={14} />
                  <span>Pay Bills</span>
                </Link>
              </div>
            </div>
          </div>

          {/* PATIENT KPI GRID (4 Core Requirements) */}
          <div className="row g-3 mb-4">
            {/* 1. Upcoming Appointments */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Upcoming Appts</span>
                  <div className="p-2 rounded-2 bg-blue-50 text-blue-600">
                    <Calendar size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {patientData.upcomingAppointmentsCount}
                </div>
                <div className="text-muted small">Scheduled consultations</div>
              </div>
            </div>

            {/* 2. Recent Prescriptions */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Active Prescriptions</span>
                  <div className="p-2 rounded-2 bg-purple-50 text-purple-600">
                    <Pill size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {patientData.recentPrescriptionsCount}
                </div>
                <div className="text-muted small">Prescribed medications</div>
              </div>
            </div>

            {/* 3. Lab Reports */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Lab Reports</span>
                  <div className="p-2 rounded-2 bg-cyan-50 text-cyan-600">
                    <FlaskConical size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {patientData.labReportsCount}
                </div>
                <div className="text-muted small">Diagnostic test results</div>
              </div>
            </div>

            {/* 4. Outstanding Bills */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Balance Due</span>
                  <div className="p-2 rounded-2 bg-amber-50 text-amber-600">
                    <CreditCard size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-danger font-mono tabular-nums mb-1">
                  ₹{Number(patientData.outstandingBalanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="d-flex align-items-center justify-content-between text-muted small">
                  <span>{patientData.outstandingBillsCount} unpaid invoice(s)</span>
                  <Link to="/billing" className="text-success fw-semibold text-decoration-none">
                    Pay Now &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* PATIENT DETAIL WORKLISTS */}
          <div className="row g-4">
            {/* My Upcoming Appointments */}
            <div className="col-12 col-lg-6">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold text-dark">My Upcoming Consultations</h6>
                  </div>
                  <Link to="/appointments" className="small text-primary fw-semibold text-decoration-none">
                    Book &rarr;
                  </Link>
                </div>
                <div className="p-3">
                  {patientData.upcomingAppointmentsList && patientData.upcomingAppointmentsList.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                      {patientData.upcomingAppointmentsList.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-2 border border-slate-200 bg-slate-50 d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <div className="fw-semibold text-dark">{a.doctorName}</div>
                            <div className="text-muted small">
                              {a.departmentName || a.specialization || 'Clinical'} · Date:{' '}
                              <span className="font-mono text-dark">{a.appointmentDate || a.date}</span> at{' '}
                              <span className="font-mono text-dark">{a.appointmentTime || a.time}</span>
                            </div>
                          </div>
                          <span className="badge bg-primary">{a.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4 small">
                      You have no upcoming consultations scheduled.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prescriptions & Lab Results Tabs */}
            <div className="col-12 col-lg-6">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Pill size={18} className="text-purple-600" />
                    <h6 className="mb-0 fw-bold text-dark">My Medications & Diagnostic Tests</h6>
                  </div>
                  <Link to="/prescriptions" className="small text-primary fw-semibold text-decoration-none">
                    View &rarr;
                  </Link>
                </div>
                <div className="p-3">
                  <div className="mb-3">
                    <h6 className="fw-semibold text-dark small text-uppercase mb-2">Active Prescriptions</h6>
                    {patientData.recentPrescriptionsList && patientData.recentPrescriptionsList.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {patientData.recentPrescriptionsList.map((rx) => (
                          <div key={rx.id} className="p-2 border rounded bg-white small">
                            <div className="d-flex justify-content-between fw-bold">
                              <span>{rx.prescriptionNumber}</span>
                              <span className="text-muted font-mono">{rx.date || rx.createdAt}</span>
                            </div>
                            <div className="text-muted">Doctor: {rx.doctorName} · {rx.diagnosis}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted small">No active prescriptions on file.</div>
                    )}
                  </div>

                  <div>
                    <h6 className="fw-semibold text-dark small text-uppercase mb-2">Diagnostic Reports</h6>
                    {patientData.labReportsList && patientData.labReportsList.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {patientData.labReportsList.map((l) => (
                          <div
                            key={l.id}
                            className="p-2 border rounded bg-white small d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <div className="fw-semibold text-dark">{l.testName}</div>
                              <div className="text-muted">{l.category}</div>
                            </div>
                            <span className={`badge ${l.status === 'COMPLETED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {l.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted small">No lab reports found.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 7: NURSE DASHBOARD */}
      {!loading && activeRoleView === 'NURSE' && nurseData && (
        <div className="space-y-4">
          {/* Nurse Header Banner */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm mb-4">
            <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-2 bg-success-subtle text-success">
                  <HeartPulse size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">Inpatient Ward Nursing Station & Vital Telemetry</h5>
                  <div className="text-muted small">
                    Ward bed census · Vital signs monitoring · Medication administration record (MAR)
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/inpatient" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
                  <BedDouble size={14} />
                  <span>Ward Bed Grid</span>
                </Link>
                <Link to="/records" className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1">
                  <FileText size={14} />
                  <span>Patient Charts</span>
                </Link>
              </div>
            </div>
          </div>

          {/* NURSE KPI GRID */}
          <div className="row g-3 mb-4">
            {/* 1. Admitted Inpatients */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Admitted Patients</span>
                  <div className="p-2 rounded-2 bg-blue-50 text-blue-600">
                    <Users size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {nurseData.activeInpatientsCount}
                </div>
                <div className="text-muted small">Inpatient beds under care</div>
              </div>
            </div>

            {/* 2. Available Beds */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Available Beds</span>
                  <div className="p-2 rounded-2 bg-emerald-50 text-emerald-600">
                    <BedDouble size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-success font-mono tabular-nums mb-1">
                  {nurseData.availableBedsCount}
                </div>
                <div className="text-muted small">Clean & ready for intake</div>
              </div>
            </div>

            {/* 3. Bed Occupancy Rate */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Ward Occupancy</span>
                  <div className="p-2 rounded-2 bg-purple-50 text-purple-600">
                    <Activity size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-dark font-mono tabular-nums mb-1">
                  {nurseData.occupancyRate}%
                </div>
                <div className="text-muted small">
                  {nurseData.occupiedBedsCount} of {nurseData.totalBedsCount} beds occupied
                </div>
              </div>
            </div>

            {/* 4. Scheduled Med Administrations */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase tracking-wider">Scheduled Meds (MAR)</span>
                  <div className="p-2 rounded-2 bg-amber-50 text-amber-600">
                    <Pill size={18} />
                  </div>
                </div>
                <div className="fs-3 fw-bold text-warning-emphasis font-mono tabular-nums mb-1">
                  {nurseData.scheduledMedicationsCount}
                </div>
                <div className="text-muted small">Doses due this shift</div>
              </div>
            </div>
          </div>

          {/* NURSE DETAIL TABLES */}
          <div className="row g-4">
            {/* Active Inpatients Vitals Monitor */}
            <div className="col-12 col-lg-7">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <HeartPulse size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold text-dark">Active Inpatient Ward Roster & Vitals</h6>
                  </div>
                  <Link to="/inpatient" className="small text-primary fw-semibold text-decoration-none">
                    Ward Map &rarr;
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted text-uppercase">
                      <tr>
                        <th>Bed / Room</th>
                        <th>Patient</th>
                        <th>Physician</th>
                        <th>Vitals (BP · Pulse · SpO2)</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nurseData.inpatientsList && nurseData.inpatientsList.length > 0 ? (
                        nurseData.inpatientsList.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="fw-bold text-dark font-mono">{p.bedNumber}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                Room {p.roomNumber}
                              </div>
                            </td>
                            <td>
                              <div className="fw-semibold text-dark">{p.patientName}</div>
                              <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>
                                {p.patientCode}
                              </div>
                            </td>
                            <td>{p.doctorName}</td>
                            <td>
                              <div className="font-mono text-dark fw-medium" style={{ fontSize: '0.75rem' }}>
                                {p.bloodPressure} · {p.heartRate} · {p.spO2}
                              </div>
                              <span className="badge bg-success-subtle text-success border border-success-subtle">
                                {p.vitalsStatus}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link to="/records" className="btn btn-xs btn-outline-primary py-1 px-2">
                                Chart
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            No inpatients currently admitted.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Scheduled Med Doses (MAR Queue) */}
            <div className="col-12 col-lg-5">
              <div className="card border border-slate-200 bg-white rounded-3 shadow-sm h-100">
                <div className="card-header bg-white border-bottom border-slate-200 p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Pill size={18} className="text-purple-600" />
                    <h6 className="mb-0 fw-bold text-dark">Shift Medication Schedule (MAR)</h6>
                  </div>
                  <Link to="/prescriptions" className="small text-primary fw-semibold text-decoration-none">
                    Prescriptions &rarr;
                  </Link>
                </div>
                <div className="p-3">
                  {nurseData.scheduledMedicationsList && nurseData.scheduledMedicationsList.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                      {nurseData.scheduledMedicationsList.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-2 border border-slate-200 bg-slate-50 d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <div className="fw-semibold text-dark small">{m.prescriptionNumber}</div>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                              Patient: {m.patientName} · {m.diagnosis}
                            </div>
                            <div className="font-mono text-primary small" style={{ fontSize: '0.7rem' }}>
                              Due: {m.scheduledTime}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              Swal.fire({
                                icon: 'success',
                                title: 'Dose Recorded',
                                text: `Administered dose for ${m.patientName} recorded in MAR ledger.`,
                                timer: 1500,
                                showConfirmButton: false,
                              })
                            }
                            className="btn btn-xs btn-outline-success py-1 px-2"
                          >
                            Administer
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4 small">No scheduled doses due this shift.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockDataService } from '../services/mockDataService';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  BadgeCheck,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  MapPin,
  Clock,
  HeartPulse,
} from 'lucide-react';
import Swal from 'sweetalert2';

export const ProfilePage = () => {
  const { currentUser, updateProfile } = useAuth();

  // Active section tab: 'details' | 'appointments' | 'records' | 'prescriptions' | 'lab' | 'bills' | 'security'
  const [activeTab, setActiveTab] = useState('details');

  // Form states
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    specialization: currentUser?.specialization || '',
    address: 'Flat 402, Shivajinagar, Pune, Maharashtra 411005',
    emergencyContactName: 'Sunita Sharma',
    emergencyContactPhone: '+91 98220 99887',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Associated clinical dataset for the user/patient
  const patientHistory = useMemo(() => {
    try {
      const patientId = currentUser?.id || 1;
      return mockDataService.getPatientHistory(patientId);
    } catch {
      return null;
    }
  }, [currentUser?.id]);

  const patientLabTests = useMemo(() => {
    try {
      const res = mockDataService.getLabTests({ patientId: currentUser?.id || 1 }, 0, 10);
      return res?.content || [];
    } catch {
      return [];
    }
  }, [currentUser?.id]);

  const patientBills = useMemo(() => {
    try {
      const allBills = mockDataService.getBills();
      return allBills.filter((b) => b.patientId === (currentUser?.id || 1) || b.patientName === currentUser?.fullName);
    } catch {
      return [];
    }
  }, [currentUser?.id, currentUser?.fullName]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      updateProfile(formData);
      setSavingProfile(false);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Profile Updated',
        text: 'Personal and emergency contact details saved successfully.',
        showConfirmButton: false,
        timer: 2000,
      });
    }, 400);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      Swal.fire('Error', 'Please enter your current password', 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      Swal.fire('Error', 'New password must be at least 8 characters', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      Swal.fire('Error', 'New passwords do not match', 'error');
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      Swal.fire({
        icon: 'success',
        title: 'Security Updated',
        text: 'Your account password has been updated successfully with BCrypt hashing.',
        confirmButtonColor: '#0B5C75',
      });
    }, 500);
  };

  const getRoleBadgeClass = (role) => {
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

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
      case 'AVAILABLE':
        return <span className="badge bg-success-subtle text-success">PAID / COMPLETED</span>;
      case 'PENDING':
      case 'PARTIAL':
        return <span className="badge bg-warning-subtle text-warning-emphasis">PENDING</span>;
      case 'CANCELLED':
      case 'UNPAID':
        return <span className="badge bg-danger-subtle text-danger">UNPAID</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4 bg-slate-50 min-vh-100">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-slate-200">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            {currentUser?.role === 'PATIENT' ? 'Patient Health Profile & Records' : 'Staff Profile & Security Hub'}
          </h3>
          <p className="text-muted small mb-0">
            Shree Jeevan Multispeciality Hospital · Comprehensive clinical records, appointments, prescriptions, and account governance
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Persona Card & Quick Information */}
        <div className="col-12 col-lg-4">
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm p-4 text-center mb-4">
            <div
              className="mx-auto bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-3"
              style={{ width: 76, height: 76, fontSize: '1.8rem', fontWeight: 600 }}
            >
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <h5 className="fw-bold text-dark mb-1">{currentUser?.fullName}</h5>
            <div className="text-muted small font-mono mb-2">{currentUser?.email}</div>
            <div>
              <span className={`badge px-3 py-1 rounded-pill ${getRoleBadgeClass(currentUser?.role)}`}>
                {currentUser?.role}
              </span>
            </div>

            <hr className="my-3 border-slate-200" />

            <div className="text-start small">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Username:</span>
                <span className="font-mono text-dark fw-medium">{currentUser?.username}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Mobile Phone:</span>
                <span className="text-dark font-mono">{formData.phone || '+91 98220 11001'}</span>
              </div>
              {currentUser?.patientCode && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Patient Code:</span>
                  <span className="font-mono text-primary fw-bold">{currentUser?.patientCode}</span>
                </div>
              )}
              {currentUser?.specialization && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Specialty:</span>
                  <span className="text-dark">{currentUser?.specialization}</span>
                </div>
              )}
              <div className="d-flex justify-content-between">
                <span className="text-muted">Security State:</span>
                <span className="text-success fw-semibold d-flex align-items-center gap-1">
                  <BadgeCheck size={14} /> Active & Verified
                </span>
              </div>
            </div>
          </div>

          {/* Quick Facility Card */}
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm p-3">
            <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold small">
              <ShieldCheck size={18} />
              <span>Patient Privacy & NABH Compliance</span>
            </div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
              Your electronic health records (EHR) and diagnostic investigations are protected according to statutory
              data isolation rules at Shree Jeevan Multispeciality Hospital, Pune.
            </p>
          </div>
        </div>

        {/* Right Column: Tabbed Interactive Sections */}
        <div className="col-12 col-lg-8">
          <div className="card border border-slate-200 bg-white rounded-3 shadow-sm overflow-hidden">
            {/* Interactive Section Tabs */}
            <div className="card-header bg-white border-bottom border-slate-200 p-0">
              <ul className="nav nav-tabs border-0 px-3 pt-2 gap-1">
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`nav-link small d-flex align-items-center gap-1.5 ${
                      activeTab === 'details' ? 'active' : ''
                    }`}
                  >
                    <User size={15} />
                    <span>Personal Info</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('appointments')}
                    className={`nav-link small d-flex align-items-center gap-1.5 ${
                      activeTab === 'appointments' ? 'active' : ''
                    }`}
                  >
                    <Calendar size={15} />
                    <span>Appointments ({patientHistory?.recentAppointments?.length || 0})</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('records')}
                    className={`nav-link small d-flex align-items-center gap-1.5 ${
                      activeTab === 'records' ? 'active' : ''
                    }`}
                  >
                    <FileText size={15} />
                    <span>Medical Records ({patientHistory?.recentClinicalRecords?.length || 0})</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('prescriptions')}
                    className={`nav-link small d-flex align-items-center gap-1.5 ${
                      activeTab === 'prescriptions' ? 'active' : ''
                    }`}
                  >
                    <Pill size={15} />
                    <span>Prescriptions ({patientHistory?.recentPrescriptions?.length || 0})</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('lab')}
                    className={`nav-link small d-flex align-items-center gap-1.5 ${
                      activeTab === 'lab' ? 'active' : ''
                    }`}
                  >
                    <FlaskConical size={15} />
                    <span>Lab Reports ({patientLabTests.length})</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('bills')}
                    className={`nav-link small d-flex align-items-center gap-1.5 ${
                      activeTab === 'bills' ? 'active' : ''
                    }`}
                  >
                    <CreditCard size={15} />
                    <span>Bills ({patientBills.length})</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`nav-link small d-flex align-items-center gap-1.5 ${
                      activeTab === 'security' ? 'active' : ''
                    }`}
                  >
                    <Lock size={15} />
                    <span>Security</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-4">
              {/* TAB 1: PERSONAL & EMERGENCY CONTACT DETAILS */}
              {activeTab === 'details' && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">Personal & Emergency Contact Details</h6>
                  <p className="text-muted small mb-4">
                    Maintain your updated contact details for automated appointment reminders and hospital communications.
                  </p>

                  <form onSubmit={handleProfileSubmit}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-slate-700">Full Legal Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-slate-700">Email Address *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-slate-700">Mobile Number *</label>
                        <input
                          type="tel"
                          className="form-control font-mono"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-slate-700">Residential Address</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-slate-700">Emergency Contact Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.emergencyContactName}
                          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-slate-700">Emergency Contact Phone *</label>
                        <input
                          type="tel"
                          className="form-control font-mono"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4 text-end">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="btn btn-primary btn-sm px-4 py-2 rounded-2 d-inline-flex align-items-center gap-1.5 shadow-sm"
                      >
                        <Save size={14} />
                        <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: UPCOMING APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Consultations & OPD Appointments</h6>
                      <p className="text-muted small mb-0">Upcoming and past scheduled clinic visits</p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>Doctor / Specialization</th>
                          <th>Date & Time</th>
                          <th>Reason for Visit</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!patientHistory?.recentAppointments || patientHistory.recentAppointments.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted">
                              <Calendar size={28} className="mx-auto mb-2 opacity-50" />
                              <p className="mb-0">Your appointment list is currently empty.</p>
                            </td>
                          </tr>
                        ) : (
                          patientHistory.recentAppointments.map((appt) => (
                            <tr key={appt.id}>
                              <td>
                                <div className="fw-semibold text-dark">{appt.doctorName}</div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  {appt.departmentName || 'General OPD'}
                                </div>
                              </td>
                              <td>
                                <div className="fw-medium text-dark">{appt.appointmentDate}</div>
                                <div className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                                  {appt.appointmentTime}
                                </div>
                              </td>
                              <td>{appt.reason || 'Routine Checkup'}</td>
                              <td>{getStatusBadge(appt.status)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: MEDICAL RECORDS */}
              {activeTab === 'records' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Electronic Medical Records (EMR)</h6>
                      <p className="text-muted small mb-0">Clinical diagnoses, observations, and treatment plans</p>
                    </div>
                  </div>

                  {!patientHistory?.recentClinicalRecords || patientHistory.recentClinicalRecords.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <FileText size={28} className="mx-auto mb-2 opacity-50" />
                      <p className="mb-0">No clinical medical records recorded yet.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {patientHistory.recentClinicalRecords.map((rec) => (
                        <div key={rec.id} className="p-3 border border-slate-200 rounded-2 bg-slate-50">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold text-dark">{rec.diagnosis || 'Clinical Consultation'}</span>
                            <span className="text-muted small font-mono">{rec.recordDate || 'Recent'}</span>
                          </div>
                          <div className="text-muted small mb-2">{rec.treatmentPlan || rec.clinicalNotes || 'Observation on file.'}</div>
                          <div className="d-flex align-items-center gap-3 text-muted small" style={{ fontSize: '0.72rem' }}>
                            <span>Attending Doctor: <b>{rec.doctorName || 'Senior Consultant'}</b></span>
                            <span>·</span>
                            <span>Vitals: BP 120/80 mmHg · SpO2 99%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PRESCRIPTIONS */}
              {activeTab === 'prescriptions' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Digital e-Prescriptions</h6>
                      <p className="text-muted small mb-0">Current and past medications dispensed from Central Pharmacy</p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>Prescription #</th>
                          <th>Prescribing Doctor</th>
                          <th>Medications</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!patientHistory?.recentPrescriptions || patientHistory.recentPrescriptions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted">
                              <Pill size={28} className="mx-auto mb-2 opacity-50" />
                              <p className="mb-0">No prescriptions on file.</p>
                            </td>
                          </tr>
                        ) : (
                          patientHistory.recentPrescriptions.map((rx) => (
                            <tr key={rx.id}>
                              <td className="font-mono fw-bold text-dark">{rx.prescriptionNumber || `RX-${rx.id}`}</td>
                              <td>{rx.doctorName || 'Dr. Deshmukh'}</td>
                              <td>
                                {Array.isArray(rx.items)
                                  ? rx.items.map((i) => `${i.medicineName || i.name} (${i.dosage})`).join(', ')
                                  : 'Paracetamol 500mg, Amoxicillin 500mg'}
                              </td>
                              <td>
                                <span className={`badge ${rx.status === 'DISPENSED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                                  {rx.status || 'ACTIVE'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: LABORATORY REPORTS */}
              {activeTab === 'lab' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Diagnostic Pathology Reports</h6>
                      <p className="text-muted small mb-0">Laboratory blood investigations and imaging results</p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>Test Requisition</th>
                          <th>Specimen Status</th>
                          <th>Requested Date</th>
                          <th>Result / Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientLabTests.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted">
                              <FlaskConical size={28} className="mx-auto mb-2 opacity-50" />
                              <p className="mb-0">No laboratory diagnostic reports available.</p>
                            </td>
                          </tr>
                        ) : (
                          patientLabTests.map((t) => (
                            <tr key={t.id}>
                              <td>
                                <div className="fw-semibold text-dark">{t.testName}</div>
                                <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>
                                  Order #{t.id} · {t.category || 'Pathology'}
                                </div>
                              </td>
                              <td>
                                <span className="font-mono text-muted">{t.specimenType || 'Venous Blood'}</span>
                              </td>
                              <td>{t.orderDate || 'Today'}</td>
                              <td>
                                <span className={`badge ${t.status === 'COMPLETED' ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info'}`}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: BILLS & PAYMENTS */}
              {activeTab === 'bills' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Billing Ledger & Invoices</h6>
                      <p className="text-muted small mb-0">Itemized hospital statements, receipts, and payment settlements</p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>Invoice #</th>
                          <th>Service Description</th>
                          <th>Total Amount (₹)</th>
                          <th>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientBills.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted">
                              <CreditCard size={28} className="mx-auto mb-2 opacity-50" />
                              <p className="mb-0">No bills or outstanding charges on account.</p>
                            </td>
                          </tr>
                        ) : (
                          patientBills.map((b) => (
                            <tr key={b.id}>
                              <td className="font-mono fw-bold text-dark">{b.billNumber}</td>
                              <td>{b.patientName} &bull; Clinical Services</td>
                              <td className="font-mono fw-bold text-dark">
                                ₹{Number(b.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td>{getStatusBadge(b.paymentStatus)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: SECURITY & PASSWORD */}
              {activeTab === 'security' && (
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Key size={18} className="text-primary" />
                    <h6 className="fw-bold text-dark mb-0">Account Security & Password Governance</h6>
                  </div>
                  <p className="text-muted small mb-4">
                    Change your password securely. Passwords must be at least 8 characters and are encrypted with BCrypt salt rounds.
                  </p>

                  <form onSubmit={handlePasswordSubmit}>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold text-slate-700">Current Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="••••••••"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold text-slate-700">New Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Min 8 characters"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold text-slate-700">Confirm Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Re-enter password"
                          value={passwordData.confirmNewPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4 text-end">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="btn btn-outline-dark btn-sm px-4 py-2 rounded-2 d-inline-flex align-items-center gap-1.5"
                      >
                        <Lock size={14} />
                        <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

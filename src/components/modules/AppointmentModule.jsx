import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockDataService } from '../../services/mockDataService';
import { RuleBadge } from '../common/RuleBadge';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  RotateCcw,
  UserCheck,
  History,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  CalendarCheck,
  Stethoscope
} from 'lucide-react';
import Swal from 'sweetalert2';

export const AppointmentModule = () => {
  const { currentUser, hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  // Active view tab: 'list' or 'availability'
  const [activeViewTab, setActiveViewTab] = useState('list');

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Doctors & Patients store
  const doctors = mockDataService.getDoctors();
  const patients = mockDataService.getPatients();

  // Sync with searchParams on mount
  useEffect(() => {
    const filterParam = searchParams.get('filter') || searchParams.get('status');
    if (filterParam) {
      if (filterParam.toLowerCase() === 'today') {
        setDateFilter(new Date().toISOString().split('T')[0]);
      } else if (['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(filterParam.toUpperCase())) {
        setStatusFilter(filterParam.toUpperCase());
      }
    }
  }, [searchParams]);

  // Unique departments list
  const departments = useMemo(() => {
    const list = doctors.map((d) => d.departmentName || d.specialization);
    return ['ALL', ...Array.from(new Set(list))];
  }, [doctors]);

  const [bookingDepartment, setBookingDepartment] = useState('ALL');

  const filteredBookingDoctors = useMemo(() => {
    if (bookingDepartment === 'ALL') return doctors;
    return doctors.filter(
      (d) => (d.departmentName || d.specialization) === bookingDepartment
    );
  }, [doctors, bookingDepartment]);

  // If authenticated as a PATIENT, identify their linked patient profile
  const authenticatedPatient = useMemo(() => {
    if (hasRole('PATIENT')) {
      return patients.find((p) => p.name.toLowerCase() === currentUser?.fullName?.toLowerCase() || p.id === 1) || patients[0];
    }
    return null;
  }, [currentUser, hasRole, patients]);

  // Fetch paginated appointments
  const appointmentPageData = useMemo(() => {
    const filters = {
      status: statusFilter,
      doctorId: doctorFilter !== 'ALL' ? doctorFilter : undefined,
      date: dateFilter || undefined,
      search: searchQuery || undefined,
      // If patient role, strictly isolate to their own appointments (Rule 5)
      patientId: hasRole('PATIENT') && authenticatedPatient ? authenticatedPatient.id : undefined,
    };
    return mockDataService.getAppointments(filters, currentPage, pageSize);
  }, [statusFilter, doctorFilter, dateFilter, searchQuery, currentPage, pageSize, hasRole, authenticatedPatient]);

  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const reloadData = () => setRefreshTrigger((prev) => prev + 1);

  // Modals state
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientHistoryData, setPatientHistoryData] = useState(null);

  // Booking Form state
  const [bookForm, setBookForm] = useState({
    patientId: authenticatedPatient ? String(authenticatedPatient.id) : '1',
    doctorId: '1',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    appointmentTime: '10:00:00',
    reason: '',
    notes: '',
  });

  // Reschedule Form state
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: '',
    newTime: '11:00:00',
    rescheduleReason: '',
    notes: '',
  });

  // Availability Checker State
  const [availDoctorId, setAvailDoctorId] = useState('1');
  const [availDate, setAvailDate] = useState(new Date().toISOString().split('T')[0]);
  const [availabilityResult, setAvailabilityResult] = useState(() =>
    mockDataService.checkDoctorAvailability(1, new Date().toISOString().split('T')[0])
  );

  const handleCheckAvailability = (docId, checkDate) => {
    try {
      const res = mockDataService.checkDoctorAvailability(docId, checkDate);
      setAvailabilityResult(res);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Availability Check Failed',
        text: err.message,
      });
    }
  };

  // Open Book Modal prefilled
  const openBookModal = (prefillDoctorId = null, prefillDate = null, prefillTime = null) => {
    setBookForm({
      patientId: authenticatedPatient ? String(authenticatedPatient.id) : '1',
      doctorId: prefillDoctorId ? String(prefillDoctorId) : '1',
      appointmentDate: prefillDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      appointmentTime: prefillTime || '09:30:00',
      reason: 'Clinical consultation',
      notes: '',
    });
    setShowBookModal(true);
  };

  // Submit Booking (Rule 1 & Rule 2 Enforcement)
  const handleBookSubmit = (e) => {
    e.preventDefault();
    try {
      // Rule 5: If patient, force patientId to authenticated patient
      const payload = {
        ...bookForm,
        patientId: authenticatedPatient ? authenticatedPatient.id : Number(bookForm.patientId),
        doctorId: Number(bookForm.doctorId),
      };

      const created = mockDataService.bookAppointment(payload);
      reloadData();
      setShowBookModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Appointment Booked (Status: PENDING)',
        html: `<div class="text-start">
          <p class="mb-2">Your appointment has been successfully requested!</p>
          <div class="alert alert-info py-2 small mb-0">
            <b>Doctor:</b> ${created.doctorName} (${created.departmentName})<br/>
            <b>Date & Slot:</b> ${created.appointmentDate} at ${created.appointmentTime}<br/>
            <b>Status:</b> <span class="badge bg-warning text-dark">PENDING</span> (Awaiting Confirmation)
          </div>
        </div>`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      if (err.status === 409) {
        Swal.fire({
          icon: 'error',
          title: 'HTTP 409 Conflict (SRS Rule 1)',
          text: err.message,
          confirmButtonColor: '#dc3545',
          footer: '<span class="text-muted small">Service Layer: existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn</span>',
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Failed (Rule 2)',
          text: err.message,
          confirmButtonColor: '#ffc107',
        });
      }
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (appt) => {
    setSelectedAppointment(appt);
    setRescheduleForm({
      newDate: appt.appointmentDate,
      newTime: appt.appointmentTime,
      rescheduleReason: '',
      notes: '',
    });
    setShowRescheduleModal(true);
  };

  // Submit Reschedule (Rule 6 Enforcement)
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      mockDataService.rescheduleAppointment(selectedAppointment.id, rescheduleForm);
      reloadData();
      setShowRescheduleModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Appointment Rescheduled',
        html: `Appointment rescheduled to <b>${rescheduleForm.newDate}</b> at <b>${rescheduleForm.newTime}</b>.`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      if (err.status === 409) {
        Swal.fire({
          icon: 'error',
          title: 'HTTP 409 Conflict (Rule 6)',
          text: err.message,
          confirmButtonColor: '#dc3545',
          footer: '<span class="text-muted small">Reschedule conflict check excludes current appointment ID</span>',
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Reschedule Rejected',
          text: err.message,
          confirmButtonColor: '#ffc107',
        });
      }
    }
  };

  // Confirm Appointment (PENDING -> CONFIRMED)
  const handleConfirmAppointment = (appt) => {
    if (hasRole('PATIENT')) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied (Rule 4)',
        text: 'Only clinical staff, doctors, or administrators can confirm appointments.',
      });
      return;
    }

    Swal.fire({
      title: 'Confirm Appointment?',
      text: `Confirm consultation for ${appt.patientName} with ${appt.doctorName} on ${appt.appointmentDate} at ${appt.appointmentTime}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm Slot',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0d6efd',
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          mockDataService.confirmAppointment(appt.id, 'Confirmed by clinical staff');
          reloadData();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Appointment Confirmed (CONFIRMED)',
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        }
      }
    });
  };

  // Cancel Appointment
  const handleCancelAppointment = (appt) => {
    Swal.fire({
      title: 'Cancel Appointment?',
      input: 'text',
      inputLabel: 'Reason for Cancellation',
      inputPlaceholder: 'e.g. Patient schedule conflict, symptoms resolved...',
      inputValidator: (value) => {
        if (!value) return 'Please provide a brief reason for cancellation';
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm Cancellation',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          mockDataService.cancelAppointment(appt.id, result.value);
          reloadData();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Appointment Cancelled',
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Action Failed', text: err.message });
        }
      }
    });
  };

  // Complete Appointment (Rule 3 Enforcement)
  const handleCompleteAppointment = (appt) => {
    if (hasRole('PATIENT')) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied (Rule 4)',
        text: 'Only attending doctors or clinical staff can mark consultations as completed.',
      });
      return;
    }

    // Check Rule 3 locally
    if (appt.status === 'CANCELLED') {
      Swal.fire({
        icon: 'warning',
        title: 'SRS Rule 3 Violation (HTTP 400)',
        html: `<div class="text-start">
          <p class="mb-2"><b>Cancelled Appointment Protection:</b></p>
          <div class="alert alert-warning py-2 small mb-2 font-monospace">
            Rule 3 Violation: Cancelled appointments cannot become completed. Rebooking is strictly required.
          </div>
          <p class="small text-muted mb-0">State transition from CANCELLED to COMPLETED is blocked by the domain state machine.</p>
        </div>`,
        confirmButtonColor: '#ffc107',
      });
      return;
    }

    Swal.fire({
      title: 'Complete Consultation?',
      input: 'textarea',
      inputLabel: 'Clinical Notes / Summary',
      inputPlaceholder: 'e.g. Blood pressure stabilized, renewed medication prescription...',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Mark Completed',
      confirmButtonColor: '#198754',
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          mockDataService.completeAppointment(appt.id, result.value || 'Consultation concluded successfully.');
          reloadData();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Appointment Completed',
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Failed', text: err.message });
        }
      }
    });
  };

  // Open History Modal
  const openHistoryModal = (patientId) => {
    try {
      const history = mockDataService.getPatientAppointmentHistory(patientId);
      setPatientHistoryData(history);
      setShowHistoryModal(true);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  // Quick Test 1: Conflict Detection (Double-Booking HTTP 409)
  const testDoubleBookingConflict = () => {
    try {
      mockDataService.bookAppointment({
        patientId: 2,
        doctorId: 1,
        appointmentDate: '2026-10-15',
        appointmentTime: '10:00:00',
        reason: 'Duplicate slot test collision',
        notes: 'Simulating two simultaneous patients booking slot',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'HTTP 409 Conflict Detected!',
        html: `<div class="text-start">
          <p class="mb-2"><b>SRS Rule 1 Successfully Enforced:</b></p>
          <div class="alert alert-danger py-2 small mb-2 font-monospace">${err.message}</div>
          <p class="small text-muted mb-0">The backend Spring Boot <code>existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn</code> check identified an existing active appointment and threw <code>ConflictException</code>.</p>
        </div>`,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Quick Test 2: Rescheduling Conflict (HTTP 409)
  const testRescheduleConflict = () => {
    try {
      // Attempt to reschedule appointment #2 into Dr. 1's occupied slot
      mockDataService.rescheduleAppointment(2, {
        newDate: '2026-10-15',
        newTime: '10:00:00',
        rescheduleReason: 'Collision test',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'HTTP 409 Reschedule Conflict!',
        html: `<div class="text-start">
          <p class="mb-2"><b>SRS Rule 6 Successfully Enforced:</b></p>
          <div class="alert alert-danger py-2 small mb-2 font-monospace">${err.message}</div>
          <p class="small text-muted mb-0">The query <code>exists...AndIdNot(..., excludeId: 2)</code> blocked rescheduling to an occupied slot.</p>
        </div>`,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Quick Test 3: Cancelled cannot become completed (Rule 3)
  const testCompleteCancelledRule3 = () => {
    try {
      // Appointment 4 is CANCELLED
      mockDataService.completeAppointment(4, 'Trying to complete cancelled appointment');
    } catch (err) {
      Swal.fire({
        icon: 'warning',
        title: 'SRS Rule 3 Enforced (HTTP 400)',
        html: `<div class="text-start">
          <p class="mb-2"><b>Cancelled Appointment Protection:</b></p>
          <div class="alert alert-warning py-2 small mb-2 font-monospace">${err.message}</div>
          <p class="small text-muted mb-0">Cancelled appointments cannot transition to COMPLETED. State machine violation prevented.</p>
        </div>`,
        confirmButtonColor: '#ffc107',
      });
    }
  };

  // Quick Test 4: Doctor Off-Duty Schedule Validation (Rule 2)
  const testDoctorOffDutyRule2 = () => {
    try {
      // Dr. Eleanor is available Mon-Fri. Attempt to book on Sunday (2026-10-18)
      mockDataService.bookAppointment({
        patientId: 1,
        doctorId: 1,
        appointmentDate: '2026-10-18', // Sunday
        appointmentTime: '10:00:00',
        reason: 'Weekend test',
      });
    } catch (err) {
      Swal.fire({
        icon: 'warning',
        title: 'SRS Rule 2 Validation (HTTP 400)',
        html: `<div class="text-start">
          <p class="mb-2"><b>Doctor Availability Schedule Protection:</b></p>
          <div class="alert alert-warning py-2 small mb-2 font-monospace">${err.message}</div>
          <p class="small text-muted mb-0">Verified <code>doctor.availableDays</code> schedule before booking.</p>
        </div>`,
        confirmButtonColor: '#ffc107',
      });
    }
  };

  const canBook = hasRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT');
  const canConfirm = hasRole('ADMIN', 'RECEPTIONIST', 'DOCTOR');

  return (
    <div className="container-fluid p-4 space-y-4">
      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-dark mb-0">Appointment Management</h2>
            <RuleBadge ruleNumber={1} title="Slot Conflict (409)" />
            <RuleBadge ruleNumber={2} title="Doctor Availability" />
            <RuleBadge ruleNumber={3} title="Cancelled Lock" />
            <RuleBadge ruleNumber={5} title="Patient Isolation" />
          </div>
          <p className="text-muted small mb-0">
            Clinical scheduling engine with conflict detection, physician working schedules, 4-state lifecycle machine, and HIPAA isolation.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {canBook && (
            <button
              onClick={() => openBookModal()}
              className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Book Appointment</span>
            </button>
          )}

          <button
            onClick={() => setActiveViewTab(activeViewTab === 'list' ? 'availability' : 'list')}
            className={`btn btn-sm px-3 shadow-sm d-flex align-items-center gap-1.5 ${
              activeViewTab === 'availability' ? 'btn-info text-white' : 'btn-outline-info'
            }`}
          >
            <CalendarCheck size={15} />
            <span>{activeViewTab === 'availability' ? 'Back to Appointments' : 'Check Doctor Slots'}</span>
          </button>
        </div>
      </div>

      {/* Patient Portal Notice if logged in as patient */}
      {hasRole('PATIENT') && authenticatedPatient && (
        <div className="alert alert-primary d-flex align-items-center justify-content-between p-3 border-0 shadow-sm rounded-3">
          <div className="d-flex align-items-center gap-2">
            <UserCheck className="text-primary" size={20} />
            <div>
              <span className="fw-bold">Patient Portal Active:</span> Logged in as{' '}
              <span className="badge bg-light text-primary border">{authenticatedPatient.name} ({authenticatedPatient.patientCode})</span>.
              <span className="ms-2 small text-muted">Rule 5 applies: View is strictly isolated to your own medical consultations.</span>
            </div>
          </div>
          <button
            onClick={() => openHistoryModal(authenticatedPatient.id)}
            className="btn btn-sm btn-outline-primary bg-white d-flex align-items-center gap-1"
          >
            <History size={13} /> View My History
          </button>
        </div>
      )}

      {/* Quick Test Bar for Automated SRS Verification */}
      <div className="card border-0 shadow-sm rounded-3 bg-light p-3">
        <div className="d-flex flex-wrap items-center justify-content-between gap-2">
          <div className="d-flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="fw-bold small text-dark">One-Click SRS Rule Verification Sandbox:</span>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              onClick={testDoubleBookingConflict}
              className="btn btn-outline-danger btn-sm py-1 px-2.5 font-monospace text-xs d-flex align-items-center gap-1 shadow-sm bg-white"
              title="Test SRS Rule 1: Attempt double booking"
            >
              <AlertCircle size={13} /> Rule 1: Double-Booking (409)
            </button>
            <button
              onClick={testRescheduleConflict}
              className="btn btn-outline-danger btn-sm py-1 px-2.5 font-monospace text-xs d-flex align-items-center gap-1 shadow-sm bg-white"
              title="Test SRS Rule 6: Reschedule conflict check"
            >
              <RotateCcw size={13} /> Rule 6: Reschedule Conflict (409)
            </button>
            <button
              onClick={testCompleteCancelledRule3}
              className="btn btn-outline-warning text-dark btn-sm py-1 px-2.5 font-monospace text-xs d-flex align-items-center gap-1 shadow-sm bg-white"
              title="Test SRS Rule 3: Complete cancelled appointment"
            >
              <ShieldAlert size={13} /> Rule 3: Cancelled Lock (400)
            </button>
            <button
              onClick={testDoctorOffDutyRule2}
              className="btn btn-outline-secondary btn-sm py-1 px-2.5 font-monospace text-xs d-flex align-items-center gap-1 shadow-sm bg-white"
              title="Test SRS Rule 2: Book on doctor day off"
            >
              <Clock size={13} /> Rule 2: Off-Duty Schedule (400)
            </button>
          </div>
        </div>
      </div>

      {/* VIEW TAB 1: ALL APPOINTMENTS REGISTRY & FILTERS */}
      {activeViewTab === 'list' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          {/* Filters Bar */}
          <div className="card-header bg-white border-bottom border-light-subtle p-3">
            <div className="row g-2 align-items-center">
              {/* Search */}
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <Search size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search patient, doctor, MRN, reason..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setSearchQuery('')}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(0);
                  }}
                >
                  <option value="ALL">Status: All</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Doctor Filter */}
              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={doctorFilter}
                  onChange={(e) => {
                    setDoctorFilter(e.target.value);
                    setCurrentPage(0);
                  }}
                >
                  <option value="ALL">Doctor: All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="col-6 col-md-2">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(0);
                  }}
                  title="Filter by appointment date"
                />
              </div>

              {/* Reset Filters & Refresh */}
              <div className="col-6 col-md-1 text-end">
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setDoctorFilter('ALL');
                    setDateFilter('');
                    setSearchQuery('');
                    setCurrentPage(0);
                    reloadData();
                  }}
                  className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1"
                  title="Reset all filters"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="card-body p-0 table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase">
                <tr>
                  <th style={{ width: '22%' }}>Patient Information</th>
                  <th style={{ width: '22%' }}>Attending Doctor</th>
                  <th style={{ width: '18%' }}>Consultation Slot</th>
                  <th style={{ width: '15%' }}>Clinical Reason</th>
                  <th style={{ width: '11%' }}>Status</th>
                  <th style={{ width: '12%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {appointmentPageData.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <div className="d-flex flex-col items-center justify-center space-y-2">
                        <Calendar size={32} className="text-muted opacity-50 mb-1" />
                        <p className="mb-0 fw-semibold">No appointments found matching current filters.</p>
                        <button
                          onClick={() => {
                            setStatusFilter('ALL');
                            setDoctorFilter('ALL');
                            setDateFilter('');
                            setSearchQuery('');
                          }}
                          className="btn btn-sm btn-link text-decoration-none"
                        >
                          Clear active filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointmentPageData.content.map((appt) => (
                    <tr key={appt.id}>
                      {/* Patient */}
                      <td>
                        <div className="fw-bold text-dark">{appt.patientName}</div>
                        <div className="d-flex align-items-center gap-1.5 mt-0.5">
                          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.65rem' }}>
                            {appt.patientCode}
                          </span>
                          {appt.patientPhone && (
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                              {appt.patientPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Doctor */}
                      <td>
                        <div className="fw-semibold text-dark">{appt.doctorName}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {appt.departmentName} &bull; {appt.doctorSpecialization}
                        </div>
                        {appt.consultationFee && (
                          <div className="text-success fw-medium" style={{ fontSize: '0.7rem' }}>
                            Fee: ₹{Number(appt.consultationFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Date & Slot */}
                      <td>
                        <div className="fw-medium text-dark">{appt.appointmentDate}</div>
                        <div className="text-muted font-monospace d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                          <Clock size={12} className="text-primary" /> {appt.appointmentTime}
                        </div>
                      </td>

                      {/* Clinical Reason & Notes */}
                      <td>
                        <div className="text-truncate fw-medium" style={{ maxWidth: 200 }} title={appt.reason}>
                          {appt.reason || 'General Consultation'}
                        </div>
                        {appt.notes && (
                          <div className="text-muted text-truncate small" style={{ fontSize: '0.7rem', maxWidth: 200 }} title={appt.notes}>
                            {appt.notes}
                          </div>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td>
                        {appt.status === 'PENDING' && (
                          <span className="badge bg-warning text-dark border border-warning-subtle d-inline-flex align-items-center gap-1">
                            <Clock size={11} /> PENDING
                          </span>
                        )}
                        {appt.status === 'CONFIRMED' && (
                          <span className="badge bg-primary text-white border border-primary-subtle d-inline-flex align-items-center gap-1">
                            <CheckCircle size={11} /> CONFIRMED
                          </span>
                        )}
                        {appt.status === 'COMPLETED' && (
                          <span className="badge bg-success text-white border border-success-subtle d-inline-flex align-items-center gap-1">
                            <CheckCircle size={11} /> COMPLETED
                          </span>
                        )}
                        {appt.status === 'CANCELLED' && (
                          <span className="badge bg-danger text-white border border-danger-subtle d-inline-flex align-items-center gap-1">
                            <XCircle size={11} /> CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {/* Confirm Button (Pending only) */}
                          {appt.status === 'PENDING' && canConfirm && (
                            <button
                              onClick={() => handleConfirmAppointment(appt)}
                              className="btn btn-outline-primary"
                              title="Confirm Appointment Slot"
                            >
                              <CheckCircle size={13} />
                            </button>
                          )}

                          {/* Reschedule Button (Pending or Confirmed only) */}
                          {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                            <button
                              onClick={() => openRescheduleModal(appt)}
                              className="btn btn-outline-secondary"
                              title="Reschedule Appointment"
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}

                          {/* Complete Button (Confirmed only, or staff) */}
                          {appt.status === 'CONFIRMED' && !hasRole('PATIENT') && (
                            <button
                              onClick={() => handleCompleteAppointment(appt)}
                              className="btn btn-outline-success"
                              title="Mark Consultation Completed"
                            >
                              <CheckCircle size={13} />
                            </button>
                          )}

                          {/* Cancel Button (Pending or Confirmed only) */}
                          {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                            <button
                              onClick={() => handleCancelAppointment(appt)}
                              className="btn btn-outline-danger"
                              title="Cancel Appointment"
                            >
                              <XCircle size={13} />
                            </button>
                          )}

                          {/* Patient History View */}
                          <button
                            onClick={() => openHistoryModal(appt.patientId)}
                            className="btn btn-light border text-muted"
                            title="View Patient Consultation History"
                          >
                            <History size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="card-footer bg-white border-top border-light-subtle d-flex flex-wrap align-items-center justify-content-between p-3 gap-2">
            <div className="text-muted small">
              Showing <b>{appointmentPageData.content.length}</b> of <b>{appointmentPageData.totalElements}</b> appointments
              (Page <b>{appointmentPageData.pageNumber + 1}</b> of <b>{appointmentPageData.totalPages}</b>)
            </div>

            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>

              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-secondary"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  className="btn btn-outline-secondary"
                  disabled={appointmentPageData.last}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: DOCTOR AVAILABILITY SCHEDULE & FREE SLOTS INSPECTOR */}
      {activeViewTab === 'availability' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
          <div className="d-flex flex-wrap items-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
            <div>
              <h4 className="fw-bold text-dark mb-1 d-flex items-center gap-2">
                <CalendarCheck className="text-primary" size={20} />
                Doctor Availability Schedule & Slot Inspector
              </h4>
              <p className="text-muted small mb-0">
                Inspect working days, consulting hours, occupied consultation blocks, and live bookable slots.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center">
              {/* Doctor picker */}
              <select
                className="form-select form-select-sm"
                style={{ minWidth: 220 }}
                value={availDoctorId}
                onChange={(e) => {
                  setAvailDoctorId(e.target.value);
                  handleCheckAvailability(e.target.value, availDate);
                }}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>

              {/* Date picker */}
              <input
                type="date"
                className="form-control form-control-sm"
                value={availDate}
                onChange={(e) => {
                  setAvailDate(e.target.value);
                  handleCheckAvailability(availDoctorId, e.target.value);
                }}
              />

              <button
                onClick={() => handleCheckAvailability(availDoctorId, availDate)}
                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              >
                <RefreshCw size={13} /> Check Slots
              </button>
            </div>
          </div>

          {/* Doctor Status Banner */}
          {availabilityResult && (
            <div>
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                  <div className="bg-light p-3 rounded-3 border">
                    <div className="text-muted small">Physician Info</div>
                    <div className="fw-bold text-dark">{availabilityResult.doctorName}</div>
                    <div className="small text-secondary">{availabilityResult.specialization} &bull; {availabilityResult.departmentName}</div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="bg-light p-3 rounded-3 border">
                    <div className="text-muted small">Consulting Schedule</div>
                    <div className="fw-bold text-dark">
                      {availabilityResult.isWorkingDay ? (
                        <span className="text-success d-inline-flex align-items-center gap-1">
                          <CheckCircle size={14} /> On Duty ({availabilityResult.dayOfWeek})
                        </span>
                      ) : (
                        <span className="text-danger d-inline-flex align-items-center gap-1">
                          <XCircle size={14} /> Off Duty ({availabilityResult.dayOfWeek})
                        </span>
                      )}
                    </div>
                    <div className="small text-muted font-monospace">
                      Days: {availabilityResult.doctorScheduleDays || 'All Weekdays'}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="bg-light p-3 rounded-3 border">
                    <div className="text-muted small">Slot Capacity Summary</div>
                    <div className="d-flex align-items-center gap-3 mt-1">
                      <div>
                        <span className="h5 fw-bold text-success mb-0">{availabilityResult.availableSlotsCount}</span>
                        <div className="text-muted text-xs">Available</div>
                      </div>
                      <div>
                        <span className="h5 fw-bold text-danger mb-0">{availabilityResult.bookedSlotsCount}</span>
                        <div className="text-muted text-xs">Booked</div>
                      </div>
                      <div>
                        <span className="h5 fw-bold text-secondary mb-0">{availabilityResult.totalSlots}</span>
                        <div className="text-muted text-xs">Total Slots</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot Grid */}
              <h6 className="fw-bold text-dark mb-3">Daily Consultation Time Slots ({availDate})</h6>
              <div className="row g-2">
                {availabilityResult.slots.map((slot, idx) => (
                  <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2">
                    <div
                      className={`p-2.5 rounded-3 border text-center transition-all ${
                        slot.available
                          ? 'border-success-subtle bg-success-subtle text-success-emphasis cursor-pointer hover:shadow-sm'
                          : slot.statusMessage.startsWith('Booked')
                          ? 'border-danger-subtle bg-danger-subtle text-danger-emphasis'
                          : 'border-secondary-subtle bg-light text-muted'
                      }`}
                      onClick={() => {
                        if (slot.available) {
                          openBookModal(availDoctorId, availDate, slot.slotTime);
                        }
                      }}
                      title={slot.available ? 'Click to book this slot immediately' : slot.statusMessage}
                    >
                      <div className="font-monospace fw-bold small">{slot.formattedTime}</div>
                      <div className="text-xs mt-1" style={{ fontSize: '0.68rem' }}>
                        {slot.available ? (
                          <span className="fw-semibold">&bull; Free (Book Now)</span>
                        ) : (
                          <span>&bull; {slot.statusMessage}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOOK APPOINTMENT MODAL */}
      {showBookModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Calendar size={18} /> Book Clinical Consultation
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowBookModal(false)}></button>
              </div>
              <form onSubmit={handleBookSubmit}>
                <div className="modal-body p-4 space-y-3">
                  {/* Step 1: Department Selection */}
                  <div>
                    <label className="form-label small fw-semibold text-slate-700">1. Clinical Department</label>
                    <select
                      className="form-select form-select-sm"
                      value={bookingDepartment}
                      onChange={(e) => {
                        setBookingDepartment(e.target.value);
                        const filtered = doctors.filter(
                          (d) => e.target.value === 'ALL' || (d.departmentName || d.specialization) === e.target.value
                        );
                        if (filtered.length > 0) {
                          setBookForm((prev) => ({ ...prev, doctorId: String(filtered[0].id) }));
                        }
                      }}
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept === 'ALL' ? 'All Hospital Departments' : dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Doctor Selection */}
                  <div>
                    <label className="form-label small fw-semibold text-slate-700">2. Attending Doctor *</label>
                    <select
                      className="form-select form-select-sm"
                      value={bookForm.doctorId}
                      onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}
                      required
                    >
                      {filteredBookingDoctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialization} · OPD Room: {d.roomNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3: Date & Step 4: Interactive Time Slots */}
                  <div>
                    <label className="form-label small fw-semibold text-slate-700">3. Consultation Date *</label>
                    <input
                      type="date"
                      className="form-control form-control-sm mb-3"
                      value={bookForm.appointmentDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                      required
                    />

                    <label className="form-label small fw-semibold text-slate-700 mb-1 d-flex justify-content-between">
                      <span>4. Select Time Slot *</span>
                      <span className="text-primary font-mono small">
                        Selected: {bookForm.appointmentTime?.substring(0, 5)}
                      </span>
                    </label>
                    <div className="d-flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2 mb-3">
                      {[
                        { time: '09:00:00', label: '09:00 AM' },
                        { time: '09:30:00', label: '09:30 AM' },
                        { time: '10:00:00', label: '10:00 AM' },
                        { time: '10:30:00', label: '10:30 AM' },
                        { time: '11:00:00', label: '11:00 AM' },
                        { time: '11:30:00', label: '11:30 AM' },
                        { time: '14:00:00', label: '02:00 PM' },
                        { time: '14:30:00', label: '02:30 PM' },
                        { time: '15:00:00', label: '03:00 PM' },
                        { time: '15:30:00', label: '03:30 PM' },
                        { time: '16:00:00', label: '04:00 PM' },
                        { time: '16:30:00', label: '04:30 PM' },
                      ].map((slot) => {
                        const isSelected = bookForm.appointmentTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setBookForm({ ...bookForm, appointmentTime: slot.time })}
                            className={`time-slot-btn ${isSelected ? 'selected' : ''}`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 5: Patient Selection */}
                  <div>
                    <label className="form-label small fw-semibold text-slate-700">5. Patient Record *</label>
                    {hasRole('PATIENT') && authenticatedPatient ? (
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light"
                        value={`${authenticatedPatient.name} (${authenticatedPatient.patientCode})`}
                        disabled
                      />
                    ) : (
                      <select
                        className="form-select form-select-sm"
                        value={bookForm.patientId}
                        onChange={(e) => setBookForm({ ...bookForm, patientId: e.target.value })}
                        required
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.patientCode} - {p.phone})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Clinical Reason */}
                  <div>
                    <label className="form-label small fw-semibold">Clinical Reason for Visit *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Chest discomfort, routine follow up, migraine"
                      value={bookForm.reason}
                      onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                      required
                    />
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="form-label small fw-semibold">Patient / Staff Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Optional remarks"
                      value={bookForm.notes}
                      onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowBookModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Confirm Booking Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {showRescheduleModal && selectedAppointment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <RotateCcw size={18} /> Reschedule Appointment #{selectedAppointment.id}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRescheduleModal(false)}></button>
              </div>
              <form onSubmit={handleRescheduleSubmit}>
                <div className="modal-body p-4 space-y-3">
                  <div className="alert alert-light border small py-2 mb-3">
                    <b>Patient:</b> {selectedAppointment.patientName} ({selectedAppointment.patientCode})<br />
                    <b>Doctor:</b> {selectedAppointment.doctorName}<br />
                    <b>Current Slot:</b> {selectedAppointment.appointmentDate} at {selectedAppointment.appointmentTime}
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">New Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={rescheduleForm.newDate}
                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">New Time Slot *</label>
                      <select
                        className="form-select form-select-sm font-monospace"
                        value={rescheduleForm.newTime}
                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, newTime: e.target.value })}
                        required
                      >
                        <option value="09:00:00">09:00 AM</option>
                        <option value="09:30:00">09:30 AM</option>
                        <option value="10:00:00">10:00 AM</option>
                        <option value="10:30:00">10:30 AM</option>
                        <option value="11:00:00">11:00 AM</option>
                        <option value="11:30:00">11:30 AM</option>
                        <option value="14:00:00">02:00 PM</option>
                        <option value="14:30:00">02:30 PM</option>
                        <option value="15:00:00">03:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label small fw-semibold">Reason for Rescheduling</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Patient travel, doctor emergency..."
                      value={rescheduleForm.rescheduleReason}
                      onChange={(e) => setRescheduleForm({ ...rescheduleForm, rescheduleReason: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowRescheduleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Confirm Reschedule Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT APPOINTMENT HISTORY MODAL */}
      {showHistoryModal && patientHistoryData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-indigo-700 text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <History size={18} /> Consultation History: {patientHistoryData.patientName} ({patientHistoryData.patientCode})
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowHistoryModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {/* Stats row */}
                <div className="row g-2 mb-3 text-center">
                  <div className="col-3">
                    <div className="p-2 rounded bg-light border">
                      <div className="h5 fw-bold mb-0 text-dark">{patientHistoryData.totalAppointments}</div>
                      <div className="text-muted text-xs">Total Consults</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 rounded bg-light border">
                      <div className="h5 fw-bold mb-0 text-primary">{patientHistoryData.upcomingAppointments}</div>
                      <div className="text-muted text-xs">Upcoming</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 rounded bg-light border">
                      <div className="h5 fw-bold mb-0 text-success">{patientHistoryData.completedAppointments}</div>
                      <div className="text-muted text-xs">Completed</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 rounded bg-light border">
                      <div className="h5 fw-bold mb-0 text-danger">{patientHistoryData.cancelledAppointments}</div>
                      <div className="text-muted text-xs">Cancelled</div>
                    </div>
                  </div>
                </div>

                {/* History list */}
                <div className="table-responsive max-h-72">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>Date & Time</th>
                        <th>Physician</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {patientHistoryData.history.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-3">
                            No past appointments recorded.
                          </td>
                        </tr>
                      ) : (
                        patientHistoryData.history.map((h) => (
                          <tr key={h.id}>
                            <td>
                              <div className="fw-semibold">{h.appointmentDate}</div>
                              <div className="text-muted font-monospace">{h.appointmentTime}</div>
                            </td>
                            <td>{h.doctorName}</td>
                            <td>{h.reason}</td>
                            <td>
                              <span className={`badge ${
                                h.status === 'CONFIRMED' ? 'bg-primary' :
                                h.status === 'COMPLETED' ? 'bg-success' :
                                h.status === 'CANCELLED' ? 'bg-danger' : 'bg-warning text-dark'
                              }`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-light p-3">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowHistoryModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

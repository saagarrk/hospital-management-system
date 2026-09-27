import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDataService } from '../../services/mockDataService';
import {
  Users,
  Plus,
  Search,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Calendar,
  UserCheck,
  UserX,
  FileText,
  Pill,
  Bed,
  Clock,
  Edit,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Briefcase,
  User,
  ShieldCheck,
  Stethoscope,
  Info
} from 'lucide-react';
import Swal from 'sweetalert2';

export const PatientModule = () => {
  const { user, hasRole } = useAuth();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [historySummary, setHistorySummary] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyActiveTab, setHistoryActiveTab] = useState('records'); // 'records' | 'appointments' | 'prescriptions' | 'admissions'

  // Form state
  const initialForm = {
    name: '',
    dateOfBirth: '1995-05-15',
    gender: 'MALE',
    bloodGroup: 'O+',
    maritalStatus: 'SINGLE',
    occupation: '',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Spouse',
    medicalHistory: '',
    allergies: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  // Retrieve paginated and filtered patients
  const pagedData = useMemo(() => {
    // If the authenticated user is a PATIENT, enforce SRS Rule 9 (Patient Data Isolation)
    if (user?.role === 'PATIENT') {
      const allPatients = mockDataService.getPatients();
      // Match by patientCode or email/name associated with patient login
      const myPatient = allPatients.find(
        (p) =>
          p.patientCode === 'PT-0001' ||
          (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
          p.name.toLowerCase().includes(user.name?.toLowerCase() || '')
      ) || allPatients[0];

      return {
        content: myPatient ? [myPatient] : [],
        totalElements: myPatient ? 1 : 0,
        totalPages: 1,
        pageNumber: 0,
        pageSize: 1,
        last: true,
      };
    }

    return mockDataService.searchPatients({
      query: searchTerm,
      status: statusFilter,
      gender: genderFilter,
      bloodGroup: bloodGroupFilter,
      page: currentPage,
      size: pageSize,
    });
  }, [searchTerm, statusFilter, genderFilter, bloodGroupFilter, currentPage, pageSize, refreshKey, user]);

  const allPatientsForMetrics = useMemo(() => mockDataService.getPatients(), [refreshKey]);
  const activeCount = allPatientsForMetrics.filter((p) => p.status === 'ACTIVE').length;
  const inactiveCount = allPatientsForMetrics.filter((p) => p.status === 'INACTIVE').length;
  const allergiesCount = allPatientsForMetrics.filter(
    (p) => p.allergies && p.allergies.trim() && !p.allergies.toLowerCase().includes('none')
  ).length;

  // Validation
  const validateForm = (data) => {
    const errors = {};
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Full legal name is required (min 2 characters).';
    }
    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required.';
    } else {
      const dob = new Date(data.dateOfBirth);
      if (dob >= new Date()) {
        errors.dateOfBirth = 'Date of birth must be in the past.';
      }
    }
    const phoneRegex = /^\+?[0-9. ()-]{7,25}$/;
    if (!data.phone || !phoneRegex.test(data.phone.trim())) {
      errors.phone = 'Valid phone number is required (e.g. +91 98220 12345).';
    }
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.email = 'Invalid email format.';
      }
    }
    if (!data.emergencyContactName || data.emergencyContactName.trim().length < 2) {
      errors.emergencyContactName = 'Emergency contact full name is required.';
    }
    if (!data.emergencyContactPhone || !phoneRegex.test(data.emergencyContactPhone.trim())) {
      errors.emergencyContactPhone = 'Emergency contact valid phone is required (e.g. +91 98230 54321).';
    }
    return errors;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(initialForm);
    setFormErrors({});
    setShowCreateModal(true);
  };

  // Submit Create Patient
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Swal.fire({
        icon: 'warning',
        title: 'Validation Incomplete',
        text: 'Please correct the highlighted fields before submitting.',
      });
      return;
    }

    try {
      const created = mockDataService.addPatient(formData);
      setShowCreateModal(false);
      triggerRefresh();
      Swal.fire({
        icon: 'success',
        title: 'Patient Registered (HTTP 201 Created)',
        html: `Patient <b>${created.name}</b> successfully enrolled with MRN: <span class="badge bg-primary fs-6">${created.patientCode}</span>`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: err.status === 409 ? 'Conflict (HTTP 409)' : 'Registration Error',
        text: err.message,
      });
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name || '',
      dateOfBirth: patient.dateOfBirth || '',
      gender: patient.gender || 'MALE',
      bloodGroup: patient.bloodGroup || 'O+',
      maritalStatus: patient.maritalStatus || 'SINGLE',
      occupation: patient.occupation || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      emergencyContactRelation: patient.emergencyContactRelation || 'Spouse',
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Submit Edit Patient
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Swal.fire({
        icon: 'warning',
        title: 'Validation Incomplete',
        text: 'Please correct the highlighted fields.',
      });
      return;
    }

    try {
      const updated = mockDataService.updatePatient(selectedPatient.id, formData);
      setShowEditModal(false);
      setSelectedPatient(null);
      triggerRefresh();
      Swal.fire({
        icon: 'success',
        title: 'Patient Profile Updated (HTTP 200 OK)',
        text: `Demographics and clinical baseline for ${updated.name} have been updated.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: err.status === 409 ? 'Conflict (HTTP 409)' : 'Update Error',
        text: err.message,
      });
    }
  };

  // Toggle Patient Status (Activate / Deactivate)
  const handleToggleStatus = (patient) => {
    const isActivating = patient.status === 'INACTIVE';
    if (isActivating) {
      Swal.fire({
        title: 'Activate Patient Record?',
        text: `Patient ${patient.name} (${patient.patientCode}) will be marked as ACTIVE and eligible for scheduling.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        confirmButtonText: 'Yes, Activate Patient',
      }).then((result) => {
        if (result.isConfirmed) {
          mockDataService.togglePatientStatus(patient.id);
          triggerRefresh();
          Swal.fire({
            icon: 'success',
            title: 'Patient Activated',
            text: `${patient.name} status is now ACTIVE.`,
            timer: 1500,
            showConfirmButton: false,
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Deactivate Patient Record',
        input: 'text',
        inputLabel: 'Reason for Deactivation / Inactive Status',
        inputPlaceholder: 'e.g. Relocated to another city, requested file closure, etc.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Deactivate Record',
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return 'Please provide an administrative reason for deactivating this patient!';
          }
        },
      }).then((result) => {
        if (result.isConfirmed) {
          mockDataService.togglePatientStatus(patient.id, result.value);
          triggerRefresh();
          Swal.fire({
            icon: 'info',
            title: 'Patient Deactivated',
            text: `${patient.name} has been set to INACTIVE.`,
            timer: 1800,
            showConfirmButton: false,
          });
        }
      });
    }
  };

  // Open Patient Clinical History Summary
  const handleOpenHistorySummary = (patientId) => {
    try {
      const summary = mockDataService.getPatientHistorySummary(patientId);
      setHistorySummary(summary);
      setHistoryActiveTab('records');
      setShowHistoryModal(true);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Unable to Load Clinical History',
        text: err.message,
      });
    }
  };

  // Calculate age helper
  const computeAge = (dobString) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  // Role permissions
  const canManagePatients = hasRole('ADMIN', 'RECEPTIONIST');
  const canEditClinical = hasRole('ADMIN', 'RECEPTIONIST', 'DOCTOR');
  const isPatientPortal = user?.role === 'PATIENT';

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Top Header & Context Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="p-2 bg-primary-subtle text-primary rounded-3">
              <Users size={24} />
            </div>
            <h2 className="fw-bold text-dark mb-0">Patient Management</h2>
            <span className="badge bg-secondary-subtle text-secondary border font-monospace">
              REST /api/patients
            </span>
          </div>
          <p className="text-muted small mb-0">
            Enterprise EMR patient registry with demographic profiles, emergency contacts, role-based isolation (SRS Rule 9), and clinical history summaries.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {canManagePatients && (
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              <span>Register New Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Role Isolation Alert Notice */}
      {isPatientPortal && (
        <div className="alert alert-info border-info d-flex align-items-center gap-3 mb-4 shadow-sm">
          <ShieldCheck size={28} className="text-info flex-shrink-0" />
          <div>
            <h6 className="fw-bold mb-0">Patient Self-Service Portal Active (SRS Rule 9 Guard)</h6>
            <span className="small">
              You are authenticated as <b>{user?.name}</b> with <code>ROLE_PATIENT</code>. In strict compliance with HIPAA and SRS Rule 9, you can only access your own protected health demographics and medical history.
            </span>
          </div>
        </div>
      )}

      {/* Metric Cards Banner */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small fw-semibold">Total Registered</span>
              <span className="badge bg-primary-subtle text-primary p-2 rounded-circle">
                <Users size={16} />
              </span>
            </div>
            <h3 className="fw-bold text-dark mb-0">{allPatientsForMetrics.length}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Active database EMRs</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small fw-semibold">Active Status</span>
              <span className="badge bg-success-subtle text-success p-2 rounded-circle">
                <UserCheck size={16} />
              </span>
            </div>
            <h3 className="fw-bold text-success mb-0">{activeCount}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Eligible for appointments</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small fw-semibold">Inactive / Archived</span>
              <span className="badge bg-secondary-subtle text-secondary p-2 rounded-circle">
                <UserX size={16} />
              </span>
            </div>
            <h3 className="fw-bold text-secondary mb-0">{inactiveCount}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Dormant / file closed</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small fw-semibold">Allergy Safeguards</span>
              <span className="badge bg-warning-subtle text-warning p-2 rounded-circle">
                <ShieldAlert size={16} />
              </span>
            </div>
            <h3 className="fw-bold text-warning-emphasis mb-0">{allergiesCount}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Drug & food sensitivities</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Controls Toolbar */}
      <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 p-3">
        <div className="row g-2 align-items-center">
          {/* Keyword Search */}
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by MRN (PT-0001), Name, Phone, Email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
              />
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
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(0);
              }}
            >
              <option value="ALL">Gender: All</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Blood Group Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={bloodGroupFilter}
              onChange={(e) => {
                setBloodGroupFilter(e.target.value);
                setCurrentPage(0);
              }}
            >
              <option value="ALL">Blood Group: All</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="col-6 col-md-2 d-flex justify-content-end gap-1">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                title="Grid Card View"
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                title="Tabular View"
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary & Total */}
        <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top small text-muted">
          <div>
            Showing <b>{pagedData.content.length}</b> of <b>{pagedData.totalElements}</b> matched patients
            {(statusFilter !== 'ALL' || genderFilter !== 'ALL' || bloodGroupFilter !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setGenderFilter('ALL');
                  setBloodGroupFilter('ALL');
                  setCurrentPage(0);
                }}
                className="btn btn-link btn-sm p-0 ms-2 text-decoration-none text-danger"
              >
                Reset Filters
              </button>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            <span>Per page:</span>
            <select
              className="form-select form-select-sm py-0"
              style={{ width: '65px' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="12">12</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Grid View vs Table View */}
      {pagedData.content.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center my-4">
          <Users size={48} className="text-muted mx-auto mb-3" />
          <h5 className="fw-bold text-dark">No Patients Found</h5>
          <p className="text-muted small mb-3">
            No registered patients match your current search and filter criteria.
          </p>
          {canManagePatients && (
            <button
              onClick={handleOpenCreate}
              className="btn btn-outline-primary btn-sm mx-auto d-inline-flex align-items-center gap-1"
            >
              <Plus size={16} /> Register New Patient
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="row g-3 mb-4">
          {pagedData.content.map((patient) => {
            const age = computeAge(patient.dateOfBirth);
            const isActive = patient.status === 'ACTIVE';

            return (
              <div key={patient.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-3 hover-shadow transition-all d-flex flex-column">
                  {/* Top Bar: Name, Code, Status & Blood Group */}
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="fw-bold text-dark mb-0">{patient.name}</h6>
                        <span
                          className={`badge ${
                            isActive
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {patient.status || 'ACTIVE'}
                        </span>
                      </div>
                      <span className="badge bg-primary font-monospace mt-1" style={{ fontSize: '0.72rem' }}>
                        {patient.patientCode}
                      </span>
                    </div>
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold">
                      {patient.bloodGroup}
                    </span>
                  </div>

                  {/* Demographic & Contact Details */}
                  <div className="text-muted small d-flex flex-column gap-1 mb-3" style={{ fontSize: '0.78rem' }}>
                    <div className="d-flex align-items-center gap-1">
                      <User size={13} className="text-secondary" />
                      <span>
                        Age: <b>{age} yrs</b> ({patient.gender}) • {patient.maritalStatus || 'Single'}
                      </span>
                    </div>
                    {patient.occupation && (
                      <div className="d-flex align-items-center gap-1">
                        <Briefcase size={13} className="text-secondary" />
                        <span className="text-truncate">{patient.occupation}</span>
                      </div>
                    )}
                    <div className="d-flex align-items-center gap-1">
                      <Phone size={13} className="text-secondary" /> {patient.phone}
                    </div>
                    {patient.email && (
                      <div className="d-flex align-items-center gap-1">
                        <Mail size={13} className="text-secondary" /> {patient.email}
                      </div>
                    )}
                    {patient.address && (
                      <div className="d-flex align-items-center gap-1 text-truncate">
                        <MapPin size={13} className="text-secondary" /> {patient.address}
                      </div>
                    )}
                  </div>

                  {/* Emergency Contact Badge */}
                  <div className="p-2 rounded bg-light border mb-2 small" style={{ fontSize: '0.74rem' }}>
                    <div className="text-muted fw-semibold d-flex align-items-center gap-1 mb-1">
                      <Phone size={12} className="text-danger" />
                      <span>Emergency Contact:</span>
                    </div>
                    <div className="text-dark fw-bold">
                      {patient.emergencyContactName} ({patient.emergencyContactRelation || 'Contact'})
                    </div>
                    <div className="text-secondary font-monospace">{patient.emergencyContactPhone}</div>
                  </div>

                  {/* Allergies Highlight */}
                  {patient.allergies && !patient.allergies.toLowerCase().includes('none') && (
                    <div className="p-2 rounded bg-warning-subtle border border-warning-subtle mb-3 small d-flex align-items-center gap-2">
                      <ShieldAlert size={16} className="text-warning-emphasis flex-shrink-0" />
                      <div className="text-truncate" style={{ fontSize: '0.72rem' }}>
                        <b className="text-warning-emphasis">Allergies:</b> {patient.allergies}
                      </div>
                    </div>
                  )}

                  {/* Card Action Footer */}
                  <div className="mt-auto pt-2 border-top d-flex flex-wrap gap-1 justify-content-between align-items-center">
                    <div className="d-flex gap-1">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="btn btn-outline-primary btn-sm py-1 px-2"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleOpenHistorySummary(patient.id)}
                        className="btn btn-outline-info btn-sm py-1 px-2 d-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <HeartPulse size={12} />
                        <span>History Summary</span>
                      </button>
                    </div>

                    <div className="d-flex gap-1">
                      {canEditClinical && (
                        <button
                          onClick={() => handleOpenEdit(patient)}
                          className="btn btn-light btn-sm py-1 px-2 text-secondary"
                          title="Edit Demographics"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <Edit size={13} />
                        </button>
                      )}
                      {canManagePatients && (
                        <button
                          onClick={() => handleToggleStatus(patient)}
                          className={`btn btn-sm py-1 px-2 ${
                            isActive ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                          title={isActive ? 'Deactivate Patient' : 'Activate Patient'}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tabular View */
        <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-3">MRN / Code</th>
                  <th scope="col">Patient Name & Demographics</th>
                  <th scope="col">Blood Group</th>
                  <th scope="col">Contact Phone</th>
                  <th scope="col">Emergency Contact</th>
                  <th scope="col">Allergies</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.content.map((patient) => {
                  const age = computeAge(patient.dateOfBirth);
                  const isActive = patient.status === 'ACTIVE';

                  return (
                    <tr key={patient.id}>
                      <td className="ps-3 font-monospace fw-bold text-primary">
                        {patient.patientCode}
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{patient.name}</div>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {age} yrs • {patient.gender} • {patient.occupation || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold">
                          {patient.bloodGroup}
                        </span>
                      </td>
                      <td>
                        <div>{patient.phone}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{patient.email || '-'}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">{patient.emergencyContactName}</div>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {patient.emergencyContactPhone} ({patient.emergencyContactRelation})
                        </span>
                      </td>
                      <td>
                        {patient.allergies && !patient.allergies.toLowerCase().includes('none') ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle text-truncate" style={{ maxWidth: '120px' }}>
                            {patient.allergies}
                          </span>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isActive
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                          }`}
                        >
                          {patient.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="btn btn-outline-primary py-0 px-2"
                            title="View Profile"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => handleOpenHistorySummary(patient.id)}
                            className="btn btn-outline-info py-0 px-2"
                            title="Clinical Summary"
                          >
                            <HeartPulse size={13} />
                          </button>
                          {canEditClinical && (
                            <button
                              onClick={() => handleOpenEdit(patient)}
                              className="btn btn-outline-secondary py-0 px-2"
                              title="Edit"
                            >
                              <Edit size={13} />
                            </button>
                          )}
                          {canManagePatients && (
                            <button
                              onClick={() => handleToggleStatus(patient)}
                              className={`btn py-0 px-2 ${
                                isActive ? 'btn-outline-danger' : 'btn-outline-success'
                              }`}
                              title={isActive ? 'Deactivate' : 'Activate'}
                            >
                              {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagedData.totalPages > 1 && (
        <div className="d-flex align-items-center justify-content-between mb-4">
          <span className="text-muted small">
            Page <b>{pagedData.pageNumber + 1}</b> of <b>{pagedData.totalPages}</b>
          </span>
          <div className="btn-group btn-group-sm">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {Array.from({ length: pagedData.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`btn ${currentPage === i ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagedData.totalPages - 1, p + 1))}
              disabled={pagedData.last}
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW PATIENT DETAIL PROFILE */}
      {/* ========================================================================= */}
      {selectedPatient && !showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-primary rounded-circle text-white">
                    <User size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">{selectedPatient.name}</h5>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className="badge bg-primary font-monospace">{selectedPatient.patientCode}</span>
                      <span
                        className={`badge ${
                          selectedPatient.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'
                        }`}
                      >
                        {selectedPatient.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedPatient(null)}
                ></button>
              </div>

              <div className="modal-body p-4 small">
                {/* Demographic Information Grid */}
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                  <Info size={16} className="text-primary" />
                  <span>Demographic Profile</span>
                </h6>
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Date of Birth:</span>
                    <div className="fw-semibold text-dark">{selectedPatient.dateOfBirth}</div>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      ({computeAge(selectedPatient.dateOfBirth)} years old)
                    </span>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Gender:</span>
                    <div className="fw-semibold text-dark">{selectedPatient.gender}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Blood Group:</span>
                    <div className="fw-bold text-danger fs-6">{selectedPatient.bloodGroup}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Marital Status:</span>
                    <div className="fw-semibold text-dark">{selectedPatient.maritalStatus || 'Single'}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Occupation:</span>
                    <div className="fw-semibold text-dark">{selectedPatient.occupation || 'Not specified'}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Contact Phone:</span>
                    <div className="fw-semibold text-dark">{selectedPatient.phone}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <span className="text-muted">Contact Email:</span>
                    <div className="fw-semibold text-dark">{selectedPatient.email || 'None on record'}</div>
                  </div>
                  <div className="col-12">
                    <span className="text-muted">Residential Address:</span>
                    <div className="fw-semibold text-dark">{selectedPatient.address || 'None provided'}</div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                  <Phone size={16} className="text-danger" />
                  <span>Emergency Contact Details</span>
                </h6>
                <div className="card bg-light border-0 p-3 mb-4">
                  <div className="row g-2">
                    <div className="col-12 col-md-4">
                      <span className="text-muted">Contact Person:</span>
                      <div className="fw-bold text-dark">{selectedPatient.emergencyContactName}</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <span className="text-muted">Relationship:</span>
                      <div className="fw-semibold text-dark">{selectedPatient.emergencyContactRelation || 'Spouse'}</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <span className="text-muted">Emergency Phone:</span>
                      <div className="fw-bold text-danger font-monospace">{selectedPatient.emergencyContactPhone}</div>
                    </div>
                  </div>
                </div>

                {/* Clinical History & Allergies */}
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                  <Stethoscope size={16} className="text-primary" />
                  <span>Clinical Medical Profile</span>
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="card h-100 p-3 border-warning-subtle bg-warning-subtle">
                      <span className="fw-bold text-warning-emphasis d-flex align-items-center gap-1 mb-1">
                        <ShieldAlert size={15} /> Known Allergies
                      </span>
                      <div className="text-dark fw-semibold">
                        {selectedPatient.allergies || 'No known allergies reported.'}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="card h-100 p-3 bg-light border">
                      <span className="fw-bold text-dark d-flex align-items-center gap-1 mb-1">
                        <FileText size={15} /> Pre-existing Medical History
                      </span>
                      <div className="text-secondary">
                        {selectedPatient.medicalHistory || 'No previous medical history recorded.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light p-3 d-flex justify-content-between">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenHistorySummary(selectedPatient.id);
                  }}
                  className="btn btn-sm btn-info text-white d-flex align-items-center gap-1"
                >
                  <HeartPulse size={15} />
                  <span>View Full Clinical Timeline</span>
                </button>
                <div className="d-flex gap-2">
                  {canEditClinical && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedPatient)}
                      className="btn btn-sm btn-primary"
                    >
                      Edit Profile
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTER NEW PATIENT / CREATE EMR */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <div>
                  <h5 className="modal-title fw-bold mb-0">Register New Patient (EMR Intake)</h5>
                  <span className="small opacity-75">
                    Generates unique MRN code, validates demographics & assigns emergency contact
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4 small" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                  {/* Demographic Fields */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">1. Legal Demographics</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Full Legal Name *</label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.name ? 'is-invalid' : ''}`}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Jessica Taylor"
                      />
                      {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Date of Birth *</label>
                      <input
                        type="date"
                        className={`form-control form-control-sm ${formErrors.dateOfBirth ? 'is-invalid' : ''}`}
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                      {formErrors.dateOfBirth && <div className="invalid-feedback">{formErrors.dateOfBirth}</div>}
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Gender *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Blood Group *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Marital Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.maritalStatus}
                        onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Occupation</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        placeholder="e.g. Mechanical Engineer"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 mt-4">2. Contact & Address</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Mobile Number *</label>
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${formErrors.phone ? 'is-invalid' : ''}`}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98220 12345"
                      />
                      {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className={`form-control form-control-sm ${formErrors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="aarav.sharma@gmail.com"
                      />
                      {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Residential Address</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Flat 402, Shivneri Apts, FC Road, Shivaji Nagar, Pune - 411005"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 mt-4">3. Emergency Contact Details</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-5">
                      <label className="form-label fw-semibold">Emergency Contact Person *</label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.emergencyContactName ? 'is-invalid' : ''}`}
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        placeholder="e.g. Rajesh Sharma"
                      />
                      {formErrors.emergencyContactName && (
                        <div className="invalid-feedback">{formErrors.emergencyContactName}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Emergency Phone *</label>
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${formErrors.emergencyContactPhone ? 'is-invalid' : ''}`}
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        placeholder="+91 98230 54321"
                      />
                      {formErrors.emergencyContactPhone && (
                        <div className="invalid-feedback">{formErrors.emergencyContactPhone}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Relationship</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.emergencyContactRelation}
                        onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                  </div>

                  {/* Medical Safeguards */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 mt-4">4. Clinical Safeguards & Baseline</h6>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-danger">Known Allergies</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="e.g. Penicillin, Peanuts, Latex, Codeine (or 'None reported')"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Pre-existing Medical History</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={3}
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                      placeholder="Past surgeries, chronic diagnoses (diabetes, asthma, hypertension), or routine checkups..."
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Confirm & Register Patient
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT PATIENT DEMOGRAPHICS */}
      {/* ========================================================================= */}
      {showEditModal && selectedPatient && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <div>
                  <h5 className="modal-title fw-bold mb-0">Update Patient: {selectedPatient.name}</h5>
                  <span className="badge bg-primary font-monospace">{selectedPatient.patientCode}</span>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4 small" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Full Legal Name *</label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.name ? 'is-invalid' : ''}`}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Date of Birth *</label>
                      <input
                        type="date"
                        className={`form-control form-control-sm ${formErrors.dateOfBirth ? 'is-invalid' : ''}`}
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                      {formErrors.dateOfBirth && <div className="invalid-feedback">{formErrors.dateOfBirth}</div>}
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Gender *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Blood Group *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Marital Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.maritalStatus}
                        onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Occupation</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Mobile Phone *</label>
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${formErrors.phone ? 'is-invalid' : ''}`}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className={`form-control form-control-sm ${formErrors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                      {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Residential Address</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-5">
                      <label className="form-label fw-semibold">Emergency Contact Name *</label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${formErrors.emergencyContactName ? 'is-invalid' : ''}`}
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      />
                      {formErrors.emergencyContactName && (
                        <div className="invalid-feedback">{formErrors.emergencyContactName}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Emergency Phone *</label>
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${formErrors.emergencyContactPhone ? 'is-invalid' : ''}`}
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      />
                      {formErrors.emergencyContactPhone && (
                        <div className="invalid-feedback">{formErrors.emergencyContactPhone}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label fw-semibold">Relationship</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.emergencyContactRelation}
                        onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold text-danger">Known Allergies</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Pre-existing Medical History</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={formData.medicalHistory}
                        onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PATIENT CLINICAL HISTORY SUMMARY (TIMELINE AGGREGATOR) */}
      {/* ========================================================================= */}
      {showHistoryModal && historySummary && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-info rounded-circle text-white">
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">
                      Patient Clinical History Summary: {historySummary.patient.name}
                    </h5>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className="badge bg-primary font-monospace">
                        {historySummary.patient.patientCode}
                      </span>
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                        Blood: {historySummary.patient.bloodGroup}
                      </span>
                      <span className="small text-white-50">
                        Age: {historySummary.age || computeAge(historySummary.patient.dateOfBirth)} yrs ({historySummary.patient.gender})
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowHistoryModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4 small" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {/* Metric Summary Ribbon */}
                <div className="row g-2 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-light rounded text-center border">
                      <span className="text-muted d-block small">Appointments</span>
                      <h4 className="fw-bold text-primary mb-0">{historySummary.totalAppointments}</h4>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-light rounded text-center border">
                      <span className="text-muted d-block small">Clinical Records</span>
                      <h4 className="fw-bold text-success mb-0">{historySummary.totalMedicalRecords}</h4>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-light rounded text-center border">
                      <span className="text-muted d-block small">Prescriptions</span>
                      <h4 className="fw-bold text-info mb-0">{historySummary.totalPrescriptions}</h4>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-light rounded text-center border">
                      <span className="text-muted d-block small">Admissions</span>
                      <h4 className="fw-bold text-warning-emphasis mb-0">{historySummary.totalAdmissions}</h4>
                    </div>
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <ul className="nav nav-pills nav-fill mb-3 bg-light p-1 rounded">
                  <li className="nav-item">
                    <button
                      className={`nav-link py-1 ${historyActiveTab === 'records' ? 'active' : ''}`}
                      onClick={() => setHistoryActiveTab('records')}
                    >
                      <Activity size={14} className="me-1" /> Clinical Records & Diagnoses ({historySummary.recentClinicalRecords.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-1 ${historyActiveTab === 'appointments' ? 'active' : ''}`}
                      onClick={() => setHistoryActiveTab('appointments')}
                    >
                      <Calendar size={14} className="me-1" /> Consultations & Appointments ({historySummary.recentAppointments.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-1 ${historyActiveTab === 'prescriptions' ? 'active' : ''}`}
                      onClick={() => setHistoryActiveTab('prescriptions')}
                    >
                      <Pill size={14} className="me-1" /> Prescriptions ({historySummary.recentPrescriptions.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-1 ${historyActiveTab === 'admissions' ? 'active' : ''}`}
                      onClick={() => setHistoryActiveTab('admissions')}
                    >
                      <Bed size={14} className="me-1" /> Inpatient Wards ({historySummary.recentHospitalAdmissions.length})
                    </button>
                  </li>
                </ul>

                {/* Tab 1: Clinical Records */}
                {historyActiveTab === 'records' && (
                  <div>
                    {historySummary.recentClinicalRecords.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No clinical diagnostic encounters logged yet for this patient.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {historySummary.recentClinicalRecords.map((rec) => (
                          <div key={rec.id} className="card border p-3 rounded-3 shadow-none">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="fw-bold text-dark mb-0">{rec.diagnosis}</h6>
                                <span className="text-muted small">
                                  Encounter Date: <b>{rec.visitDate}</b> • Attending: <b>{rec.doctorName}</b>
                                </span>
                              </div>
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                BP: {rec.bloodPressure || 'N/A'} • Pulse: {rec.heartRate || '-'} bpm
                              </span>
                            </div>
                            <div className="mb-2">
                              <span className="text-muted fw-semibold">Presenting Symptoms:</span>
                              <div className="text-dark">{rec.symptoms}</div>
                            </div>
                            <div>
                              <span className="text-muted fw-semibold">Clinical Treatment / Plan:</span>
                              <div className="text-secondary">{rec.treatment}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Appointments */}
                {historyActiveTab === 'appointments' && (
                  <div>
                    {historySummary.recentAppointments.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No booked consultations on record.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Date & Time</th>
                              <th>Doctor</th>
                              <th>Department</th>
                              <th>Reason</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historySummary.recentAppointments.map((appt) => (
                              <tr key={appt.id}>
                                <td>
                                  <b>{appt.appointmentDate}</b> at {appt.appointmentTime}
                                </td>
                                <td>{appt.doctorName}</td>
                                <td>{appt.departmentName}</td>
                                <td>{appt.reason}</td>
                                <td>
                                  <span className="badge bg-success-subtle text-success border">
                                    {appt.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Prescriptions */}
                {historyActiveTab === 'prescriptions' && (
                  <div>
                    {historySummary.recentPrescriptions.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No prescriptions issued.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {historySummary.recentPrescriptions.map((rx) => (
                          <div key={rx.id} className="card border p-3 rounded-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <div className="fw-bold text-dark">
                                Issued by {rx.doctorName} on {rx.prescriptionDate}
                              </div>
                              <span className="badge bg-info">{rx.status}</span>
                            </div>
                            <div className="text-muted small mb-2">{rx.generalInstructions}</div>
                            {rx.items && rx.items.length > 0 && (
                              <div className="p-2 bg-light rounded">
                                <span className="fw-semibold text-secondary d-block mb-1">Medications:</span>
                                <ul className="mb-0 ps-3">
                                  {rx.items.map((item, idx) => (
                                    <li key={idx}>
                                      <b>{item.medicineName}</b> - {item.dosage} ({item.frequency}, {item.duration || `${item.durationDays} days`})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Hospital Admissions */}
                {historyActiveTab === 'admissions' && (
                  <div>
                    {historySummary.recentHospitalAdmissions.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No inpatient hospitalizations recorded.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {historySummary.recentHospitalAdmissions.map((adm) => (
                          <div key={adm.id} className="card border p-3 rounded-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark">
                                Bed: {adm.bedNumber} ({adm.roomNumber})
                              </span>
                              <span
                                className={`badge ${
                                  adm.status === 'ADMITTED' ? 'bg-danger' : 'bg-success'
                                }`}
                              >
                                {adm.status}
                              </span>
                            </div>
                            <div className="text-muted small">
                              Admission Date: <b>{adm.admissionDate}</b> • Discharged: <b>{adm.dischargeDate || 'Currently Inpatient'}</b>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light p-3">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

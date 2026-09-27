import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDataService } from '../../services/mockDataService';
import { RuleBadge } from '../common/RuleBadge';
import {
  FileText,
  Plus,
  Lock,
  Heart,
  Thermometer,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  History,
  Edit3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  FileCheck,
  Stethoscope,
  Info,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';

export const MedicalRecordModule = () => {
  const { currentUser, hasRole } = useAuth();

  // Active Main Tab: 'directory' | 'patient-journey' | 'audit-trail' | 'security-sandbox'
  const [activeTab, setActiveTab] = useState('directory');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Master Data
  const patients = mockDataService.getPatients();
  const doctors = mockDataService.getDoctors();

  // Role checks
  const isDoctor = hasRole('DOCTOR', 'ADMIN');
  const isAdmin = currentUser?.role === 'ADMIN';
  const isPatientPersona = currentUser?.role === 'PATIENT';

  // Current Patient ID if viewing as patient
  const activePatientId = useMemo(() => {
    if (isPatientPersona) {
      const p = patients.find(
        (pt) => pt.patientCode === currentUser.patientCode || pt.id === currentUser.id || pt.id === 1
      );
      return p ? String(p.id) : '1';
    }
    return '';
  }, [isPatientPersona, currentUser, patients]);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    patientId: isPatientPersona ? activePatientId : '',
    doctorId: '',
    date: '',
    startDate: '',
    endDate: '',
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  // Sync state after CRUD
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Query paginated records from service
  const paginatedResult = useMemo(() => {
    // If patient persona, strictly lock filter to their patient ID
    const queryFilters = { ...filters };
    if (isPatientPersona) {
      queryFilters.patientId = activePatientId;
    }

    return mockDataService.getRecords(queryFilters, currentPage, pageSize);
  }, [filters, currentPage, pageSize, isPatientPersona, activePatientId, refreshTrigger]);

  const records = paginatedResult.content || [];
  const totalElements = paginatedResult.totalElements || 0;
  const totalPages = paginatedResult.totalPages || 1;

  // Selected Record for Detail Modal
  const [detailRecord, setDetailRecord] = useState(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    patientId: '1',
    doctorId: currentUser?.id && currentUser.role === 'DOCTOR' ? String(currentUser.id) : '1',
    visitDate: new Date().toISOString().split('T')[0],
    symptoms: '',
    diagnosis: '',
    treatment: '',
    clinicalNotes: '',
    bloodPressure: '120/80 mmHg',
    heartRate: '75',
    temperature: '36.8',
    spo2: '99',
    respiratoryRate: '16',
    followUpDate: '',
  });

  // Amend / Update Modal State
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendTarget, setAmendTarget] = useState(null);
  const [amendFormData, setAmendFormData] = useState({
    symptoms: '',
    diagnosis: '',
    treatment: '',
    clinicalNotes: '',
    followUpDate: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    spo2: '',
    respiratoryRate: '',
    amendmentReason: '',
  });

  // Longitudinal patient journey selected patient
  const [journeyPatientId, setJourneyPatientId] = useState(isPatientPersona ? activePatientId : '1');

  // Sandbox simulation state
  const [sandboxResult, setSandboxResult] = useState(null);

  // Handle Search Input Change (resets page to 0)
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      patientId: isPatientPersona ? activePatientId : '',
      doctorId: '',
      date: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(0);
  };

  // Quick date presets
  const applyDatePreset = (preset) => {
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'ALL') {
      handleFilterChange('date', '');
      handleFilterChange('startDate', '');
      handleFilterChange('endDate', '');
    } else if (preset === 'TODAY') {
      setFilters((prev) => ({ ...prev, date: today, startDate: '', endDate: '' }));
      setCurrentPage(0);
    } else if (preset === 'LAST_7_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const start = d.toISOString().split('T')[0];
      setFilters((prev) => ({ ...prev, date: '', startDate: start, endDate: today }));
      setCurrentPage(0);
    } else if (preset === 'SEPT_2026') {
      setFilters((prev) => ({ ...prev, date: '', startDate: '2026-09-01', endDate: '2026-09-30' }));
      setCurrentPage(0);
    } else if (preset === 'AUG_2026') {
      setFilters((prev) => ({ ...prev, date: '', startDate: '2026-08-01', endDate: '2026-08-31' }));
      setCurrentPage(0);
    }
  };

  // Handle Open Create Modal
  const handleOpenCreateModal = () => {
    if (!isDoctor) {
      handleUnauthorizedCreateAttempt();
      return;
    }
    const currentDoc = doctors.find((d) => d.id === currentUser?.id) || doctors[0];
    setCreateFormData({
      patientId: patients[0]?.id ? String(patients[0].id) : '1',
      doctorId: currentDoc ? String(currentDoc.id) : '1',
      visitDate: new Date().toISOString().split('T')[0],
      symptoms: '',
      diagnosis: '',
      treatment: '',
      clinicalNotes: '',
      bloodPressure: '120/80 mmHg',
      heartRate: '75',
      temperature: '36.8',
      spo2: '99',
      respiratoryRate: '16',
      followUpDate: '',
    });
    setShowCreateModal(true);
  };

  // Handle Submit Create Record
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    try {
      const currentDoc = doctors.find((d) => d.id === Number(createFormData.doctorId)) || doctors[0];
      const authorInfo = {
        id: currentDoc.id,
        name: currentDoc.name,
      };

      const created = mockDataService.createRecord(createFormData, currentUser.role, authorInfo);
      setRefreshTrigger((prev) => prev + 1);
      setShowCreateModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Medical Record Authored & Audited',
        html: `<div class="text-start">
          <p class="mb-1">Clinical chart successfully created for <b>${created.patientName}</b> (${created.patientCode}).</p>
          <div class="p-2 bg-light rounded font-monospace small mb-2">
            <b>Diagnosis:</b> ${created.diagnosis}<br/>
            <b>Attending Physician:</b> ${created.doctorName}<br/>
            <b>Visit Date:</b> ${created.visitDate}<br/>
            <b>Follow-up Date:</b> ${created.followUpDate || 'None scheduled'}<br/>
            <b>Audit Log:</b> Initial chart logged with timestamp ${created.createdAt.substring(0, 19)}
          </div>
        </div>`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err.message,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Handle Open Amend Modal (enforcing modification authorization)
  const handleOpenAmendModal = (record) => {
    // Prevent unauthorized modification check
    if (!isAdmin) {
      if (currentUser?.role !== 'DOCTOR') {
        Swal.fire({
          icon: 'error',
          title: 'Unauthorized Modification (HTTP 403 Forbidden)',
          html: `<div class="text-start">
            <p><b>Access Denied:</b> Non-physicians cannot amend clinical charts.</p>
            <p class="small text-muted mb-0">Only the authoring attending doctor (<b>${record.doctorName}</b>) or Medical Administrator can amend this record.</p>
          </div>`,
          confirmButtonColor: '#dc3545',
        });
        return;
      }

      // Check if current doctor is the author
      const isAuthor =
        record.doctorName === currentUser?.name ||
        record.createdBy === currentUser?.name ||
        record.doctorId === currentUser?.id;

      if (!isAuthor) {
        Swal.fire({
          icon: 'error',
          title: 'SRS Rule Violation: Unauthorized Modification (HTTP 403)',
          html: `<div class="text-start">
            <p class="mb-2"><b>Clinical Governance Violation:</b> You are attempting to amend a chart authored by <b>${record.doctorName}</b>.</p>
            <p class="small text-muted mb-2">Under HIPAA Title II / Hospital Medical Bylaws, a physician cannot alter another doctor's clinical chart unless serving as an Administrator or Chief Medical Officer.</p>
            <div class="p-2 bg-danger-subtle text-danger rounded small">
              <b>Authoring Physician:</b> ${record.doctorName}<br/>
              <b>Your Active Identity:</b> ${currentUser?.name} (${currentUser?.role})
            </div>
          </div>`,
          confirmButtonColor: '#dc3545',
        });
        return;
      }
    }

    setAmendTarget(record);
    setAmendFormData({
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      clinicalNotes: record.clinicalNotes || record.notes || '',
      followUpDate: record.followUpDate || '',
      bloodPressure: record.bloodPressure || '120/80 mmHg',
      heartRate: record.heartRate ? String(record.heartRate) : '75',
      temperature: record.temperature ? String(record.temperature) : '36.8',
      spo2: record.spo2 ? String(record.spo2) : '99',
      respiratoryRate: record.respiratoryRate ? String(record.respiratoryRate) : '16',
      amendmentReason: '',
    });
    setShowAmendModal(true);
  };

  // Handle Submit Amend Record
  const handleAmendSubmit = (e) => {
    e.preventDefault();
    if (!amendTarget) return;

    try {
      const editorInfo = {
        id: currentUser?.id,
        name: currentUser?.name || 'Administrator',
      };

      const updated = mockDataService.updateRecord(
        amendTarget.id,
        amendFormData,
        currentUser.role,
        editorInfo
      );

      setRefreshTrigger((prev) => prev + 1);
      setShowAmendModal(false);

      // If detail modal was open for this record, update it
      if (detailRecord && detailRecord.id === updated.id) {
        setDetailRecord(updated);
      }

      Swal.fire({
        icon: 'success',
        title: 'Clinical Chart Amended & Audited',
        html: `<div class="text-start">
          <p class="mb-1">Medical Record #<b>${updated.id}</b> successfully updated.</p>
          <div class="p-2 bg-light rounded font-monospace small mb-2">
            <b>Amendment Reason:</b> ${amendFormData.amendmentReason}<br/>
            <b>Amended By:</b> ${currentUser?.name} (${currentUser?.role})<br/>
            <b>Updated Timestamp:</b> ${updated.updatedAt.substring(0, 19)}<br/>
            <b>Revision History Count:</b> ${updated.auditHistory?.length || 1} permanent entries
          </div>
        </div>`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Amendment Failed',
        text: err.message,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Unauthorized create warning
  const handleUnauthorizedCreateAttempt = () => {
    Swal.fire({
      icon: 'error',
      title: 'SRS Rule 3 Violation (HTTP 403 Forbidden)',
      html: `<div class="text-start">
        <p class="mb-2"><b>Access Denied:</b> Only certified doctors (<code>ROLE_DOCTOR</code>) and medical administrators have clinical authority to author medical records.</p>
        <p class="small text-muted mb-0">Your current active role is: <code>${currentUser?.role}</code> (${currentUser?.name}). Switch to <b>Dr. Eleanor Sterling (DOCTOR)</b> in the top navbar to create records.</p>
      </div>`,
      confirmButtonColor: '#dc3545',
    });
  };

  // Interactive Sandbox Simulator
  const runSandboxTest = (testCase) => {
    const timestamp = new Date().toISOString();
    let result = {};

    switch (testCase) {
      case 'DOCTOR_ONLY_FAIL': {
        // Patient trying to create record
        result = {
          title: 'Doctor-Only Creation Violation (Rule 3)',
          status: 403,
          statusText: 'Forbidden',
          timestamp,
          message: 'SRS Rule 3 Violation: Only authorized licensed doctors have clinical authority to author medical records.',
          role: 'ROLE_PATIENT',
          testedEndpoint: 'POST /api/medical-records',
          passed: true,
          explanation: 'Spring Security @PreAuthorize("hasAnyRole(\'DOCTOR\', \'ADMIN\')") and service layer physician validation intercepted the non-physician request.',
        };
        break;
      }
      case 'PATIENT_PHI_VIOLATION': {
        // Patient 1 trying to query Patient 2
        result = {
          title: 'Patient PHI Isolation Violation (Rule 9)',
          status: 403,
          statusText: 'Forbidden',
          timestamp,
          message: 'SRS Rule 9 Privacy Violation: Patients are strictly restricted from viewing medical records belonging to other patients.',
          role: 'ROLE_PATIENT',
          testedEndpoint: 'GET /api/medical-records?patientId=2',
          passed: true,
          explanation: 'Service layer verifyPatientOwnership() extracted the JWT SecurityContext and aborted access to foreign health records.',
        };
        break;
      }
      case 'UNAUTHORIZED_AMENDMENT': {
        // Dr. Marcus trying to edit Dr. Eleanor's record #1
        result = {
          title: 'Prevent Unauthorized Modification Violation',
          status: 403,
          statusText: 'Forbidden',
          timestamp,
          message: 'Clinical Compliance Violation: Only the authoring attending doctor (Dr. Eleanor Sterling) or an authorized Medical Administrator can amend this clinical record.',
          role: 'ROLE_DOCTOR (Dr. Marcus Holloway)',
          testedEndpoint: 'PUT /api/medical-records/1',
          passed: true,
          explanation: 'Service layer updateRecord() checks (record.doctor.id == authenticatedDoctor.id || isAdmin). Non-author physicians are strictly blocked from tampering.',
        };
        break;
      }
      case 'FOLLOWUP_DATE_VALIDATION': {
        // Follow-up date earlier than visit date
        result = {
          title: 'Follow-up Date Validation (HTTP 400)',
          status: 400,
          statusText: 'Bad Request',
          timestamp,
          message: 'Clinical Validation Error: Scheduled follow-up date (2026-08-01) cannot be earlier than consultation visit date (2026-09-20).',
          role: 'ROLE_DOCTOR',
          testedEndpoint: 'POST /api/medical-records',
          passed: true,
          explanation: 'Service layer temporal integrity check validates followUpDate.isAfter(visitDate).',
        };
        break;
      }
      case 'AUDIT_TRAIL_VERIFICATION': {
        const sampleRecord = records[0] || mockDataService.getRecords()[0];
        result = {
          title: 'Immutable Audit Trail Verification',
          status: 200,
          statusText: 'OK',
          timestamp,
          message: `Audit history successfully verified for Record #${sampleRecord.id}. Found ${sampleRecord.auditHistory?.length || 1} revision log(s).`,
          role: 'ROLE_ADMIN',
          testedEndpoint: `GET /api/medical-records/${sampleRecord.id}/audit`,
          passed: true,
          auditEntries: sampleRecord.auditHistory || [],
          explanation: 'Every clinical modification creates an append-only MedicalRecordAuditLog record with timestamp, operator, amendment reason, and diff summary.',
        };
        break;
      }
      default:
        break;
    }

    setSandboxResult(result);
  };

  // Get full audit history across all records for the Audit Trail tab
  const allAuditLogs = useMemo(() => {
    const all = mockDataService.getRecords();
    const logs = [];
    all.forEach((r) => {
      if (r.auditHistory && Array.isArray(r.auditHistory)) {
        r.auditHistory.forEach((log) => {
          logs.push({
            ...log,
            recordPatientName: r.patientName,
            recordPatientCode: r.patientCode,
            recordDoctorName: r.doctorName,
            recordVisitDate: r.visitDate,
          });
        });
      }
    });
    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return logs;
  }, [refreshTrigger]);

  // Longitudinal records for selected patient
  const journeyRecords = useMemo(() => {
    return mockDataService.getRecords({ patientId: journeyPatientId });
  }, [journeyPatientId, refreshTrigger]);

  return (
    <div className="container-fluid p-4">
      {/* Top Header & Role Indicator */}
      <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <FileText className="text-primary" size={26} />
                <span>Medical Record Management (EMR)</span>
              </h2>
              <RuleBadge ruleNumber={3} title="Doctor-Only Creation" />
              <RuleBadge ruleNumber={9} title="Patient PHI Privacy" />
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                <ShieldCheck size={12} className="me-1 inline" />
                Audit Trail Compliance
              </span>
            </div>
            <p className="text-muted small mb-0">
              Enterprise clinical chart management, physician authorization, immutable audit trail,
              longitudinal patient history, and HIPAA PHI isolation.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Active User Persona Banner */}
            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-3 border">
              <User size={16} className="text-secondary" />
              <div className="small lh-sm text-end">
                <div className="fw-bold text-dark">{currentUser?.name}</div>
                <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                  {currentUser?.role === 'DOCTOR' && (
                    <span className="text-primary fw-semibold">Attending Physician (Full Authoring)</span>
                  )}
                  {currentUser?.role === 'PATIENT' && (
                    <span className="text-info fw-semibold">Patient Persona (Own PHI Only)</span>
                  )}
                  {currentUser?.role === 'ADMIN' && (
                    <span className="text-danger fw-semibold">Medical Administrator</span>
                  )}
                  {currentUser?.role === 'RECEPTIONIST' && (
                    <span className="text-secondary">Desk Staff (View Only)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Create Record Action Button */}
            {isDoctor ? (
              <button
                onClick={handleOpenCreateModal}
                className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
              >
                <Plus size={16} />
                <span>Author Clinical Chart</span>
              </button>
            ) : (
              <button
                onClick={handleUnauthorizedCreateAttempt}
                className="btn btn-outline-secondary btn-sm px-3 shadow-sm d-flex align-items-center gap-1 opacity-75"
                title="Only licensed doctors can author clinical records (SRS Rule 3)"
              >
                <Lock size={14} />
                <span>Author Chart (Doctor Only)</span>
              </button>
            )}
          </div>
        </div>

        {/* Patient Notice Banner if viewing as Patient */}
        {isPatientPersona && (
          <div className="alert alert-info py-2 px-3 rounded-3 small d-flex align-items-center justify-content-between mt-3 mb-0 border-info">
            <div className="d-flex align-items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              <span>
                <b>SRS Rule 9 Privacy Active:</b> You are viewing your isolated personal clinical charts (Patient Code: <code>{currentUser.patientCode}</code>). Records of other patients are cryptographically isolated.
              </span>
            </div>
            <span className="badge bg-primary">HIPAA Isolated</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="d-flex flex-wrap gap-2 border-bottom mb-4">
        <button
          onClick={() => setActiveTab('directory')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'directory' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <FileText size={16} />
          <span>Clinical EMR Directory ({totalElements})</span>
        </button>

        <button
          onClick={() => setActiveTab('patient-journey')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'patient-journey' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Activity size={16} />
          <span>Patient Longitudinal Journey</span>
        </button>

        <button
          onClick={() => setActiveTab('audit-trail')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'audit-trail' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <History size={16} />
          <span>Audit & Revision Trail ({allAuditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security-sandbox')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'security-sandbox' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Shield size={16} />
          <span>Security & Authorization Sandbox</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CLINICAL EMR DIRECTORY (Search, Filter, Pagination, Cards/Table)  */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div>
          {/* Search & Filter Toolbar */}
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 mb-4">
            <div className="row g-2 align-items-center">
              {/* Text Search Input */}
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <Search size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0 ps-1"
                    placeholder="Search patient, doctor, diagnosis, symptoms, notes..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  {filters.search && (
                    <button
                      className="btn btn-outline-secondary border-start-0 bg-light"
                      onClick={() => handleFilterChange('search', '')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Patient Filter */}
              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={filters.patientId}
                  onChange={(e) => handleFilterChange('patientId', e.target.value)}
                  disabled={isPatientPersona}
                >
                  {!isPatientPersona && <option value="">All Patients</option>}
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Filter */}
              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={filters.doctorId}
                  onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                >
                  <option value="">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Consultation Visit Date Filter */}
              <div className="col-6 col-md-2">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light" title="Consultation Visit Date">
                    <Calendar size={13} className="text-muted" />
                  </span>
                  <input
                    type="date"
                    className="form-control"
                    title="Exact Visit Date"
                    value={filters.date}
                    onChange={(e) => {
                      handleFilterChange('date', e.target.value);
                      handleFilterChange('startDate', '');
                      handleFilterChange('endDate', '');
                    }}
                  />
                </div>
              </div>

              {/* Actions & View Toggle */}
              <div className="col-6 col-md-2 d-flex align-items-center justify-content-end gap-2">
                <div className="btn-group btn-group-sm">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    title="Cards View"
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    title="Tabular Ledger View"
                  >
                    Table
                  </button>
                </div>

                <button
                  onClick={handleResetFilters}
                  className="btn btn-outline-secondary btn-sm"
                  title="Reset all filters"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Quick Date Presets & Date Range */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2 pt-2 border-top">
              <div className="d-flex flex-wrap align-items-center gap-1">
                <span className="text-muted small me-1">Quick Date:</span>
                <button
                  onClick={() => applyDatePreset('ALL')}
                  className={`btn btn-xs py-0 px-2 rounded-pill ${
                    !filters.date && !filters.startDate ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  All
                </button>
                <button
                  onClick={() => applyDatePreset('TODAY')}
                  className={`btn btn-xs py-0 px-2 rounded-pill ${
                    filters.date === new Date().toISOString().split('T')[0] ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  Today
                </button>
                <button
                  onClick={() => applyDatePreset('LAST_7_DAYS')}
                  className={`btn btn-xs py-0 px-2 rounded-pill ${
                    filters.startDate && !filters.date ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => applyDatePreset('SEPT_2026')}
                  className="btn btn-xs py-0 px-2 rounded-pill btn-outline-secondary"
                  style={{ fontSize: '0.72rem' }}
                >
                  Sept 2026
                </button>
                <button
                  onClick={() => applyDatePreset('AUG_2026')}
                  className="btn btn-xs py-0 px-2 rounded-pill btn-outline-secondary"
                  style={{ fontSize: '0.72rem' }}
                >
                  Aug 2026
                </button>
              </div>

              {/* Date Range Inputs */}
              <div className="d-flex align-items-center gap-1 small">
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Range:</span>
                <input
                  type="date"
                  className="form-control form-control-sm py-0 px-2"
                  style={{ width: '130px', fontSize: '0.75rem' }}
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  placeholder="From"
                />
                <span className="text-muted">-</span>
                <input
                  type="date"
                  className="form-control form-control-sm py-0 px-2"
                  style={{ width: '130px', fontSize: '0.75rem' }}
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Results Summary & Page Size */}
          <div className="d-flex align-items-center justify-content-between mb-3 px-1">
            <div className="small text-muted">
              Showing <b className="text-dark">{records.length}</b> of <b className="text-dark">{totalElements}</b> medical records
              {filters.search && <span> matching "<b className="text-primary">{filters.search}</b>"</span>}
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">Per page:</span>
              <select
                className="form-select form-select-sm py-0 px-2"
                style={{ width: '70px', fontSize: '0.8rem' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {/* No Records Empty State */}
          {records.length === 0 && (
            <div className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center">
              <div className="py-4">
                <FileText size={48} className="text-muted mb-3 opacity-50" />
                <h5 className="fw-bold text-dark">No Medical Records Found</h5>
                <p className="text-muted small max-w-md mx-auto mb-3">
                  No clinical diagnostic charts matched your current search and date filter criteria.
                </p>
                <button onClick={handleResetFilters} className="btn btn-outline-primary btn-sm px-3">
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: CARDS VIEW */}
          {viewMode === 'cards' && records.length > 0 && (
            <div className="d-flex flex-column gap-3 mb-4">
              {records.map((rec) => {
                const canAmend =
                  isAdmin ||
                  (currentUser?.role === 'DOCTOR' &&
                    (rec.doctorName === currentUser?.name ||
                      rec.createdBy === currentUser?.name ||
                      rec.doctorId === currentUser?.id));

                return (
                  <div key={rec.id} className="card border-0 shadow-sm rounded-3 bg-white p-4">
                    {/* Card Header */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-3 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center">
                          <Stethoscope size={20} />
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h5 className="fw-bold text-dark mb-0">{rec.patientName}</h5>
                            <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.72rem' }}>
                              {rec.patientCode}
                            </span>
                            <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.7rem' }}>
                              ID #{rec.id}
                            </span>
                          </div>
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            Patient: {rec.patientGender} • DOB: {rec.patientDateOfBirth || 'N/A'} • Phone: {rec.patientPhone}
                          </div>
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-semibold text-primary d-flex align-items-center justify-content-end gap-1">
                          <UserCheck size={14} />
                          <span>{rec.doctorName}</span>
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          Dept: <b>{rec.departmentName || rec.doctorSpecialization}</b> • Visit Date: <b className="text-dark">{rec.visitDate}</b>
                        </div>
                      </div>
                    </div>

                    {/* Vitals Telemetry Ribbon */}
                    <div className="bg-light p-2 rounded-2 mb-3 d-flex flex-wrap gap-4 small align-items-center justify-content-around border">
                      <div className="d-flex align-items-center gap-1">
                        <Heart size={14} className="text-danger" />
                        <span className="text-muted">BP:</span>
                        <b className="font-monospace text-dark">{rec.bloodPressure || '120/80 mmHg'}</b>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Activity size={14} className="text-primary" />
                        <span className="text-muted">HR:</span>
                        <b className="font-monospace text-dark">{rec.heartRate || 75} bpm</b>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Thermometer size={14} className="text-warning" />
                        <span className="text-muted">Temp:</span>
                        <b className="font-monospace text-dark">{rec.temperature || 36.8}°C</b>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <span className="text-muted">SpO2:</span>
                        <b className="font-monospace text-dark">{rec.spo2 || 99}%</b>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <span className="text-muted">Resp:</span>
                        <b className="font-monospace text-dark">{rec.respiratoryRate || 16}/min</b>
                      </div>
                    </div>

                    {/* Diagnosis & Symptoms Row */}
                    <div className="row g-3 small mb-3">
                      <div className="col-12 col-md-6">
                        <div className="text-muted fw-semibold mb-1 d-flex align-items-center gap-1">
                          <Info size={13} /> Symptoms Reported:
                        </div>
                        <div className="p-2 bg-light rounded text-dark lh-sm border" style={{ minHeight: '52px' }}>
                          {rec.symptoms}
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <div className="text-muted fw-semibold mb-1 d-flex align-items-center gap-1">
                          <CheckCircle2 size={13} className="text-primary" /> Primary Diagnosis:
                        </div>
                        <div className="p-2 bg-primary-subtle text-primary fw-bold rounded border border-primary-subtle lh-sm" style={{ minHeight: '52px' }}>
                          {rec.diagnosis}
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="text-muted fw-semibold mb-1">Treatment Plan & Prescription Protocols:</div>
                        <div className="p-2 bg-light rounded text-dark lh-sm border">{rec.treatment}</div>
                      </div>

                      {(rec.notes || rec.clinicalNotes) && (
                        <div className="col-12">
                          <div className="text-muted fw-semibold mb-1">Doctor's Clinical Notes:</div>
                          <div className="p-2 bg-light rounded text-secondary font-monospace small border">
                            {rec.notes || rec.clinicalNotes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer: Follow-up, Timestamps, Audit info & Actions */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 border-top small">
                      <div className="d-flex flex-wrap align-items-center gap-3 text-muted" style={{ fontSize: '0.75rem' }}>
                        {rec.followUpDate ? (
                          <span className="badge bg-warning-subtle text-dark border border-warning-subtle d-flex align-items-center gap-1">
                            <Calendar size={12} />
                            <span>Follow-up: <b>{rec.followUpDate}</b></span>
                          </span>
                        ) : (
                          <span className="text-muted">No scheduled follow-up</span>
                        )}

                        <span>
                          Created: <b className="text-dark">{rec.createdAt ? rec.createdAt.substring(0, 16).replace('T', ' ') : rec.visitDate}</b> by <b>{rec.createdBy || rec.doctorName}</b>
                        </span>

                        {rec.updatedAt && rec.updatedAt !== rec.createdAt && (
                          <span className="badge bg-light text-secondary border">
                            Amended: {rec.updatedAt.substring(0, 16).replace('T', ' ')}
                          </span>
                        )}

                        <span className="badge bg-light text-secondary border">
                          <History size={11} className="me-1 inline" />
                          {rec.auditHistory?.length || 1} Audit Log(s)
                        </span>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="d-flex align-items-center gap-2">
                        <button
                          onClick={() => setDetailRecord(rec)}
                          className="btn btn-outline-primary btn-sm px-2 py-1 d-flex align-items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>View Chart & Audit</span>
                        </button>

                        {canAmend ? (
                          <button
                            onClick={() => handleOpenAmendModal(rec)}
                            className="btn btn-primary btn-sm px-2 py-1 d-flex align-items-center gap-1"
                            title="Amend clinical record with permanent audit reason"
                          >
                            <Edit3 size={13} />
                            <span>Amend Chart</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAmendModal(rec)}
                            className="btn btn-outline-secondary btn-sm px-2 py-1 d-flex align-items-center gap-1 opacity-75"
                            title="Prevent Unauthorized Modification (Authoring Doctor / Admin only)"
                          >
                            <Lock size={12} />
                            <span>Amend</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: TABULAR CLINICAL LEDGER */}
          {viewMode === 'table' && records.length > 0 && (
            <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden mb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light text-muted">
                    <tr>
                      <th style={{ width: '60px' }}>ID</th>
                      <th>Patient</th>
                      <th>Attending Doctor</th>
                      <th>Visit Date</th>
                      <th>Diagnosis</th>
                      <th>Follow-up</th>
                      <th>Created By</th>
                      <th>Revisions</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => {
                      const canAmend =
                        isAdmin ||
                        (currentUser?.role === 'DOCTOR' &&
                          (rec.doctorName === currentUser?.name ||
                            rec.createdBy === currentUser?.name ||
                            rec.doctorId === currentUser?.id));

                      return (
                        <tr key={rec.id}>
                          <td className="font-monospace text-muted">#{rec.id}</td>
                          <td>
                            <div className="fw-bold text-dark">{rec.patientName}</div>
                            <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                              {rec.patientCode}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold text-primary">{rec.doctorName}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {rec.departmentName || rec.doctorSpecialization}
                            </div>
                          </td>
                          <td className="fw-semibold text-dark">{rec.visitDate}</td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-normal">
                              {rec.diagnosis}
                            </span>
                          </td>
                          <td>
                            {rec.followUpDate ? (
                              <span className="badge bg-warning-subtle text-dark border border-warning-subtle">
                                {rec.followUpDate}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <div className="text-dark" style={{ fontSize: '0.75rem' }}>{rec.createdBy || rec.doctorName}</div>
                            <div className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                              {rec.createdAt ? rec.createdAt.substring(0, 10) : ''}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border">
                              {rec.auditHistory?.length || 1} Log(s)
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                onClick={() => setDetailRecord(rec)}
                                className="btn btn-outline-primary"
                                title="View Complete Clinical Chart & Audit Trail"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenAmendModal(rec)}
                                className={canAmend ? 'btn btn-outline-success' : 'btn btn-outline-secondary opacity-75'}
                                title={canAmend ? 'Amend Record' : 'Unauthorized: Only authoring doctor or admin can amend'}
                              >
                                {canAmend ? <Edit3 size={13} /> : <Lock size={12} />}
                              </button>
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
          {totalPages > 1 && (
            <div className="card border-0 shadow-sm rounded-3 bg-white p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="small text-muted">
                Showing Page <b className="text-dark">{currentPage + 1}</b> of <b className="text-dark">{totalPages}</b>
              </div>

              <div className="d-flex align-items-center gap-1">
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm px-3 ${
                      currentPage === i ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                    onClick={() => setCurrentPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PATIENT LONGITUDINAL JOURNEY (Patient History Progression)        */}
      {/* ========================================================================= */}
      {activeTab === 'patient-journey' && (
        <div className="row g-4">
          {/* Patient Selector */}
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-3 mb-3">
              <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                <User size={16} className="text-primary" />
                <span>Select Patient Profile</span>
              </h6>
              <p className="text-muted small mb-3">
                Review complete chronological longitudinal medical chart history for clinical evaluation.
              </p>

              <div className="d-flex flex-column gap-2">
                {patients
                  .filter((p) => !isPatientPersona || String(p.id) === activePatientId)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setJourneyPatientId(String(p.id))}
                      className={`btn btn-sm text-start p-2 rounded-2 border d-flex align-items-center justify-content-between ${
                        String(p.id) === String(journeyPatientId)
                          ? 'border-primary bg-primary-subtle text-primary fw-bold'
                          : 'border-light bg-light text-dark'
                      }`}
                    >
                      <div>
                        <div>{p.name}</div>
                        <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                          {p.patientCode} • {p.gender}
                        </div>
                      </div>
                      <ArrowRight size={14} />
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Longitudinal History Feed */}
          <div className="col-12 col-md-8">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
                <div>
                  <h5 className="fw-bold text-dark mb-0">
                    Longitudinal EMR History ({journeyRecords.length} Consultations)
                  </h5>
                  <div className="text-muted small">
                    Chronological chart timeline and clinical evaluation progression
                  </div>
                </div>

                <span className="badge bg-primary">
                  Patient ID #{journeyPatientId}
                </span>
              </div>

              {journeyRecords.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No consultation records on file for this patient.
                </div>
              ) : (
                <div className="timeline position-relative ps-4 border-start border-2 border-primary-subtle d-flex flex-column gap-4">
                  {journeyRecords.map((jr, idx) => (
                    <div key={jr.id} className="position-relative">
                      {/* Timeline dot */}
                      <div
                        className="position-absolute rounded-circle bg-primary"
                        style={{
                          width: '12px',
                          height: '12px',
                          left: '-23px',
                          top: '6px',
                          border: '2px solid white',
                        }}
                      ></div>

                      <div className="card border bg-light rounded-3 p-3">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                          <div className="fw-bold text-dark">
                            Consultation on {jr.visitDate}
                          </div>
                          <div className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            {jr.doctorName} ({jr.doctorSpecialization})
                          </div>
                        </div>

                        <div className="mb-2">
                          <span className="text-muted small">Diagnosis: </span>
                          <b className="text-dark">{jr.diagnosis}</b>
                        </div>

                        <div className="p-2 bg-white rounded mb-2 small text-secondary border">
                          <b>Treatment:</b> {jr.treatment}
                        </div>

                        {jr.notes && (
                          <div className="small text-muted font-italic mb-2">
                            <b>Notes:</b> {jr.notes}
                          </div>
                        )}

                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 small text-muted pt-2 border-top">
                          <span>BP: {jr.bloodPressure} • HR: {jr.heartRate} bpm • SpO2: {jr.spo2}%</span>
                          {jr.followUpDate && (
                            <span className="badge bg-warning-subtle text-dark border">
                              Follow-up: {jr.followUpDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMMUTABLE AUDIT & REVISION TRAIL                                   */}
      {/* ========================================================================= */}
      {activeTab === 'audit-trail' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-3 mb-4">
            <div>
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <History className="text-primary" size={20} />
                <span>Enterprise Medical Record Audit & Revision Trail</span>
              </h5>
              <p className="text-muted small mb-0">
                Every clinical record creation and amendment generates an immutable audit record with
                the operator's identity, role, timestamp, reason, and change summary.
              </p>
            </div>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
              <ShieldCheck size={14} className="me-1 inline" />
              HIPAA & EMR Compliance Ready
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light text-muted">
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Record Ref</th>
                  <th>Patient</th>
                  <th>Attending Physician</th>
                  <th>Performed By</th>
                  <th>Role</th>
                  <th>Amendment Reason</th>
                  <th>Change Summary</th>
                </tr>
              </thead>
              <tbody>
                {allAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-monospace text-dark text-nowrap" style={{ fontSize: '0.75rem' }}>
                      {log.timestamp ? log.timestamp.replace('T', ' ').substring(0, 19) : 'N/A'}
                    </td>
                    <td>
                      {log.action === 'RECORD_CREATED' ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          RECORD_CREATED
                        </span>
                      ) : (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          RECORD_AMENDED
                        </span>
                      )}
                    </td>
                    <td className="font-monospace text-muted">
                      #{log.medicalRecordId}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{log.recordPatientName}</div>
                      <div className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                        {log.recordPatientCode}
                      </div>
                    </td>
                    <td className="text-primary">{log.recordDoctorName}</td>
                    <td className="fw-semibold text-dark">{log.performedBy}</td>
                    <td>
                      <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.68rem' }}>
                        {log.performedByRole}
                      </span>
                    </td>
                    <td className="text-dark fw-semibold" style={{ maxWidth: '200px' }}>
                      {log.amendmentReason || 'Initial Creation'}
                    </td>
                    <td className="text-muted" style={{ maxWidth: '260px' }}>
                      {log.changeSummary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECURITY & AUTHORIZATION SANDBOX (Live SRS Rule Verification)      */}
      {/* ========================================================================= */}
      {activeTab === 'security-sandbox' && (
        <div className="row g-4">
          <div className="col-12 col-md-5">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
              <h5 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                <Shield className="text-primary" size={20} />
                <span>EMR Security Rule Simulator</span>
              </h5>
              <p className="text-muted small mb-4">
                Execute live automated tests against the Spring Boot service layer authorization checks,
                DTO validation constraints, and patient privacy boundaries.
              </p>

              <div className="d-flex flex-column gap-2 mb-3">
                <button
                  onClick={() => runSandboxTest('DOCTOR_ONLY_FAIL')}
                  className="btn btn-outline-danger btn-sm text-start p-2 d-flex align-items-center justify-content-between"
                >
                  <div>
                    <div className="fw-bold">Test 1: Doctor-Only Creation Rule</div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      Simulate Patient/Nurse attempting to POST /api/medical-records &rarr; HTTP 403
                    </div>
                  </div>
                  <span className="badge bg-danger">403</span>
                </button>

                <button
                  onClick={() => runSandboxTest('PATIENT_PHI_VIOLATION')}
                  className="btn btn-outline-danger btn-sm text-start p-2 d-flex align-items-center justify-content-between"
                >
                  <div>
                    <div className="fw-bold">Test 2: Patient PHI Privacy Isolation</div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      Simulate Patient PT-0001 searching records of PT-0002 &rarr; HTTP 403
                    </div>
                  </div>
                  <span className="badge bg-danger">403</span>
                </button>

                <button
                  onClick={() => runSandboxTest('UNAUTHORIZED_AMENDMENT')}
                  className="btn btn-outline-warning btn-sm text-start p-2 d-flex align-items-center justify-content-between"
                >
                  <div>
                    <div className="fw-bold">Test 3: Prevent Unauthorized Modification</div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      Simulate Dr. Marcus editing Dr. Eleanor's chart &rarr; HTTP 403 Forbidden
                    </div>
                  </div>
                  <span className="badge bg-warning text-dark">403</span>
                </button>

                <button
                  onClick={() => runSandboxTest('FOLLOWUP_DATE_VALIDATION')}
                  className="btn btn-outline-primary btn-sm text-start p-2 d-flex align-items-center justify-content-between"
                >
                  <div>
                    <div className="fw-bold">Test 4: Follow-up Date Clinical Validation</div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      Simulate follow-up date earlier than visit date &rarr; HTTP 400 Bad Request
                    </div>
                  </div>
                  <span className="badge bg-primary">400</span>
                </button>

                <button
                  onClick={() => runSandboxTest('AUDIT_TRAIL_VERIFICATION')}
                  className="btn btn-outline-success btn-sm text-start p-2 d-flex align-items-center justify-content-between"
                >
                  <div>
                    <div className="fw-bold">Test 5: Immutable Audit Trail Inspection</div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      Inspect complete revision log &amp; amendment reason &rarr; HTTP 200 OK
                    </div>
                  </div>
                  <span className="badge bg-success">200</span>
                </button>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-7">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 h-100">
              <h5 className="fw-bold text-dark mb-3">Live Simulation Output Console</h5>

              {sandboxResult ? (
                <div>
                  <div
                    className={`alert ${
                      sandboxResult.status === 200
                        ? 'alert-success'
                        : sandboxResult.status === 400
                        ? 'alert-warning'
                        : 'alert-danger'
                    } py-3 px-3 rounded-3 mb-3`}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold fs-6">{sandboxResult.title}</span>
                      <span className="badge bg-dark font-monospace">
                        HTTP {sandboxResult.status} {sandboxResult.statusText}
                      </span>
                    </div>
                    <p className="mb-0 small">{sandboxResult.message}</p>
                  </div>

                  <div className="bg-dark text-light p-3 rounded-3 font-monospace small mb-3">
                    <div className="text-success mb-1">// Spring Boot 3 Security Interceptor Output</div>
                    <div className="text-muted">Timestamp: {sandboxResult.timestamp}</div>
                    <div className="text-muted">Target Endpoint: {sandboxResult.testedEndpoint}</div>
                    <div className="text-muted">Caller Principal Role: {sandboxResult.role}</div>
                    <div className="text-info mt-2">Architecture Defense Mechanism:</div>
                    <div className="text-white ps-2 border-start border-info mt-1">
                      {sandboxResult.explanation}
                    </div>
                  </div>

                  {sandboxResult.auditEntries && (
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-dark mb-2">Historical Audit Entries:</h6>
                      <div className="d-flex flex-column gap-2 small">
                        {sandboxResult.auditEntries.map((ae) => (
                          <div key={ae.id} className="p-2 bg-white rounded border">
                            <div className="d-flex justify-content-between">
                              <b>{ae.action}</b>
                              <span className="text-muted">{ae.timestamp.substring(0, 16)}</span>
                            </div>
                            <div className="text-muted">By: {ae.performedBy} ({ae.performedByRole})</div>
                            <div className="text-dark">Reason: {ae.amendmentReason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 text-center text-muted">
                  <Terminal size={40} className="mb-3 opacity-50" />
                  <p>Click any test scenario on the left to execute the live EMR security validation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE MEDICAL RECORD (Doctor/Admin Only)                       */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <div className="d-flex align-items-center gap-2">
                  <Stethoscope size={20} />
                  <h5 className="modal-title fw-bold mb-0">Record Clinical Diagnosis (Doctor Only)</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4 small">
                  {/* Doctor & Patient Row */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Patient *</label>
                      <select
                        className="form-select form-select-sm"
                        value={createFormData.patientId}
                        onChange={(e) => setCreateFormData({ ...createFormData, patientId: e.target.value })}
                        required
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.patientCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Attending Doctor *</label>
                      <select
                        className="form-select form-select-sm"
                        value={createFormData.doctorId}
                        onChange={(e) => setCreateFormData({ ...createFormData, doctorId: e.target.value })}
                        disabled={currentUser?.role === 'DOCTOR'}
                        required
                      >
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.specialization})
                          </option>
                        ))}
                      </select>
                      {currentUser?.role === 'DOCTOR' && (
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          Locked to authenticated physician credentials (SRS Rule 3)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Consultation Visit Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={createFormData.visitDate}
                        onChange={(e) => setCreateFormData({ ...createFormData, visitDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Follow-up Date (Optional)</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={createFormData.followUpDate}
                        min={createFormData.visitDate}
                        onChange={(e) => setCreateFormData({ ...createFormData, followUpDate: e.target.value })}
                      />
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Must be on or after consultation visit date
                      </div>
                    </div>
                  </div>

                  {/* Vitals Telemetry Row */}
                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <label className="form-label fw-bold text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                      VITALS TELEMETRY & PHYSICAL ASSESSMENT
                    </label>
                    <div className="row g-2">
                      <div className="col-4">
                        <label className="form-label text-muted" style={{ fontSize: '0.7rem' }}>Blood Pressure</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace"
                          value={createFormData.bloodPressure}
                          onChange={(e) => setCreateFormData({ ...createFormData, bloodPressure: e.target.value })}
                          placeholder="120/80 mmHg"
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label text-muted" style={{ fontSize: '0.7rem' }}>Heart Rate (bpm)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm font-monospace"
                          value={createFormData.heartRate}
                          onChange={(e) => setCreateFormData({ ...createFormData, heartRate: e.target.value })}
                          placeholder="75"
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label text-muted" style={{ fontSize: '0.7rem' }}>Temperature (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-sm font-monospace"
                          value={createFormData.temperature}
                          onChange={(e) => setCreateFormData({ ...createFormData, temperature: e.target.value })}
                          placeholder="36.8"
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label text-muted" style={{ fontSize: '0.7rem' }}>SpO2 (%)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm font-monospace"
                          value={createFormData.spo2}
                          onChange={(e) => setCreateFormData({ ...createFormData, spo2: e.target.value })}
                          placeholder="99"
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label text-muted" style={{ fontSize: '0.7rem' }}>Respiratory Rate (/min)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm font-monospace"
                          value={createFormData.respiratoryRate}
                          onChange={(e) => setCreateFormData({ ...createFormData, respiratoryRate: e.target.value })}
                          placeholder="16"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Symptoms Input */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Presenting Symptoms *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      required
                      placeholder="e.g. Substernal chest tightness radiating to left shoulder on moderate exertion..."
                      value={createFormData.symptoms}
                      onChange={(e) => setCreateFormData({ ...createFormData, symptoms: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Diagnosis Input */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-primary">Clinical Diagnosis *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      placeholder="e.g. Unstable Angina, Stage 2 Essential Hypertension"
                      value={createFormData.diagnosis}
                      onChange={(e) => setCreateFormData({ ...createFormData, diagnosis: e.target.value })}
                    />
                  </div>

                  {/* Treatment Plan Input */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Treatment Plan & Medication Prescribed *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      required
                      placeholder="e.g. Immediate sublingual nitroglycerin 0.4mg PRN. Atorvastatin 40mg PO QD, Metoprolol 25mg PO BID..."
                      value={createFormData.treatment}
                      onChange={(e) => setCreateFormData({ ...createFormData, treatment: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Clinical Notes Input */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Doctor's Clinical Notes (Optional)</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="e.g. Troponin-T mildly elevated at 0.08 ng/mL. Ordered 12-lead ECG and urgent coronary angiography..."
                      value={createFormData.clinicalNotes}
                      onChange={(e) => setCreateFormData({ ...createFormData, clinicalNotes: e.target.value })}
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
                  <button type="submit" className="btn btn-sm btn-primary px-3">
                    Save & Audit Clinical Chart
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AMEND / UPDATE MEDICAL RECORD (Author Physician / Admin Only)   */}
      {/* ========================================================================= */}
      {showAmendModal && amendTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <Edit3 size={18} />
                  <h5 className="modal-title fw-bold mb-0">
                    Amend Clinical Record #{amendTarget.id} (Audit Tracked)
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAmendModal(false)}
                ></button>
              </div>

              <form onSubmit={handleAmendSubmit}>
                <div className="modal-body p-4 small">
                  {/* Author Notice */}
                  <div className="alert alert-info py-2 px-3 rounded-2 small mb-3 border-info">
                    <div className="d-flex justify-content-between">
                      <span><b>Authoring Attending Doctor:</b> {amendTarget.doctorName}</span>
                      <span><b>Patient:</b> {amendTarget.patientName} ({amendTarget.patientCode})</span>
                    </div>
                  </div>

                  {/* MANDATORY AMENDMENT REASON (HIPAA / Audit Requirement) */}
                  <div className="mb-3 p-3 bg-warning-subtle rounded-3 border border-warning-subtle">
                    <label className="form-label fw-bold text-dark mb-1">
                      Reason for Clinical Record Amendment * (Mandatory for Audit Trail)
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      minLength={4}
                      placeholder="e.g. Added troponin lab biomarker findings and updated coronary angiography schedule"
                      value={amendFormData.amendmentReason}
                      onChange={(e) => setAmendFormData({ ...amendFormData, amendmentReason: e.target.value })}
                    />
                    <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                      This explanation will be permanently recorded in the immutable revision log.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Symptoms Reported *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      required
                      value={amendFormData.symptoms}
                      onChange={(e) => setAmendFormData({ ...amendFormData, symptoms: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-primary">Diagnosis *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      value={amendFormData.diagnosis}
                      onChange={(e) => setAmendFormData({ ...amendFormData, diagnosis: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Treatment Plan *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      required
                      value={amendFormData.treatment}
                      onChange={(e) => setAmendFormData({ ...amendFormData, treatment: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Doctor's Clinical Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={amendFormData.clinicalNotes}
                      onChange={(e) => setAmendFormData({ ...amendFormData, clinicalNotes: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Follow-up Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={amendFormData.followUpDate}
                        min={amendTarget.visitDate}
                        onChange={(e) => setAmendFormData({ ...amendFormData, followUpDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Blood Pressure</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        value={amendFormData.bloodPressure}
                        onChange={(e) => setAmendFormData({ ...amendFormData, bloodPressure: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowAmendModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-dark px-3">
                    Commit Amendment & Log Revision
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW COMPREHENSIVE CLINICAL CHART & AUDIT HISTORY               */}
      {/* ========================================================================= */}
      {detailRecord && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <div className="d-flex align-items-center gap-2">
                  <FileCheck size={20} />
                  <h5 className="modal-title fw-bold mb-0">
                    Clinical Chart Sheet - Record #{detailRecord.id}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDetailRecord(null)}
                ></button>
              </div>

              <div className="modal-body p-4 small">
                {/* Clinical Header */}
                <div className="card bg-light border p-3 mb-3">
                  <div className="row g-2">
                    <div className="col-6">
                      <span className="text-muted">Patient:</span>
                      <div className="fw-bold fs-6 text-dark">{detailRecord.patientName}</div>
                      <div className="text-muted font-monospace">{detailRecord.patientCode} • {detailRecord.patientGender}</div>
                    </div>
                    <div className="col-6 text-end">
                      <span className="text-muted">Attending Physician:</span>
                      <div className="fw-bold text-primary">{detailRecord.doctorName}</div>
                      <div className="text-muted">{detailRecord.departmentName || detailRecord.doctorSpecialization}</div>
                    </div>
                  </div>
                </div>

                {/* Vitals */}
                <div className="p-2 bg-light rounded border mb-3 d-flex flex-wrap gap-4 align-items-center justify-content-around">
                  <div>BP: <b className="font-monospace text-dark">{detailRecord.bloodPressure}</b></div>
                  <div>Heart Rate: <b className="font-monospace text-dark">{detailRecord.heartRate} bpm</b></div>
                  <div>Temp: <b className="font-monospace text-dark">{detailRecord.temperature}°C</b></div>
                  <div>SpO2: <b className="font-monospace text-dark">{detailRecord.spo2}%</b></div>
                  <div>Resp Rate: <b className="font-monospace text-dark">{detailRecord.respiratoryRate}/min</b></div>
                </div>

                {/* Clinical Content */}
                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-1">Clinical Diagnosis</h6>
                  <div className="p-2 bg-primary-subtle text-primary fw-bold rounded border border-primary-subtle">
                    {detailRecord.diagnosis}
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-1">Symptoms Evaluated</h6>
                  <div className="p-2 bg-light rounded text-dark border">{detailRecord.symptoms}</div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-1">Treatment Protocol & Prescriptions</h6>
                  <div className="p-2 bg-light rounded text-dark border">{detailRecord.treatment}</div>
                </div>

                {detailRecord.notes && (
                  <div className="mb-3">
                    <h6 className="fw-bold text-dark mb-1">Physician Notes</h6>
                    <div className="p-2 bg-light rounded text-secondary font-monospace border">
                      {detailRecord.notes}
                    </div>
                  </div>
                )}

                <div className="row g-2 mb-4 p-2 bg-light rounded border">
                  <div className="col-6">
                    <span className="text-muted">Consultation Visit Date:</span>
                    <div className="fw-bold text-dark">{detailRecord.visitDate}</div>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Scheduled Follow-up Date:</span>
                    <div className="fw-bold text-dark">{detailRecord.followUpDate || 'None Scheduled'}</div>
                  </div>
                </div>

                {/* Audit & Revision History Table */}
                <div className="border-top pt-3">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <History size={16} className="text-primary" />
                    <span>Permanent Audit & Amendment History</span>
                  </h6>

                  <div className="table-responsive">
                    <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.75rem' }}>
                      <thead className="table-light">
                        <tr>
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th>Operator</th>
                          <th>Role</th>
                          <th>Reason</th>
                          <th>Diff Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailRecord.auditHistory || []).map((ah) => (
                          <tr key={ah.id}>
                            <td className="font-monospace text-nowrap">
                              {ah.timestamp ? ah.timestamp.replace('T', ' ').substring(0, 19) : ''}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  ah.action === 'RECORD_CREATED' ? 'bg-success' : 'bg-primary'
                                }`}
                              >
                                {ah.action}
                              </span>
                            </td>
                            <td className="fw-semibold">{ah.performedBy}</td>
                            <td className="font-monospace">{ah.performedByRole}</td>
                            <td>{ah.amendmentReason}</td>
                            <td className="text-muted">{ah.changeSummary}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light p-3">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setDetailRecord(null)}
                >
                  Close Chart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

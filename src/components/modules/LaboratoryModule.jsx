import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDataService } from '../../services/mockDataService';
import { RuleBadge } from '../common/RuleBadge';
import {
  FlaskConical,
  TestTube2,
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  User,
  Calendar,
  Stethoscope,
  Printer,
  XCircle,
  FileText,
  Barcode,
  Layers,
  Sparkles,
  Eye,
  Check,
  AlertCircle,
  Microscope,
  FileCheck,
  Zap,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import Swal from 'sweetalert2';

export const LaboratoryModule = () => {
  const { currentUser, hasRole } = useAuth();

  // Navigation: 'directory' | 'bench' | 'reports' | 'patient-portal' | 'sandbox'
  const [activeTab, setActiveTab] = useState('directory');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTestForAssign, setSelectedTestForAssign] = useState(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [selectedTestForSample, setSelectedTestForSample] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedTestForResults, setSelectedTestForResults] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportToView, setSelectedReportToView] = useState(null);

  // Role Checks
  const isDoctor = hasRole('DOCTOR', 'ADMIN');
  const isLabTech = hasRole('LAB_TECHNICIAN', 'ADMIN');
  const isNurse = hasRole('NURSE');
  const isStaffAuthorizedToOrder = hasRole('DOCTOR', 'ADMIN', 'NURSE');
  const isPatientPersona = currentUser?.role === 'PATIENT';

  // Resolved active patient ID if patient persona
  const activePatientId = useMemo(() => {
    if (isPatientPersona) {
      const patients = mockDataService.getPatients();
      const p = patients.find(
        (pt) => pt.patientCode === currentUser.patientCode || pt.id === currentUser.id || pt.id === 1
      );
      return p ? String(p.id) : '1';
    }
    return '';
  }, [isPatientPersona, currentUser]);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // Query lab tests
  const queryFilters = useMemo(() => {
    return {
      search: searchTerm,
      status: selectedStatus,
      category: selectedCategory,
      priority: selectedPriority,
      patientId: isPatientPersona ? activePatientId : selectedPatientId,
    };
  }, [searchTerm, selectedStatus, selectedCategory, selectedPriority, selectedPatientId, isPatientPersona, activePatientId]);

  const paginatedResult = useMemo(() => {
    return mockDataService.getLabTests(queryFilters, currentPage, pageSize);
  }, [queryFilters, currentPage, pageSize, refreshTrigger]);

  const tests = paginatedResult.content || [];
  const totalElements = paginatedResult.totalElements || 0;
  const totalPages = paginatedResult.totalPages || 1;

  // Master Data
  const patients = mockDataService.getPatients();
  const doctors = mockDataService.getDoctors();
  const labSummary = useMemo(() => mockDataService.getLabSummary(), [refreshTrigger]);
  const allReports = useMemo(() => {
    return mockDataService.getLabReports(
      isPatientPersona ? activePatientId : null,
      currentUser?.username,
      currentUser?.role
    );
  }, [isPatientPersona, activePatientId, currentUser, refreshTrigger]);

  // Categories
  const categories = [
    'HEMATOLOGY',
    'BIOCHEMISTRY',
    'MICROBIOLOGY',
    'IMMUNOLOGY',
    'URINALYSIS',
    'PATHOLOGY',
    'CARDIOLOGY',
    'RADIOLOGY',
  ];

  // =========================================================================
  // WORKFLOW ACTION HANDLERS
  // =========================================================================

  const handleAssignTechnician = (test, techName) => {
    try {
      mockDataService.assignLabTechnician(
        test.id,
        techName || 'Rachel Zane, MLS',
        currentUser?.role,
        currentUser?.name || currentUser?.username
      );
      triggerRefresh();
      setShowAssignModal(false);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Technician assigned to Test #${test.id}`,
        showConfirmButton: false,
        timer: 1600,
      });
    } catch (err) {
      Swal.fire('Operation Blocked', err.message, 'error');
    }
  };

  const handleCollectSample = (test, sampleType, customBarcode) => {
    try {
      mockDataService.collectLabSample(
        test.id,
        { sampleType, sampleBarcode: customBarcode },
        currentUser?.role,
        currentUser?.name || currentUser?.username
      );
      triggerRefresh();
      setShowSampleModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Specimen Accessioned',
        text: `Sample barcoded (${customBarcode || `SMP-${test.id}`}) and assigned to analysis queue.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Specimen Error', err.message, 'error');
    }
  };

  const handleStartProcessing = (test) => {
    try {
      mockDataService.startLabProcessing(
        test.id,
        currentUser?.role,
        currentUser?.name || currentUser?.username
      );
      triggerRefresh();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: `Test #${test.id} analyzer analysis started`,
        showConfirmButton: false,
        timer: 1600,
      });
    } catch (err) {
      Swal.fire('Processing Blocked', err.message, 'error');
    }
  };

  const handleRecordResults = (test, resultData) => {
    try {
      mockDataService.recordLabResults(
        test.id,
        resultData,
        currentUser?.role,
        currentUser?.name || currentUser?.username
      );
      triggerRefresh();
      setShowResultsModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Findings Recorded',
        text: `Results successfully logged for ${test.testName}. Ready for clinical pathologist report sign-off.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      if (err.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'SRS Rule 6 Violation (HTTP 403)',
          html: `<p><b>Certified Laboratory Technician Clearance Required:</b> Only authorized laboratory technicians can enter clinical findings.</p><p class="text-muted small">Current Role: <code>${currentUser?.role}</code></p>`,
          confirmButtonColor: '#dc3545',
        });
      } else {
        Swal.fire('Result Entry Failed', err.message, 'error');
      }
    }
  };

  const handleGenerateReport = (test) => {
    try {
      const report = mockDataService.generateLabReport(
        test.id,
        'Dr. Arthur Vance (Chief Pathologist)',
        currentUser?.role,
        currentUser?.name || currentUser?.username
      );
      triggerRefresh();
      Swal.fire({
        icon: 'success',
        title: 'Lab Report Finalized & Signed',
        text: `Diagnostic report ${report.reportNumber} generated. Available to attending doctor and patient.`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire('Report Generation Blocked', err.message, 'error');
    }
  };

  const handleCancelTest = (test) => {
    Swal.fire({
      title: `Cancel Test Order #${test.id}?`,
      text: `Test: ${test.testName}. Please specify cancellation clinical justification.`,
      input: 'text',
      inputPlaceholder: 'Reason for cancellation (e.g. Duplicated requisition, Patient refused venipuncture)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Confirm Cancellation',
      inputValidator: (val) => {
        if (!val || !val.trim()) return 'Cancellation reason is required!';
      },
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          mockDataService.cancelLabTest(test.id, result.value, currentUser?.role, currentUser?.name);
          triggerRefresh();
          Swal.fire('Cancelled', `Test order #${test.id} was revoked.`, 'success');
        } catch (err) {
          Swal.fire('Cancellation Denied', err.message, 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ORDERED':
        return <span className="badge bg-secondary font-monospace">1. ORDERED</span>;
      case 'ASSIGNED':
        return <span className="badge bg-info text-dark font-monospace">2. ASSIGNED</span>;
      case 'SAMPLE_COLLECTED':
        return <span className="badge bg-warning text-dark font-monospace">3. SAMPLE COLLECTED</span>;
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return <span className="badge bg-primary font-monospace">4. PROCESSING</span>;
      case 'RESULT_ENTERED':
        return <span className="badge font-monospace text-white" style={{ backgroundColor: '#0F766E' }}>5. RESULTS ENTERED</span>;
      case 'COMPLETED':
        return <span className="badge bg-success font-monospace">6. REPORT FINALIZED</span>;
      case 'CANCELLED':
        return <span className="badge bg-danger font-monospace">CANCELLED</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'STAT') {
      return <span className="badge bg-danger text-white fw-bold font-monospace animate-pulse">STAT (Immediate)</span>;
    }
    if (priority === 'URGENT') {
      return <span className="badge bg-warning text-dark fw-bold font-monospace">URGENT</span>;
    }
    return <span className="badge bg-light text-secondary border font-monospace">ROUTINE</span>;
  };

  return (
    <div className="container-fluid p-4">
      {/* 1. Header with Workflow Rule Badges */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <h2 className="fw-bold text-dark mb-0">Laboratory & Diagnostic Management</h2>
            <RuleBadge ruleNumber={6} title="Lab Tech Result Entry" />
            <RuleBadge ruleNumber={9} title="Patient PHI Isolation" />
          </div>
          <p className="text-muted small mb-0">
            End-to-end laboratory order lifecycle: Requisition → Technician Assignment → Sample Collection → Analyzer Processing → Results Recording → Final Diagnostic Report.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isStaffAuthorizedToOrder && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-2"
            >
              <Plus size={15} />
              <span>Create Test Requisition</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`btn btn-sm px-3 shadow-sm d-flex align-items-center gap-2 ${
              activeTab === 'sandbox' ? 'btn-danger' : 'btn-outline-danger'
            }`}
          >
            <ShieldAlert size={15} />
            <span>Workflow & Security Sandbox</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Workflow Progression Bar */}
      <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 p-3 overflow-x-auto">
        <div className="d-flex align-items-center justify-content-between text-center gap-2" style={{ minWidth: '700px' }}>
          <div className="flex-fill p-2 rounded bg-light border">
            <div className="fw-bold text-dark small">1. Requisition</div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Doctor / Nurse Order</div>
          </div>
          <ArrowRight size={16} className="text-muted flex-shrink-0" />
          <div className="flex-fill p-2 rounded bg-light border">
            <div className="fw-bold text-dark small">2. Assignment</div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Assign Lab Specialist</div>
          </div>
          <ArrowRight size={16} className="text-muted flex-shrink-0" />
          <div className="flex-fill p-2 rounded bg-light border">
            <div className="fw-bold text-dark small">3. Specimen Intake</div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Barcode Accessioning</div>
          </div>
          <ArrowRight size={16} className="text-muted flex-shrink-0" />
          <div className="flex-fill p-2 rounded bg-light border">
            <div className="fw-bold text-dark small">4. Analysis Bench</div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Analyzer Run</div>
          </div>
          <ArrowRight size={16} className="text-muted flex-shrink-0" />
          <div className="flex-fill p-2 rounded bg-light border">
            <div className="fw-bold text-dark small">5. Results Entry</div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Rule 6: Tech Only</div>
          </div>
          <ArrowRight size={16} className="text-muted flex-shrink-0" />
          <div className="flex-fill p-2 rounded bg-success-subtle border border-success">
            <div className="fw-bold text-success small">6. Final Report</div>
            <div className="text-success" style={{ fontSize: '0.7rem' }}>Pathologist Sign-Off</div>
          </div>
        </div>
      </div>

      {/* 3. Role Restriction Alert if Patient Persona */}
      {isPatientPersona && (
        <div className="alert alert-info py-2 px-3 rounded-3 small d-flex align-items-center justify-content-between mb-4 border-info">
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={18} className="text-info flex-shrink-0" />
            <span>
              <b>SRS Rule 9 Privacy Isolation Active:</b> You are signed in as Patient <b>{currentUser?.fullName || currentUser?.username}</b>. You can view only your authorized diagnostic laboratory tests and finalized clinical reports.
            </span>
          </div>
          <span className="badge bg-dark font-monospace">Patient Portal Mode</span>
        </div>
      )}

      {/* 4. Real-Time Summary Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Total Orders</span>
              <FlaskConical size={18} className="text-primary" />
            </div>
            <div className="fs-4 fw-bold text-dark">{labSummary.totalTests}</div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>All-time requisitions</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Pending Specimen</span>
              <TestTube2 size={18} className="text-warning" />
            </div>
            <div className="fs-4 fw-bold text-warning-emphasis">
              {labSummary.orderedCount + labSummary.assignedCount}
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>Awaiting phlebotomy</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">In Processing</span>
              <Microscope size={18} className="text-info" />
            </div>
            <div className="fs-4 fw-bold text-info">
              {labSummary.sampleCollectedCount + labSummary.processingCount}
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>On analyzer equipment</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Awaiting Sign-Off</span>
              <Activity size={18} className="text-primary" />
            </div>
            <div className="fs-4 fw-bold" style={{ color: '#0B5C75' }}>
              {labSummary.resultEnteredCount}
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>Results entered, ready</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Finalized Reports</span>
              <FileCheck size={18} className="text-success" />
            </div>
            <div className="fs-4 fw-bold text-success">{labSummary.completedCount}</div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>Clinical sign-off complete</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className={`card border-0 shadow-sm rounded-3 p-3 h-100 ${labSummary.statUrgentCount > 0 ? 'bg-danger-subtle' : 'bg-white'}`}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">STAT / Urgent</span>
              <Zap size={18} className="text-danger" />
            </div>
            <div className="fs-4 fw-bold text-danger">{labSummary.statUrgentCount}</div>
            <div className="text-danger small mt-1 fw-semibold" style={{ fontSize: '0.72rem' }}>
              High-priority alerts
            </div>
          </div>
        </div>
      </div>

      {/* 5. Navigation Tabs */}
      <div className="d-flex align-items-center gap-2 border-bottom mb-4">
        <button
          onClick={() => setActiveTab('directory')}
          className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
            activeTab === 'directory' ? 'border-primary text-primary' : 'border-transparent text-muted'
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <FlaskConical size={16} />
            <span>Orders & Active Pipeline</span>
            <span className="badge bg-light text-dark ms-1">{totalElements}</span>
          </div>
        </button>

        {isLabTech && (
          <button
            onClick={() => setActiveTab('bench')}
            className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
              activeTab === 'bench' ? 'border-primary text-primary' : 'border-transparent text-muted'
            }`}
          >
            <div className="d-flex align-items-center gap-2">
              <Microscope size={16} />
              <span>Technician Workstation</span>
              <span className="badge bg-primary text-white ms-1">
                {labSummary.sampleCollectedCount + labSummary.processingCount + labSummary.resultEnteredCount}
              </span>
            </div>
          </button>
        )}

        <button
          onClick={() => setActiveTab('reports')}
          className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
            activeTab === 'reports' ? 'border-primary text-primary' : 'border-transparent text-muted'
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <FileText size={16} />
            <span>Diagnostic Reports Archive</span>
            <span className="badge bg-success ms-1">{allReports.length}</span>
          </div>
        </button>

        {isPatientPersona && (
          <button
            onClick={() => setActiveTab('patient-portal')}
            className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
              activeTab === 'patient-portal' ? 'border-primary text-primary' : 'border-transparent text-muted'
            }`}
          >
            <div className="d-flex align-items-center gap-2">
              <User size={16} />
              <span>My Lab History</span>
            </div>
          </button>
        )}

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
            activeTab === 'sandbox' ? 'border-danger text-danger' : 'border-transparent text-muted'
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <ShieldAlert size={16} />
            <span>Workflow Sandbox</span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORDERS & ACTIVE PIPELINE */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div>
          {/* Filter Bar */}
          <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <Search size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search test, patient, barcode, report..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setSearchTerm('')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(0);
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ORDERED">1. ORDERED</option>
                  <option value="ASSIGNED">2. ASSIGNED</option>
                  <option value="SAMPLE_COLLECTED">3. SAMPLE COLLECTED</option>
                  <option value="PROCESSING">4. PROCESSING</option>
                  <option value="RESULT_ENTERED">5. RESULTS ENTERED</option>
                  <option value="COMPLETED">6. COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(0);
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value);
                    setCurrentPage(0);
                  }}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="STAT">STAT (Immediate)</option>
                </select>
              </div>

              {!isPatientPersona && (
                <div className="col-6 col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={selectedPatientId}
                    onChange={(e) => {
                      setSelectedPatientId(e.target.value);
                      setCurrentPage(0);
                    }}
                  >
                    <option value="">All Patients</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patientCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="card border-0 shadow-sm rounded-3 bg-white mb-3">
            <div className="card-body p-0 table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>Test Order & Category</th>
                    <th>Patient Demographics</th>
                    <th>Attending Doctor</th>
                    <th>Priority</th>
                    <th>Specimen Barcode</th>
                    <th>Workflow Status</th>
                    <th>Assigned Tech</th>
                    <th className="text-end">Next Action</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {tests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        <FlaskConical size={36} className="text-muted mb-2 opacity-50" />
                        <div>No laboratory test orders found matching your filters.</div>
                      </td>
                    </tr>
                  ) : (
                    tests.map((test) => (
                      <tr key={test.id} className={test.priority === 'STAT' && test.status !== 'COMPLETED' ? 'table-danger-subtle' : ''}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-dark border font-monospace">#{test.id}</span>
                            <div className="fw-bold text-dark">{test.testName}</div>
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {test.category} • Ordered: {new Date(test.orderedAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td>
                          <div className="fw-semibold text-dark">{test.patientName}</div>
                          <span className="badge bg-light text-secondary border font-monospace">
                            {test.patientCode} ({test.patientGender})
                          </span>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-1 text-muted">
                            <Stethoscope size={13} />
                            <span>{test.doctorName || 'Dr. Eleanor Sterling'}</span>
                          </div>
                        </td>

                        <td>{getPriorityBadge(test.priority)}</td>

                        <td>
                          {test.sampleBarcode ? (
                            <div>
                              <span className="badge bg-light text-dark border font-monospace">
                                {test.sampleBarcode}
                              </span>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {test.sampleType}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted fst-italic">Pending Intake</span>
                          )}
                        </td>

                        <td>{getStatusBadge(test.status)}</td>

                        <td>
                          <span className="text-muted">
                            {test.assignedTechnician || 'Unassigned'}
                          </span>
                        </td>

                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-1 flex-wrap">
                            {/* State 1: ORDERED -> Assign Tech */}
                            {test.status === 'ORDERED' && (
                              <button
                                onClick={() => {
                                  setSelectedTestForAssign(test);
                                  setShowAssignModal(true);
                                }}
                                className="btn btn-outline-info btn-sm p-1 px-2"
                                title="Assign Laboratory Specialist"
                              >
                                Assign Tech
                              </button>
                            )}

                            {/* State 2: ASSIGNED -> Collect Sample */}
                            {test.status === 'ASSIGNED' && (
                              <button
                                onClick={() => {
                                  setSelectedTestForSample(test);
                                  setShowSampleModal(true);
                                }}
                                className="btn btn-warning btn-sm p-1 px-2 text-dark"
                                title="Collect Specimen & Generate Barcode"
                              >
                                Collect Sample
                              </button>
                            )}

                            {/* State 3: SAMPLE_COLLECTED -> Start Processing */}
                            {test.status === 'SAMPLE_COLLECTED' && (
                              <button
                                onClick={() => handleStartProcessing(test)}
                                className="btn btn-primary btn-sm p-1 px-2"
                                title="Load Specimen onto Analyzer Equipment"
                              >
                                Run Analysis
                              </button>
                            )}

                            {/* State 4: PROCESSING -> Record Results (SRS Rule 6: Tech only) */}
                            {test.status === 'PROCESSING' && (
                              <button
                                onClick={() => {
                                  setSelectedTestForResults(test);
                                  setShowResultsModal(true);
                                }}
                                className="btn btn-primary btn-sm p-1 px-2 text-white"
                                style={{ backgroundColor: '#0B5C75', borderColor: '#0B5C75' }}
                                title="Enter Diagnostic Findings (Tech only)"
                              >
                                Record Results
                              </button>
                            )}

                            {/* State 5: RESULT_ENTERED -> Generate Lab Report */}
                            {test.status === 'RESULT_ENTERED' && (
                              <button
                                onClick={() => handleGenerateReport(test)}
                                className="btn btn-success btn-sm p-1 px-2"
                                title="Verify Findings and Finalize Lab Report"
                              >
                                Sign & Report
                              </button>
                            )}

                            {/* State 6: COMPLETED -> View Final Report */}
                            {test.status === 'COMPLETED' && (
                              <button
                                onClick={() => {
                                  const rep = mockDataService.getLabReports().find((r) => r.labTestId === test.id);
                                  if (rep) {
                                    setSelectedReportToView(rep);
                                    setShowReportModal(true);
                                  } else {
                                    Swal.fire('Report Note', 'Diagnostic report generated. Review in Reports tab.', 'info');
                                  }
                                }}
                                className="btn btn-outline-success btn-sm p-1 px-2 d-flex align-items-center gap-1"
                                title="View Printable Diagnostic Report"
                              >
                                <Eye size={13} />
                                <span>Report</span>
                              </button>
                            )}

                            {/* Cancel Option for Non-Completed Tests */}
                            {test.status !== 'COMPLETED' && test.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleCancelTest(test)}
                                className="btn btn-outline-danger btn-sm p-1"
                                title="Revoke Test Order"
                              >
                                <XCircle size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="card-footer bg-white border-top py-2 d-flex align-items-center justify-content-between">
                <span className="small text-muted">
                  Page {currentPage + 1} of {totalPages} ({totalElements} total requisitions)
                </span>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TECHNICIAN WORKBENCH */}
      {/* ========================================================================= */}
      {activeTab === 'bench' && isLabTech && (
        <div>
          <div className="alert alert-info py-2 px-3 rounded-3 small d-flex align-items-center justify-content-between mb-4 border-info">
            <div className="d-flex align-items-center gap-2">
              <Microscope size={18} className="text-info flex-shrink-0" />
              <span>
                <b>Technician Clinical Bench:</b> Live queue of specimens to collect, analyzer batches to process, and diagnostic values to record under <b>SRS Rule 6</b>.
              </span>
            </div>
            <span className="badge bg-dark font-monospace">Operator: {currentUser?.fullName || 'Rachel Zane, MLS'}</span>
          </div>

          <div className="row g-4">
            {/* Phlebotomy / Specimen Intake Queue */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <TestTube2 size={16} className="text-warning" />
                    <span>Specimen Accessioning Queue</span>
                  </h6>
                  <span className="badge bg-warning text-dark font-monospace">
                    {tests.filter((t) => t.status === 'ASSIGNED' || t.status === 'ORDERED').length}
                  </span>
                </div>
                <div className="card-body p-3">
                  {tests.filter((t) => t.status === 'ASSIGNED' || t.status === 'ORDERED').length === 0 ? (
                    <div className="text-center py-4 text-muted small">No pending sample collections.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {tests.filter((t) => t.status === 'ASSIGNED' || t.status === 'ORDERED').map((t) => (
                        <div key={t.id} className="p-2 border rounded bg-light small">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <b className="text-dark">#{t.id} - {t.testName}</b>
                            {getPriorityBadge(t.priority)}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Patient: {t.patientName} ({t.patientCode})
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Type: {t.sampleType || 'Venous Blood'}</span>
                            <button
                              onClick={() => {
                                setSelectedTestForSample(t);
                                setShowSampleModal(true);
                              }}
                              className="btn btn-warning btn-sm p-1 px-2 text-dark"
                              style={{ fontSize: '0.72rem' }}
                            >
                              Collect & Accession
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* In Analyzer Processing */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <Microscope size={16} className="text-info" />
                    <span>In Analyzer Processing</span>
                  </h6>
                  <span className="badge bg-primary font-monospace">
                    {tests.filter((t) => t.status === 'PROCESSING' || t.status === 'SAMPLE_COLLECTED').length}
                  </span>
                </div>
                <div className="card-body p-3">
                  {tests.filter((t) => t.status === 'PROCESSING' || t.status === 'SAMPLE_COLLECTED').length === 0 ? (
                    <div className="text-center py-4 text-muted small">No active analyzer runs.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {tests.filter((t) => t.status === 'PROCESSING' || t.status === 'SAMPLE_COLLECTED').map((t) => (
                        <div key={t.id} className="p-2 border rounded bg-light small">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <b className="text-dark">#{t.id} - {t.testName}</b>
                            <span className="badge bg-light text-dark border font-monospace">{t.sampleBarcode}</span>
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Patient: {t.patientName} • Category: {t.category}
                          </div>
                          <div className="d-flex justify-content-end align-items-center mt-2 pt-2 border-top gap-1">
                            {t.status === 'SAMPLE_COLLECTED' ? (
                              <button
                                onClick={() => handleStartProcessing(t)}
                                className="btn btn-primary btn-sm p-1 px-2"
                                style={{ fontSize: '0.72rem' }}
                              >
                                Start Analyzer
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedTestForResults(t);
                                  setShowResultsModal(true);
                                }}
                                className="btn btn-primary btn-sm p-1 px-2 text-white"
                                style={{ backgroundColor: '#0B5C75', borderColor: '#0B5C75', fontSize: '0.72rem' }}
                              >
                                Record Results
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Review & Pathologist Report Finalization */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <FileCheck size={16} className="text-success" />
                    <span>Results Awaiting Report Sign-Off</span>
                  </h6>
                  <span className="badge bg-success font-monospace">
                    {tests.filter((t) => t.status === 'RESULT_ENTERED').length}
                  </span>
                </div>
                <div className="card-body p-3">
                  {tests.filter((t) => t.status === 'RESULT_ENTERED').length === 0 ? (
                    <div className="text-center py-4 text-muted small">No findings awaiting sign-off.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {tests.filter((t) => t.status === 'RESULT_ENTERED').map((t) => (
                        <div key={t.id} className="p-2 border rounded bg-light small">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <b className="text-dark">#{t.id} - {t.testName}</b>
                            <span className={`badge ${t.interpretation === 'NORMAL' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {t.interpretation || 'ENTERED'}
                            </span>
                          </div>
                          <div className="text-dark fw-semibold" style={{ fontSize: '0.75rem' }}>
                            {t.resultValue}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Entered by: {t.technicianName}
                          </div>
                          <div className="d-flex justify-content-end align-items-center mt-2 pt-2 border-top">
                            <button
                              onClick={() => handleGenerateReport(t)}
                              className="btn btn-success btn-sm p-1 px-2"
                              style={{ fontSize: '0.72rem' }}
                            >
                              Finalize & Generate Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DIAGNOSTIC REPORTS ARCHIVE */}
      {/* ========================================================================= */}
      {(activeTab === 'reports' || activeTab === 'patient-portal') && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold text-dark mb-0">
              {activeTab === 'patient-portal' ? 'My Authorized Diagnostic Reports' : 'Finalized Diagnostic Lab Reports Archive'}
            </h5>
            <span className="badge bg-light text-dark border font-monospace">
              {allReports.length} Available Reports
            </span>
          </div>

          <div className="card border-0 shadow-sm rounded-3 bg-white">
            <div className="card-body p-0 table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>Report #</th>
                    <th>Patient Name</th>
                    <th>Diagnostic Test</th>
                    <th>Clinical Category</th>
                    <th>Interpretation</th>
                    <th>Reported Date</th>
                    <th>Attending Doctor</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {allReports.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        <FileText size={36} className="text-muted mb-2 opacity-50" />
                        <div>No diagnostic reports found for this patient.</div>
                      </td>
                    </tr>
                  ) : (
                    allReports.map((rep) => (
                      <tr key={rep.id}>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace fw-bold">
                            {rep.reportNumber}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{rep.patientName}</div>
                          <span className="font-monospace text-muted" style={{ fontSize: '0.72rem' }}>
                            {rep.patientCode}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{rep.testName}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Specimen: {rep.sampleType || 'Blood'} (Barcode: {rep.sampleBarcode || 'N/A'})
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-secondary border font-monospace">
                            {rep.category}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              rep.interpretation === 'NORMAL'
                                ? 'bg-success'
                                : rep.interpretation === 'CRITICAL'
                                ? 'bg-danger'
                                : 'bg-warning text-dark'
                            }`}
                          >
                            {rep.interpretation}
                          </span>
                        </td>
                        <td>
                          <span className="font-monospace text-muted">
                            {new Date(rep.reportedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span className="text-dark fw-semibold">{rep.doctorName}</span>
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => {
                              setSelectedReportToView(rep);
                              setShowReportModal(true);
                            }}
                            className="btn btn-outline-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1 ms-auto"
                          >
                            <Eye size={13} />
                            <span>View Full Report</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: WORKFLOW & SECURITY VERIFICATION SANDBOX */}
      {/* ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div>
          <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <ShieldCheck size={24} className="text-primary" />
              <h5 className="fw-bold mb-0 text-dark">
                Interactive Laboratory Workflow & Security Verification Sandbox
              </h5>
            </div>
            <p className="text-muted small mb-0">
              One-click verification scenarios executing live business rule and state transition validations across the Spring Boot backend layer and frontend service.
            </p>
          </div>

          <div className="row g-4">
            {/* Scenario 1: Rule 6 Technician Result Entry */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-danger font-monospace">SCENARIO 1</span>
                  <span className="badge bg-light text-secondary border">SRS Rule 6</span>
                </div>
                <h6 className="fw-bold text-dark">Doctor / Patient Result Entry Block (HTTP 403)</h6>
                <p className="small text-muted mb-3">
                  Attempts to enter diagnostic test findings under a Doctor or Patient role. Proves that only licensed <code>LAB_TECHNICIAN</code> or <code>ADMIN</code> users can record results.
                </p>

                <div className="d-flex gap-2 mb-3">
                  <button
                    onClick={() => {
                      try {
                        mockDataService.recordLabResults(
                          1,
                          { resultValue: 'Hb: 14.5' },
                          'DOCTOR',
                          'Dr. Eleanor Sterling'
                        );
                      } catch (err) {
                        Swal.fire({
                          icon: 'error',
                          title: 'HTTP 403 Forbidden (SRS Rule 6)',
                          html: `<div class="text-start">
                            <p class="font-monospace text-danger small">${err.message}</p>
                            <p class="small text-muted mb-0">Enforced by Spring Security <code>@PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'ADMIN')")</code>.</p>
                          </div>`,
                        });
                      }
                    }}
                    className="btn btn-outline-warning text-dark btn-sm"
                  >
                    Simulate Doctor Attempt (403)
                  </button>

                  <button
                    onClick={() => {
                      try {
                        mockDataService.recordLabResults(
                          1,
                          { resultValue: 'Self reported 120' },
                          'PATIENT',
                          'Johnathan Doe'
                        );
                      } catch (err) {
                        Swal.fire({
                          icon: 'error',
                          title: 'HTTP 403 Forbidden (SRS Rule 6)',
                          html: `<div class="text-start">
                            <p class="font-monospace text-danger small">${err.message}</p>
                            <p class="small text-muted mb-0">Patients are completely locked out from laboratory result recording.</p>
                          </div>`,
                        });
                      }
                    }}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Simulate Patient Attempt (403)
                  </button>
                </div>

                <div className="border rounded p-2 bg-light small text-muted">
                  Guarantees laboratory result integrity and prevents unaccredited clinicians or patients from tampering with diagnostics.
                </div>
              </div>
            </div>

            {/* Scenario 2: Rule 9 Patient PHI Isolation */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-warning text-dark font-monospace">SCENARIO 2</span>
                  <span className="badge bg-light text-secondary border">SRS Rule 9</span>
                </div>
                <h6 className="fw-bold text-dark">Cross-Patient Lab Report Access Lockout (HTTP 403)</h6>
                <p className="small text-muted mb-3">
                  Simulates Patient A attempting to view Patient B's laboratory diagnostic test or report.
                </p>

                <button
                  onClick={() => {
                    try {
                      // Patient John (ID: 1) attempting to view Jane Smith's (Patient 2) test #3
                      mockDataService.getLabTestById(3, 'patient_john', 'PATIENT');
                    } catch (err) {
                      Swal.fire({
                        icon: 'error',
                        title: 'HTTP 403 Forbidden (SRS Rule 9)',
                        html: `<div class="text-start">
                          <p class="font-monospace text-danger small">${err.message}</p>
                          <p class="small text-muted mb-0">Patient PHI Isolation is strictly enforced across queries.</p>
                        </div>`,
                      });
                    }
                  }}
                  className="btn btn-outline-danger btn-sm mb-3"
                >
                  Simulate Cross-Patient Report Query (403)
                </button>

                <div className="border rounded p-2 bg-light small text-muted">
                  Enforces HIPAA and hospital privacy compliance by isolating laboratory test results per patient identifier.
                </div>
              </div>
            </div>

            {/* Scenario 3: Invalid Workflow Progression Rejection */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-primary font-monospace">SCENARIO 3</span>
                  <span className="badge bg-light text-secondary border">Workflow Guard</span>
                </div>
                <h6 className="fw-bold text-dark">Invalid Status Transition Rejection (HTTP 400)</h6>
                <p className="small text-muted mb-3">
                  Attempts to jump directly from <code>ORDERED</code> to <code>PROCESSING</code> or generate a finalized report without recorded results.
                </p>

                <button
                  onClick={() => {
                    try {
                      // Attempt to start processing on Test #7 (which is only ORDERED, not yet specimen collected)
                      mockDataService.startLabProcessing(7, 'LAB_TECHNICIAN', 'Rachel Zane, MLS');
                    } catch (err) {
                      Swal.fire({
                        icon: 'error',
                        title: 'HTTP 400 Bad Request: Invalid Transition',
                        text: err.message,
                      });
                    }
                  }}
                  className="btn btn-outline-primary btn-sm mb-3"
                >
                  Attempt Illegal Jump: ORDERED → PROCESSING (400)
                </button>

                <div className="border rounded p-2 bg-light small text-muted">
                  Validates the mandatory clinical state machine: <code>ORDERED → ASSIGNED → SAMPLE_COLLECTED → PROCESSING → RESULT_ENTERED → COMPLETED</code>.
                </div>
              </div>
            </div>

            {/* Scenario 4: Terminal Immutability */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-secondary font-monospace">SCENARIO 4</span>
                  <span className="badge bg-light text-secondary border">Audit Integrity</span>
                </div>
                <h6 className="fw-bold text-dark">Completed Report Immutability (HTTP 400)</h6>
                <p className="small text-muted mb-3">
                  Attempts to revoke or cancel a test order that has already been finalized and signed off as a clinical report.
                </p>

                <button
                  onClick={() => {
                    try {
                      // Attempt to cancel Test #1 (already COMPLETED)
                      mockDataService.cancelLabTest(1, 'Accidental cancel attempt', 'DOCTOR', 'Dr. Eleanor Sterling');
                    } catch (err) {
                      Swal.fire({
                        icon: 'error',
                        title: 'HTTP 400 Bad Request: Terminal State',
                        text: err.message,
                      });
                    }
                  }}
                  className="btn btn-outline-secondary btn-sm mb-3"
                >
                  Attempt Cancel on COMPLETED Report (400)
                </button>

                <div className="border rounded p-2 bg-light small text-muted">
                  Guarantees that signed diagnostic reports cannot be arbitrarily deleted or revoked once released into patient records.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE LAB TEST REQUISITION */}
      {/* ========================================================================= */}
      {showOrderModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  const data = {
                    patientId: form.patientId.value,
                    doctorId: form.doctorId.value,
                    testName: form.testName.value,
                    category: form.category.value,
                    priority: form.priority.value,
                    sampleType: form.sampleType.value,
                    clinicalNotes: form.clinicalNotes.value,
                  };

                  try {
                    mockDataService.createLabTestRequest(
                      data,
                      currentUser?.role,
                      currentUser?.name || currentUser?.username
                    );
                    triggerRefresh();
                    setShowOrderModal(false);
                    Swal.fire('Requisition Issued!', `Diagnostic test '${data.testName}' was ordered.`, 'success');
                  } catch (err) {
                    Swal.fire('Requisition Failed', err.message, 'error');
                  }
                }}
              >
                <div className="modal-header bg-light py-3">
                  <h5 className="modal-title fw-bold text-dark">Create Laboratory Test Requisition</h5>
                  <button type="button" className="btn-close" onClick={() => setShowOrderModal(false)} />
                </div>

                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Patient <span className="text-danger">*</span>
                      </label>
                      <select name="patientId" required className="form-select form-select-sm">
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.patientCode}) - {p.gender}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">Attending Physician</label>
                      <select name="doctorId" className="form-select form-select-sm">
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.specialization})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Test Profile Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="testName"
                        required
                        placeholder="e.g. Complete Blood Count (CBC), Lipid Panel"
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label small fw-semibold text-dark">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select name="category" required className="form-select form-select-sm">
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label small fw-semibold text-dark">
                        Clinical Priority <span className="text-danger">*</span>
                      </label>
                      <select name="priority" className="form-select form-select-sm">
                        <option value="ROUTINE">ROUTINE</option>
                        <option value="URGENT">URGENT</option>
                        <option value="STAT">STAT (Emergency / Immediate)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">Specimen Type</label>
                      <select name="sampleType" className="form-select form-select-sm">
                        <option value="WHOLE_BLOOD">Whole Blood (Venipuncture)</option>
                        <option value="SERUM">Serum (SST Gold Top)</option>
                        <option value="FLUORIDE_PLASMA">Fluoride Plasma (Glucose)</option>
                        <option value="MIDSTREAM_URINE">Midstream Urine</option>
                        <option value="NASOPHARYNGEAL_SWAB">Nasopharyngeal Swab</option>
                        <option value="ARTERIAL_BLOOD">Arterial Blood (ABG)</option>
                        <option value="CSF">Cerebrospinal Fluid (CSF)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">Clinical Notes & Indications</label>
                      <textarea
                        name="clinicalNotes"
                        rows="2"
                        placeholder="Clinical rationale, differential diagnosis or relevant medication history..."
                        className="form-control form-control-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowOrderModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">
                    Submit Requisition
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN TECHNICIAN */}
      {/* ========================================================================= */}
      {showAssignModal && selectedTestForAssign && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAssignTechnician(selectedTestForAssign, e.target.techName.value);
                }}
              >
                <div className="modal-header bg-light py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    Assign Lab Specialist: #{selectedTestForAssign.id}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)} />
                </div>

                <div className="modal-body p-4">
                  <div className="border rounded p-3 bg-light mb-3">
                    <div className="fw-bold text-dark">{selectedTestForAssign.testName}</div>
                    <div className="text-muted small">Patient: {selectedTestForAssign.patientName} ({selectedTestForAssign.patientCode})</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Technician Name / Handle</label>
                    <select name="techName" className="form-select form-select-sm">
                      <option value="Rachel Zane, MLS">Rachel Zane, MLS (Senior Technologist)</option>
                      <option value="Michael Ross, MLT">Michael Ross, MLT (Biochemistry Specialist)</option>
                      <option value="Donna Paulsen, MLS">Donna Paulsen, MLS (Hematology Lead)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">
                    Assign Specialist
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COLLECT SAMPLE & ACCESSION */}
      {/* ========================================================================= */}
      {showSampleModal && selectedTestForSample && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCollectSample(
                    selectedTestForSample,
                    e.target.sampleType.value,
                    e.target.barcode.value
                  );
                }}
              >
                <div className="modal-header bg-light py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    Specimen Intake: Test #{selectedTestForSample.id}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowSampleModal(false)} />
                </div>

                <div className="modal-body p-4">
                  <div className="border rounded p-3 bg-light mb-3">
                    <div className="fw-bold text-dark">{selectedTestForSample.testName}</div>
                    <div className="text-muted small">Patient: {selectedTestForSample.patientName}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Specimen Matrix</label>
                    <select name="sampleType" defaultValue={selectedTestForSample.sampleType || 'WHOLE_BLOOD'} className="form-select form-select-sm">
                      <option value="WHOLE_BLOOD">Whole Blood (EDTA Lavender Tube)</option>
                      <option value="SERUM">Serum (SST Gel Separator Gold Top)</option>
                      <option value="FLUORIDE_PLASMA">Fluoride Plasma (Gray Top)</option>
                      <option value="MIDSTREAM_URINE">Clean-Catch Midstream Urine</option>
                      <option value="SWAB">Sterile Dacron Swab</option>
                      <option value="ARTERIAL_BLOOD">Heparinized Arterial Blood</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Accession Barcode Number</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light"><Barcode size={16} /></span>
                      <input
                        type="text"
                        name="barcode"
                        defaultValue={`SMP-${new Date().getFullYear()}-${String(selectedTestForSample.id).padStart(5, '0')}`}
                        className="form-control font-monospace"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSampleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning btn-sm px-4 text-dark">
                    Accession Specimen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD DIAGNOSTIC RESULTS (RULE 6) */}
      {/* ========================================================================= */}
      {showResultsModal && selectedTestForResults && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  handleRecordResults(selectedTestForResults, {
                    resultValue: form.resultValue.value,
                    normalRange: form.normalRange.value,
                    units: form.units.value,
                    interpretation: form.interpretation.value,
                    remarks: form.remarks.value,
                  });
                }}
              >
                <div className="modal-header bg-light py-3">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      Record Clinical Findings: #{selectedTestForResults.id}
                    </h5>
                    <RuleBadge ruleNumber={6} title="Lab Tech Only" />
                  </div>
                  <button type="button" className="btn-close" onClick={() => setShowResultsModal(false)} />
                </div>

                <div className="modal-body p-4">
                  <div className="border rounded p-3 bg-light mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Test: <b className="text-dark">{selectedTestForResults.testName}</b></span>
                      <span>Category: <b>{selectedTestForResults.category}</b></span>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>Patient: <b>{selectedTestForResults.patientName} ({selectedTestForResults.patientCode})</b></span>
                      <span>Specimen: <b className="font-monospace">{selectedTestForResults.sampleBarcode}</b></span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Result Findings / Values <span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="resultValue"
                      required
                      rows="2"
                      placeholder="e.g. Hemoglobin: 14.8 g/dL | WBC: 7.4 x10^3/uL | Platelets: 245 x10^3/uL"
                      defaultValue={selectedTestForResults.resultValue || ''}
                      className="form-control form-control-sm font-monospace"
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">Physiological Normal Range</label>
                      <input
                        type="text"
                        name="normalRange"
                        defaultValue={selectedTestForResults.normalRange || 'Standard Reference Range'}
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">Measurement Units</label>
                      <input
                        type="text"
                        name="units"
                        defaultValue={selectedTestForResults.units || 'mg/dL, g/dL, uL'}
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">Clinical Interpretation</label>
                      <select name="interpretation" defaultValue="NORMAL" className="form-select form-select-sm">
                        <option value="NORMAL">NORMAL</option>
                        <option value="ABNORMAL">ABNORMAL (General)</option>
                        <option value="HIGH">HIGH (Elevated)</option>
                        <option value="LOW">LOW (Depressed)</option>
                        <option value="CRITICAL">CRITICAL (Panic Value)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Technologist Remarks & Calibration Notes</label>
                    <input
                      type="text"
                      name="remarks"
                      defaultValue="Calibration verified on analyzer module; quality control values in target range."
                      className="form-control form-control-sm"
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowResultsModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 text-white">
                    Commit Findings (SRS Rule 6)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PRINTABLE DIAGNOSTIC LAB REPORT */}
      {/* ========================================================================= */}
      {showReportModal && selectedReportToView && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white py-2 px-3">
                <span className="small font-monospace">Clinical Pathology Laboratory Diagnostic Report</span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="btn btn-outline-light btn-sm py-1 px-2 d-flex align-items-center gap-1"
                  >
                    <Printer size={13} />
                    <span>Print Report</span>
                  </button>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowReportModal(false)} />
                </div>
              </div>

              <div className="modal-body p-4 bg-white" id="printable-lab-report">
                {/* Hospital & Lab Header */}
                <div className="border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="fw-bold text-dark mb-0">SHREE JEEVAN MULTISPECIALITY HOSPITAL</h4>
                    <p className="text-muted small mb-0">Department of Pathology & Clinical Laboratory Medicine · Pune, Maharashtra</p>
                    <span className="text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                      NABL Accredited Lab · "Compassionate Care. Trusted Healthcare."
                    </span>
                  </div>
                  <div className="text-end font-monospace">
                    <div className="badge bg-dark fs-6 px-3 py-1">{selectedReportToView.reportNumber}</div>
                    <div className="text-muted small mt-1">FINAL DIAGNOSTIC REPORT</div>
                  </div>
                </div>

                {/* Patient & Order Details Block */}
                <div className="row g-2 mb-3 p-3 bg-light rounded small">
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Patient Name:</span>
                    <div className="fw-bold text-dark">{selectedReportToView.patientName}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Patient Code:</span>
                    <div className="fw-bold font-monospace">{selectedReportToView.patientCode}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Gender:</span>
                    <div className="fw-bold">{selectedReportToView.patientGender || 'N/A'}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Attending Doctor:</span>
                    <div className="fw-bold">{selectedReportToView.doctorName}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Specimen Matrix:</span>
                    <div className="fw-bold">{selectedReportToView.sampleType || 'Whole Blood'}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Specimen Barcode:</span>
                    <div className="fw-bold font-monospace">{selectedReportToView.sampleBarcode || 'N/A'}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Reported Date:</span>
                    <div className="fw-bold">{new Date(selectedReportToView.reportedAt).toLocaleString()}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Report Status:</span>
                    <div><span className="badge bg-success">{selectedReportToView.status || 'FINAL'}</span></div>
                  </div>
                </div>

                {/* Test Results Table */}
                <h6 className="fw-bold text-dark mb-2">{selectedReportToView.testName}</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-bordered align-middle small mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Parameter / Finding</th>
                        <th>Observed Value</th>
                        <th>Reference Interval</th>
                        <th>Units</th>
                        <th>Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-semibold">{selectedReportToView.testName}</td>
                        <td className="fw-bold text-dark font-monospace">{selectedReportToView.resultValue}</td>
                        <td className="text-muted">{selectedReportToView.normalRange || 'Standard'}</td>
                        <td className="text-muted">{selectedReportToView.units || ''}</td>
                        <td>
                          <span
                            className={`badge ${
                              selectedReportToView.interpretation === 'NORMAL'
                                ? 'bg-success'
                                : 'bg-warning text-dark'
                            }`}
                          >
                            {selectedReportToView.interpretation}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Technologist Remarks */}
                <div className="border rounded p-3 mb-4 bg-light small">
                  <div className="fw-bold text-dark mb-1">Pathologist Remarks & Clinical Correlation:</div>
                  <div className="text-muted">
                    {selectedReportToView.remarks || 'Findings have been correlated with calibration and internal quality control standards.'}
                  </div>
                </div>

                {/* Sign-Off Block */}
                <div className="d-flex justify-content-between align-items-end pt-3 border-top small">
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Testing Performed By:</div>
                    <div className="fw-bold text-dark">{selectedReportToView.technicianName}</div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>Certified Medical Laboratory Scientist (ASCP)</div>
                  </div>

                  <div className="text-end">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Electronically Verified & Signed:</div>
                    <div className="fw-bold text-dark">{selectedReportToView.verifiedByDoctor}</div>
                    <div className="text-success fw-semibold" style={{ fontSize: '0.68rem' }}>
                      ✓ Verified at {new Date(selectedReportToView.reportedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowReportModal(false)}>
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

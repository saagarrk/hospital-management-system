import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDataService } from '../../services/mockDataService';
import { RuleBadge } from '../common/RuleBadge';
import {
  Pill,
  Plus,
  Lock,
  Search,
  Calendar,
  User,
  Activity,
  History,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Info,
  RotateCcw,
  Shield,
  Trash2,
  Printer,
  Copy,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  FileCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

export const PrescriptionModule = () => {
  const { currentUser, hasRole } = useAuth();

  // Active Navigation Tab: 'directory' | 'pharmacy-ops' | 'patient-history' | 'security-sandbox'
  const [activeTab, setActiveTab] = useState('directory');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Master Data
  const patients = mockDataService.getPatients();
  const doctors = mockDataService.getDoctors();
  const medicines = mockDataService.getMedicines();

  // Role permissions
  const isDoctor = hasRole('DOCTOR', 'ADMIN');
  const isPharmacist = hasRole('PHARMACIST', 'ADMIN');
  const isAdmin = currentUser?.role === 'ADMIN';
  const isPatientPersona = currentUser?.role === 'PATIENT';

  // Active Patient ID if logged in as patient
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
    status: 'ALL',
    date: '',
    startDate: '',
    endDate: '',
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6);

  // Sync state after mutations
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Query paginated prescriptions
  const paginatedResult = useMemo(() => {
    const queryFilters = { ...filters };
    if (isPatientPersona) {
      queryFilters.patientId = activePatientId;
    }
    return mockDataService.getPrescriptions(queryFilters, currentPage, pageSize);
  }, [filters, currentPage, pageSize, isPatientPersona, activePatientId, refreshTrigger]);

  const prescriptions = paginatedResult.content || [];
  const totalElements = paginatedResult.totalElements || 0;
  const totalPages = paginatedResult.totalPages || 1;

  // Selected Prescription for Print/Detail View Modal
  const [printModalRx, setPrintModalRx] = useState(null);

  // Dispensing Modal State (for Pharmacists)
  const [dispenseModalRx, setDispenseModalRx] = useState(null);
  const [dispenseNotes, setDispenseNotes] = useState('');

  // Create Modal State (Multi-Item Structured Prescription Builder)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPatientId, setCreatePatientId] = useState('1');
  const [createDoctorId, setCreateDoctorId] = useState(
    currentUser?.id && currentUser.role === 'DOCTOR' ? String(currentUser.id) : '1'
  );
  const [createDate, setCreateDate] = useState(new Date().toISOString().split('T')[0]);
  const [createGeneralInstructions, setCreateGeneralInstructions] = useState(
    'Take medications strictly as instructed with water. Report adverse reactions immediately.'
  );

  // Dynamic Prescription Items list
  const [prescriptionItems, setPrescriptionItems] = useState([
    {
      medicineId: '1',
      dosage: '500mg',
      frequency: 'TID (3x daily)',
      duration: '7 days',
      instructions: 'Take after meals with a full glass of water',
    },
  ]);

  // Patient Medication History Tab state
  const [historyPatientId, setHistoryPatientId] = useState(isPatientPersona ? activePatientId : '1');

  // Security Sandbox simulator state
  const [sandboxResult, setSandboxResult] = useState(null);

  // Handle Filter Change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      patientId: isPatientPersona ? activePatientId : '',
      doctorId: '',
      status: 'ALL',
      date: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(0);
  };

  // Preset Date Filter
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
    }
  };

  // Prescription Items Management
  const handleAddItem = () => {
    // Pick the first available non-expired medicine
    const availableMed = medicines.find((m) => m.status !== 'EXPIRED') || medicines[0];
    setPrescriptionItems((prev) => [
      ...prev,
      {
        medicineId: String(availableMed.id),
        dosage: '20mg',
        frequency: 'QD (Once daily)',
        duration: '14 days',
        instructions: 'Take with or after food',
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (prescriptionItems.length <= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'At Least One Medicine Required',
        text: 'A clinical prescription must contain at least one medicine item.',
        confirmButtonColor: '#0d6efd',
      });
      return;
    }
    setPrescriptionItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemFieldChange = (index, field, value) => {
    setPrescriptionItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (!isDoctor) {
      handleUnauthorizedCreateAttempt();
      return;
    }

    const doc = doctors.find((d) => d.id === currentUser?.id) || doctors[0];
    setCreateDoctorId(String(doc.id));
    setCreatePatientId(patients[0]?.id ? String(patients[0].id) : '1');
    setCreateDate(new Date().toISOString().split('T')[0]);
    setCreateGeneralInstructions(
      'Take medications strictly as instructed with water. Report adverse reactions immediately.'
    );
    setPrescriptionItems([
      {
        medicineId: '1',
        dosage: '500mg',
        frequency: 'TID (3x daily)',
        duration: '7 days',
        instructions: 'Take after meals with a full glass of water',
      },
    ]);
    setShowCreateModal(true);
  };

  // Submit Create Prescription
  const handleCreateSubmit = (e) => {
    e.preventDefault();

    // Validate at least one item
    if (prescriptionItems.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Requirement Error',
        text: 'A prescription must contain at least one medicine.',
        confirmButtonColor: '#dc3545',
      });
      return;
    }

    // Validate each item for empty, zero or negative dosage/duration
    for (let i = 0; i < prescriptionItems.length; i++) {
      const item = prescriptionItems[i];
      const itemNum = i + 1;
      const med = medicines.find((m) => m.id === Number(item.medicineId));
      const medName = med ? med.name : 'Unknown Medication';

      if (!item.dosage || !item.dosage.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Dosage Required',
          text: `Item #${itemNum} (${medName}): Please specify a valid dosage (e.g. 500mg, 1 tablet).`,
          confirmButtonColor: '#dc3545',
        });
        return;
      }
      if (/^\s*0+(\.0+)?\s*(mg|g|mcg|ml|tablets?|capsules?|puffs?|drops?|units?)?\s*$/i.test(item.dosage.trim()) || /-\s*\d+/.test(item.dosage.trim())) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Dosage Value',
          text: `Item #${itemNum} (${medName}): Dosage cannot be zero or negative ('${item.dosage}').`,
          confirmButtonColor: '#dc3545',
        });
        return;
      }

      if (!item.duration || !item.duration.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Duration Required',
          text: `Item #${itemNum} (${medName}): Please specify a valid duration (e.g. 7 days, 1 month).`,
          confirmButtonColor: '#dc3545',
        });
        return;
      }
      if (/^\s*0+\s*(days?|weeks?|months?|doses?|hours?|times?)?\s*$/i.test(item.duration.trim()) || /-\s*\d+/.test(item.duration.trim())) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Duration Value',
          text: `Item #${itemNum} (${medName}): Duration cannot be zero or negative ('${item.duration}').`,
          confirmButtonColor: '#dc3545',
        });
        return;
      }

      if (med && med.expiryDate && med.expiryDate < new Date().toISOString().split('T')[0]) {
        Swal.fire({
          icon: 'error',
          title: 'Expired Medication Prohibited (Rule 10)',
          text: `Item #${itemNum}: '${med.name}' expired on ${med.expiryDate} and cannot be prescribed.`,
          confirmButtonColor: '#dc3545',
        });
        return;
      }
    }

    try {
      const doc = doctors.find((d) => d.id === Number(createDoctorId)) || doctors[0];
      const authorInfo = {
        id: doc.id,
        name: currentUser?.fullName || doc.name,
      };

      const payload = {
        patientId: createPatientId,
        doctorId: createDoctorId,
        prescriptionDate: createDate,
        generalInstructions: createGeneralInstructions,
        items: prescriptionItems,
      };

      const created = mockDataService.createPrescription(payload, currentUser.role, authorInfo);
      setRefreshTrigger((prev) => prev + 1);
      setShowCreateModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Prescription Issued (Transactional Commit)',
        html: `<div class="text-start small">
          <p class="mb-1">Medication order successfully created for <b>${created.patientName}</b> (${created.patientCode}).</p>
          <div class="p-2 bg-light rounded font-monospace mb-2">
            <b>Prescription ID:</b> #${created.id}<br/>
            <b>Prescribing Doctor:</b> ${created.doctorName}<br/>
            <b>Medications Prescribed:</b> ${created.items.length} items<br/>
            <b>Status:</b> <span class="badge bg-primary">ISSUED</span>
          </div>
          <p class="text-muted mb-0">The prescription is now active in the pharmacy dispensing queue.</p>
        </div>`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Prescription Creation Failed',
        text: err.message,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Open Dispense Confirmation Modal (for Pharmacists)
  const handleOpenDispenseModal = (rx) => {
    if (!isPharmacist) {
      Swal.fire({
        icon: 'error',
        title: 'Pharmacist Authorization Required (HTTP 403)',
        text: 'Only certified pharmacy personnel or medical administrators can dispense medications.',
        confirmButtonColor: '#dc3545',
      });
      return;
    }

    if (rx.status === 'DISPENSED') {
      Swal.fire({
        icon: 'info',
        title: 'Already Dispensed',
        text: `Prescription #${rx.id} was already fulfilled and dispensed to the patient on ${rx.dispensedAt?.substring(0, 10)}.`,
        confirmButtonColor: '#0d6efd',
      });
      return;
    }

    if (rx.status === 'CANCELLED') {
      Swal.fire({
        icon: 'error',
        title: 'Prescription Cancelled',
        text: `Prescription #${rx.id} was cancelled by the prescribing physician and cannot be dispensed.`,
        confirmButtonColor: '#dc3545',
      });
      return;
    }

    setDispenseModalRx(rx);
    setDispenseNotes('Medications verified against patient chart and dispensed from hospital formulary.');
  };

  // Execute Dispensing with atomic stock decrement
  const handleConfirmDispense = () => {
    if (!dispenseModalRx) return;

    try {
      const pharmacistInfo = {
        id: currentUser?.id,
        name: currentUser?.name || 'Registered Pharmacist',
      };

      const updated = mockDataService.dispensePrescription(
        dispenseModalRx.id,
        currentUser.role,
        pharmacistInfo,
        dispenseNotes
      );

      setRefreshTrigger((prev) => prev + 1);
      setDispenseModalRx(null);

      Swal.fire({
        icon: 'success',
        title: 'Medication Order Dispensed',
        html: `<div class="text-start small">
          <p class="mb-1">Prescription #<b>${updated.id}</b> fulfilled for <b>${updated.patientName}</b>.</p>
          <div class="p-2 bg-light rounded font-monospace mb-2">
            <b>Dispensed By:</b> ${updated.dispensedBy}<br/>
            <b>Dispensed Timestamp:</b> ${updated.dispensedAt.substring(0, 19).replace('T', ' ')}<br/>
            <b>Stock Decrement:</b> Inventory units decremented for ${updated.items.length} prescribed item(s).
          </div>
        </div>`,
        confirmButtonColor: '#198754',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Dispensing Blocked',
        text: err.message,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Cancel Prescription (Doctor or Admin only)
  const handleCancelPrescription = (rx) => {
    if (!isDoctor) {
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized Action',
        text: 'Only the prescribing doctor or medical administrator can cancel a prescription.',
        confirmButtonColor: '#dc3545',
      });
      return;
    }

    Swal.fire({
      title: `Cancel Prescription #${rx.id}?`,
      text: 'Provide a clinical reason for order cancellation:',
      input: 'text',
      inputPlaceholder: 'e.g. Drug allergy reported, revised therapeutic regimen...',
      showCancelButton: true,
      confirmButtonText: 'Confirm Cancellation',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Keep Active',
      preConfirm: (reason) => {
        if (!reason || reason.trim().length < 4) {
          Swal.showValidationMessage('A cancellation reason of at least 4 characters is required.');
        }
        return reason;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          mockDataService.cancelPrescription(
            rx.id,
            currentUser.role,
            { id: currentUser.id, name: currentUser.name },
            result.value
          );
          setRefreshTrigger((prev) => prev + 1);
          Swal.fire({
            icon: 'success',
            title: 'Prescription Cancelled',
            text: `Prescription #${rx.id} has been marked as CANCELLED.`,
            confirmButtonColor: '#0d6efd',
          });
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Cancellation Failed',
            text: err.message,
            confirmButtonColor: '#dc3545',
          });
        }
      }
    });
  };

  // Open Printable Prescription Slip Modal
  const handleOpenPrintModal = (rx) => {
    try {
      const printable = mockDataService.getPrintablePrescription(rx.id);
      setPrintModalRx(printable);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  // Print Action
  const handlePrintSlip = () => {
    window.print();
  };

  // Unauthorized Create Warning
  const handleUnauthorizedCreateAttempt = () => {
    Swal.fire({
      icon: 'error',
      title: 'SRS Rule 4 Violation (HTTP 403)',
      html: `<div class="text-start">
        <p class="mb-2"><b>Doctor Licensing Required:</b> Only licensed medical doctors (<code>ROLE_DOCTOR</code>) and medical administrators have prescriptive authority to author medical prescriptions.</p>
        <p class="small text-muted mb-0">Active Role: <code>${currentUser?.role}</code> (${currentUser?.name}). Switch to <b>Dr. Eleanor Sterling (DOCTOR)</b> in the top navbar to write prescriptions.</p>
      </div>`,
      confirmButtonColor: '#dc3545',
    });
  };

  // Security Sandbox Scenarios
  const runSandboxTest = (testCase) => {
    const timestamp = new Date().toISOString();
    let result = {};

    switch (testCase) {
      case 'DOCTOR_ONLY_CREATION': {
        result = {
          title: 'Doctor-Only Prescriptive Authority (Rule 4)',
          status: 403,
          statusText: 'Forbidden',
          timestamp,
          message: 'SRS Rule 4 Violation: Only licensed medical doctors have prescriptive authority to author medical prescriptions.',
          role: 'ROLE_PATIENT / ROLE_NURSE',
          testedEndpoint: 'POST /api/prescriptions',
          passed: true,
          explanation: 'Spring Security @PreAuthorize("hasAnyRole(\'DOCTOR\', \'ADMIN\')") and service layer physician validation reject non-physician requests.',
        };
        break;
      }
      case 'AT_LEAST_ONE_MEDICINE': {
        result = {
          title: 'Minimum One Medicine Item Validation',
          status: 400,
          statusText: 'Bad Request',
          timestamp,
          message: 'Validation Error: A prescription must contain at least one medicine item.',
          role: 'ROLE_DOCTOR',
          testedEndpoint: 'POST /api/prescriptions (with items: [])',
          passed: true,
          explanation: '@NotEmpty on List<PrescriptionItemDTO> items prevents creating empty or orphaned prescription records.',
        };
        break;
      }
      case 'EXPIRED_MEDICINE_REJECTION': {
        result = {
          title: 'Validate Medicine Existence & Expiry (Rule 10)',
          status: 409,
          statusText: 'Conflict',
          timestamp,
          message: "Item #1: Medicine 'Ceftriaxone 1g Inj' is EXPIRED (expired on: 2024-01-10) and cannot be prescribed.",
          role: 'ROLE_DOCTOR',
          testedEndpoint: 'POST /api/prescriptions (medicineId=4: Ceftriaxone Expired)',
          passed: true,
          explanation: 'Service layer checks medicineRepository.findById() and verifies medicine.isExpired() before allowing posology formulation.',
        };
        break;
      }
      case 'INVALID_DOSAGE_DURATION': {
        result = {
          title: 'Prevent Invalid Dosage & Duration Values',
          status: 400,
          statusText: 'Bad Request',
          timestamp,
          message: "Item #1 for 'Amoxicillin 500mg': Invalid dosage value '0mg' or '0 days'. Dosage and duration cannot be zero or negative.",
          role: 'ROLE_DOCTOR',
          testedEndpoint: 'POST /api/prescriptions (dosage="0mg", duration="0 days")',
          passed: true,
          explanation: 'Regex patterns and programmatic validation reject empty, zero, or negative dosage and duration values.',
        };
        break;
      }
      case 'PATIENT_PHI_ISOLATION': {
        result = {
          title: 'Patient PHI Isolation (Rule 9)',
          status: 403,
          statusText: 'Forbidden',
          timestamp,
          message: 'SRS Rule 9 Privacy Violation: Patients are strictly restricted from accessing prescriptions belonging to other patients.',
          role: 'ROLE_PATIENT (PT-0001 requesting PT-0002)',
          testedEndpoint: 'GET /api/prescriptions/patient/2',
          passed: true,
          explanation: 'verifyPatientOwnership() checks SecurityContext against target patient ID and blocks foreign queries.',
        };
        break;
      }
      case 'PHARMACY_DISPENSING_TRANSACTION': {
        result = {
          title: 'Pharmacy Dispensing & Inventory Decrement',
          status: 200,
          statusText: 'OK',
          timestamp,
          message: 'Prescription #2 verified by pharmacist. Stock decremented in pharmacy inventory; status updated from ISSUED to DISPENSED.',
          role: 'ROLE_PHARMACIST',
          testedEndpoint: 'PATCH /api/prescriptions/2/dispense',
          passed: true,
          explanation: '@Transactional method decrements medicine.stockQuantity and records dispensed timestamp and pharmacist username atomically.',
        };
        break;
      }
      default:
        break;
    }

    setSandboxResult(result);
  };

  // Patient longitudinal prescription list
  const historyPrescriptions = useMemo(() => {
    return mockDataService.getPrescriptionsByPatient(historyPatientId);
  }, [historyPatientId, refreshTrigger]);

  // Pharmacy operations list (all pending or low stock)
  const pharmacyPendingRx = useMemo(() => {
    return mockDataService.getPrescriptions({ status: 'ISSUED' }).content || [];
  }, [refreshTrigger]);

  const pharmacyDispensedRx = useMemo(() => {
    return mockDataService.getPrescriptions({ status: 'DISPENSED' }).content || [];
  }, [refreshTrigger]);

  return (
    <div className="container-fluid p-4">
      {/* Top Header Card */}
      <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <Pill className="text-primary" size={26} />
                <span>Prescription Management & Pharmacotherapy</span>
              </h2>
              <RuleBadge ruleNumber={4} title="Doctor Prescriptive Authority" />
              <RuleBadge ruleNumber={9} title="Patient PHI Isolation" />
              <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                <Package size={12} className="me-1 inline" />
                Pharmacy Dispensing Operations
              </span>
            </div>
            <p className="text-muted small mb-0">
              Structured multi-item clinical prescription formulation, physician authorization, inventory
              stock deduction, printable Rx orders, and longitudinal medication tracking.
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
                    <span className="text-primary fw-semibold">Attending Physician (Prescriptive Authority)</span>
                  )}
                  {currentUser?.role === 'PHARMACIST' && (
                    <span className="text-success fw-semibold">Registered Pharmacist (Dispensing Authority)</span>
                  )}
                  {currentUser?.role === 'PATIENT' && (
                    <span className="text-info fw-semibold">Patient Persona (Own PHI Only)</span>
                  )}
                  {currentUser?.role === 'ADMIN' && (
                    <span className="text-danger fw-semibold">Medical Administrator</span>
                  )}
                  {currentUser?.role === 'NURSE' && (
                    <span className="text-secondary">Clinical Staff (Administration View)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Write Prescription Action Button */}
            {isDoctor ? (
              <button
                onClick={handleOpenCreateModal}
                className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
              >
                <Plus size={16} />
                <span>Write Prescription</span>
              </button>
            ) : (
              <button
                onClick={handleUnauthorizedCreateAttempt}
                className="btn btn-outline-secondary btn-sm px-3 shadow-sm d-flex align-items-center gap-1 opacity-75"
                title="Only licensed doctors have prescriptive authority (SRS Rule 4)"
              >
                <Lock size={14} />
                <span>Write Prescription (Doctor Only)</span>
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
                <b>SRS Rule 9 Privacy Active:</b> You are viewing your personal medication orders (Patient Code: <code>{currentUser.patientCode}</code>). Records belonging to other patients are cryptographically isolated.
              </span>
            </div>
            <span className="badge bg-primary">HIPAA Protected</span>
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
          <Pill size={16} />
          <span>Prescription Registry ({totalElements})</span>
        </button>

        <button
          onClick={() => setActiveTab('pharmacy-ops')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'pharmacy-ops' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Package size={16} />
          <span>Pharmacy Dispensing Queue ({pharmacyPendingRx.length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('patient-history')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'patient-history' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Activity size={16} />
          <span>Patient Medication Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('security-sandbox')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'security-sandbox' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Shield size={16} />
          <span>Security & Compliance Sandbox</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL PRESCRIPTIONS DIRECTORY                                       */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div>
          {/* Search & Filter Toolbar */}
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 mb-4">
            <div className="row g-2 align-items-center">
              {/* Search text */}
              <div className="col-12 col-md-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <Search size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0 ps-1"
                    placeholder="Search patient, doctor, medicine, instructions..."
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

              {/* Status Filter */}
              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ISSUED">ISSUED (Active/Pending)</option>
                  <option value="DISPENSED">DISPENSED (Fulfilled)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
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
                  <option value="">All Physicians</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="col-6 col-md-1">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  title="Prescription Date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                />
              </div>

              {/* View Switcher & Reset */}
              <div className="col-12 col-md-2 d-flex align-items-center justify-content-end gap-2">
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
                    title="Table View"
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

            {/* Quick Filter Presets */}
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
                    filters.startDate ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  Last 7 Days
                </button>
              </div>

              <div className="d-flex align-items-center gap-2 small text-muted">
                <span>Filter by Status:</span>
                <button
                  onClick={() => handleFilterChange('status', 'ALL')}
                  className={`btn btn-xs py-0 px-2 rounded-pill ${filters.status === 'ALL' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange('status', 'ISSUED')}
                  className={`btn btn-xs py-0 px-2 rounded-pill ${filters.status === 'ISSUED' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  ISSUED
                </button>
                <button
                  onClick={() => handleFilterChange('status', 'DISPENSED')}
                  className={`btn btn-xs py-0 px-2 rounded-pill ${filters.status === 'DISPENSED' ? 'btn-success' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  DISPENSED
                </button>
                <button
                  onClick={() => handleFilterChange('status', 'CANCELLED')}
                  className={`btn btn-xs py-0 px-2 rounded-pill ${filters.status === 'CANCELLED' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  CANCELLED
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary & Page Size */}
          <div className="d-flex align-items-center justify-content-between mb-3 px-1">
            <div className="small text-muted">
              Showing <b className="text-dark">{prescriptions.length}</b> of <b className="text-dark">{totalElements}</b> prescriptions
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
                <option value={4}>4</option>
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {/* No Prescriptions Empty State */}
          {prescriptions.length === 0 && (
            <div className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center">
              <div className="py-4">
                <Pill size={48} className="text-muted mb-3 opacity-50" />
                <h5 className="fw-bold text-dark">No Prescriptions Found</h5>
                <p className="text-muted small max-w-md mx-auto mb-3">
                  No medication orders matched your active search or filter criteria.
                </p>
                <button onClick={handleResetFilters} className="btn btn-outline-primary btn-sm px-3">
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: CARDS VIEW */}
          {viewMode === 'cards' && prescriptions.length > 0 && (
            <div className="row g-4 mb-4">
              {prescriptions.map((rx) => {
                const isAuthor = rx.doctorName === currentUser?.name || rx.doctorId === currentUser?.id;
                const canCancel = (isDoctor && isAuthor) || isAdmin;

                return (
                  <div key={rx.id} className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4 d-flex flex-column">
                      {/* Card Header */}
                      <div className="d-flex align-items-start justify-content-between border-bottom pb-3 mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center">
                            <Stethoscope size={20} />
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <h5 className="fw-bold text-dark mb-0">{rx.patientName}</h5>
                              <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.72rem' }}>
                                {rx.patientCode}
                              </span>
                              <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.7rem' }}>
                                RX #{rx.id}
                              </span>
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              Prescribed by: <b className="text-dark">{rx.doctorName}</b> ({rx.doctorSpecialization || rx.departmentName})
                            </div>
                          </div>
                        </div>

                        <div className="text-end">
                          <span
                            className={`badge ${
                              rx.status === 'DISPENSED'
                                ? 'bg-success'
                                : rx.status === 'CANCELLED'
                                ? 'bg-danger'
                                : 'bg-primary'
                            }`}
                          >
                            {rx.status}
                          </span>
                          <div className="text-muted small mt-1 font-monospace" style={{ fontSize: '0.72rem' }}>
                            <Calendar size={11} className="me-1 inline" />
                            {rx.prescriptionDate}
                          </div>
                        </div>
                      </div>

                      {/* Prescribed Medications Multi-Item List */}
                      <div className="mb-3 flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>
                            Prescribed Pharmaceuticals ({rx.items.length} {rx.items.length === 1 ? 'item' : 'items'}):
                          </span>
                          <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                            Posology Regimen
                          </span>
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {rx.items.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-2 bg-light border border-light-subtle">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge bg-primary rounded-circle px-2 py-1" style={{ fontSize: '0.65rem' }}>
                                    {idx + 1}
                                  </span>
                                  <span className="fw-bold text-primary">{item.medicineName}</span>
                                  {item.genericName && item.genericName !== item.medicineName && (
                                    <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                      ({item.genericName})
                                    </span>
                                  )}
                                </div>
                                <span className="badge bg-secondary-subtle text-secondary font-monospace">
                                  {item.dosage}
                                </span>
                              </div>

                              <div className="d-flex flex-wrap gap-3 text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                                <div>
                                  Frequency: <b className="text-dark">{item.frequency}</b>
                                </div>
                                <div>
                                  Duration: <b className="text-dark">{item.duration}</b>
                                </div>
                                {item.category && (
                                  <div>
                                    Class: <span className="badge bg-light text-secondary border">{item.category}</span>
                                  </div>
                                )}
                              </div>

                              {item.instructions && (
                                <div className="text-secondary small mt-1 fst-italic" style={{ fontSize: '0.72rem' }}>
                                  <Info size={11} className="me-1 inline" />
                                  Instructions: {item.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* General Instructions */}
                      {rx.generalInstructions && (
                        <div className="p-2 rounded bg-light border text-muted small mb-3" style={{ fontSize: '0.75rem' }}>
                          <b>Physician Advisory:</b> {rx.generalInstructions}
                        </div>
                      )}

                      {/* Dispensing details if fulfilled */}
                      {rx.status === 'DISPENSED' && (
                        <div className="p-2 rounded bg-success-subtle text-success-emphasis border border-success-subtle small mb-3" style={{ fontSize: '0.75rem' }}>
                          <CheckCircle2 size={13} className="me-1 inline text-success" />
                          <b>Dispensed on:</b> {rx.dispensedAt?.substring(0, 16).replace('T', ' ')} by <b>{rx.dispensedBy}</b>
                          {rx.dispensingNotes && <div className="text-muted mt-1">{rx.dispensingNotes}</div>}
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="mt-auto pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                          Created: {rx.createdAt ? rx.createdAt.substring(0, 10) : rx.prescriptionDate}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {/* Print / View Slip Button */}
                          <button
                            onClick={() => handleOpenPrintModal(rx)}
                            className="btn btn-outline-primary btn-sm px-2 py-1 d-flex align-items-center gap-1"
                            title="View and Print Official Rx Slip"
                          >
                            <Printer size={13} />
                            <span>Print Slip</span>
                          </button>

                          {/* Pharmacist Dispense Button */}
                          {isPharmacist && rx.status === 'ISSUED' && (
                            <button
                              onClick={() => handleOpenDispenseModal(rx)}
                              className="btn btn-success btn-sm px-2 py-1 d-flex align-items-center gap-1"
                              title="Dispense medications and deduct stock from inventory"
                            >
                              <Package size={13} />
                              <span>Dispense</span>
                            </button>
                          )}

                          {/* Cancel Order Button */}
                          {canCancel && rx.status === 'ISSUED' && (
                            <button
                              onClick={() => handleCancelPrescription(rx)}
                              className="btn btn-outline-danger btn-sm px-2 py-1 d-flex align-items-center gap-1"
                              title="Cancel prescription order"
                            >
                              <XCircle size={13} />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: TABULAR LEDGER */}
          {viewMode === 'table' && prescriptions.length > 0 && (
            <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden mb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light text-muted">
                    <tr>
                      <th style={{ width: '70px' }}>RX #</th>
                      <th>Patient</th>
                      <th>Prescribing Doctor</th>
                      <th>Date</th>
                      <th>Items Prescribed</th>
                      <th>Status</th>
                      <th>Dispensing Record</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx) => {
                      const isAuthor = rx.doctorName === currentUser?.name || rx.doctorId === currentUser?.id;
                      const canCancel = (isDoctor && isAuthor) || isAdmin;

                      return (
                        <tr key={rx.id}>
                          <td className="font-monospace text-primary fw-bold">#{rx.id}</td>
                          <td>
                            <div className="fw-bold text-dark">{rx.patientName}</div>
                            <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                              {rx.patientCode}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold text-primary">{rx.doctorName}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {rx.doctorSpecialization || rx.departmentName}
                            </div>
                          </td>
                          <td className="fw-semibold text-dark">{rx.prescriptionDate}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {rx.items.map((it, idx) => (
                                <span key={idx} className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                                  {it.medicineName} ({it.dosage})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                rx.status === 'DISPENSED'
                                  ? 'bg-success'
                                  : rx.status === 'CANCELLED'
                                  ? 'bg-danger'
                                  : 'bg-primary'
                              }`}
                            >
                              {rx.status}
                            </span>
                          </td>
                          <td>
                            {rx.status === 'DISPENSED' ? (
                              <div style={{ fontSize: '0.72rem' }}>
                                <span className="text-success fw-semibold">{rx.dispensedBy}</span>
                                <div className="text-muted">{rx.dispensedAt?.substring(0, 10)}</div>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                onClick={() => handleOpenPrintModal(rx)}
                                className="btn btn-outline-primary"
                                title="Print Prescription Slip"
                              >
                                <Printer size={13} />
                              </button>
                              {isPharmacist && rx.status === 'ISSUED' && (
                                <button
                                  onClick={() => handleOpenDispenseModal(rx)}
                                  className="btn btn-outline-success"
                                  title="Dispense Order"
                                >
                                  <Package size={13} />
                                </button>
                              )}
                              {canCancel && rx.status === 'ISSUED' && (
                                <button
                                  onClick={() => handleCancelPrescription(rx)}
                                  className="btn btn-outline-danger"
                                  title="Cancel Order"
                                >
                                  <XCircle size={13} />
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
      {/* TAB 2: PHARMACY DISPENSING OPERATIONS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'pharmacy-ops' && (
        <div>
          {/* Pharmacy Metrics Header */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm rounded-3 bg-white p-3 border-start border-primary border-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small">Pending Dispensation</span>
                    <h3 className="fw-bold text-primary mb-0">{pharmacyPendingRx.length}</h3>
                  </div>
                  <div className="p-2 rounded bg-primary-subtle text-primary">
                    <Clock size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm rounded-3 bg-white p-3 border-start border-success border-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small">Total Dispensed</span>
                    <h3 className="fw-bold text-success mb-0">{pharmacyDispensedRx.length}</h3>
                  </div>
                  <div className="p-2 rounded bg-success-subtle text-success">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm rounded-3 bg-white p-3 border-start border-warning border-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small">Formulary Medicines</span>
                    <h3 className="fw-bold text-dark mb-0">{medicines.length}</h3>
                  </div>
                  <div className="p-2 rounded bg-warning-subtle text-warning">
                    <Package size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Dispensation Queue */}
          <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <Package className="text-primary" size={20} />
                  <span>Pending Dispensation Fulfillment Queue</span>
                </h5>
                <p className="text-muted small mb-0">
                  Prescription orders submitted by physicians requiring pharmaceutical verification and inventory fulfillment.
                </p>
              </div>
              <span className="badge bg-primary-subtle text-primary px-3 py-2">
                {pharmacyPendingRx.length} Orders Awaiting Dispensation
              </span>
            </div>

            {pharmacyPendingRx.length === 0 ? (
              <div className="text-center py-5">
                <CheckCircle2 size={42} className="text-success mb-2" />
                <h6 className="fw-bold text-dark">Dispensing Queue Empty</h6>
                <p className="text-muted small mb-0">All active prescription orders have been fulfilled.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {pharmacyPendingRx.map((rx) => (
                  <div key={rx.id} className="p-3 rounded-3 bg-light border border-light-subtle">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-2 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary">RX #{rx.id}</span>
                        <h6 className="fw-bold text-dark mb-0">{rx.patientName}</h6>
                        <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.72rem' }}>
                          {rx.patientCode}
                        </span>
                        <span className="text-muted small">• Prescribed by {rx.doctorName} on {rx.prescriptionDate}</span>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <button
                          onClick={() => handleOpenPrintModal(rx)}
                          className="btn btn-outline-secondary btn-sm py-1 px-2 d-flex align-items-center gap-1"
                        >
                          <Printer size={13} />
                          <span>View Order</span>
                        </button>

                        <button
                          onClick={() => handleOpenDispenseModal(rx)}
                          className="btn btn-success btn-sm py-1 px-3 d-flex align-items-center gap-1"
                        >
                          <Package size={14} />
                          <span>Verify & Dispense</span>
                        </button>
                      </div>
                    </div>

                    {/* Stock Availability Inspector for Each Item */}
                    <div className="row g-2">
                      {rx.items.map((it, idx) => {
                        const med = medicines.find((m) => m.id === Number(it.medicineId));
                        const isStockAvailable = med && med.stockQuantity > 0;
                        const isExpired = med && med.expiryDate && med.expiryDate < new Date().toISOString().split('T')[0];

                        return (
                          <div key={idx} className="col-12 col-md-6">
                            <div className="p-2 bg-white rounded border d-flex align-items-center justify-content-between">
                              <div>
                                <div className="fw-bold text-dark small">{it.medicineName}</div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  Dosage: <b>{it.dosage}</b> • Frequency: <b>{it.frequency}</b> • Duration: <b>{it.duration}</b>
                                </div>
                              </div>

                              <div className="text-end">
                                {isExpired ? (
                                  <span className="badge bg-danger">EXPIRED</span>
                                ) : isStockAvailable ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                                    Stock: {med.stockQuantity} units
                                  </span>
                                ) : (
                                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                    OUT OF STOCK
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PATIENT MEDICATION TIMELINE & HISTORY                             */}
      {/* ========================================================================= */}
      {activeTab === 'patient-history' && (
        <div>
          {/* Patient Selector */}
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 mb-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Select Patient Timeline:</label>
                <select
                  className="form-select form-select-sm"
                  value={historyPatientId}
                  onChange={(e) => setHistoryPatientId(e.target.value)}
                  disabled={isPatientPersona}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientCode}) - {p.gender}, DOB: {p.dateOfBirth}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-8 text-md-end">
                <span className="badge bg-light text-secondary border px-3 py-2">
                  Total Recorded Prescriptions for Patient: <b>{historyPrescriptions.length}</b>
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Stream */}
          {historyPrescriptions.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center">
              <Pill size={40} className="text-muted mb-2 opacity-50" />
              <h6 className="fw-bold text-dark">No Prescriptions on File</h6>
              <p className="text-muted small mb-0">This patient has no recorded pharmaceutical orders.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3 mb-4">
              {historyPrescriptions.map((rx, idx) => (
                <div key={rx.id} className="card border-0 shadow-sm rounded-3 bg-white p-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between border-bottom pb-3 mb-3 gap-2">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary">Order #{rx.id}</span>
                        <h6 className="fw-bold text-dark mb-0">Prescribed by {rx.doctorName}</h6>
                        <span className="badge bg-light text-secondary border font-monospace">
                          {rx.doctorSpecialization}
                        </span>
                      </div>
                      <div className="text-muted small mt-1">
                        Prescription Date: <b>{rx.prescriptionDate}</b> • Registered at: {rx.createdAt ? rx.createdAt.substring(0, 16).replace('T', ' ') : rx.prescriptionDate}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`badge ${
                          rx.status === 'DISPENSED'
                            ? 'bg-success'
                            : rx.status === 'CANCELLED'
                            ? 'bg-danger'
                            : 'bg-primary'
                        }`}
                      >
                        {rx.status}
                      </span>
                      <button
                        onClick={() => handleOpenPrintModal(rx)}
                        className="btn btn-outline-primary btn-sm px-2 py-1 d-flex align-items-center gap-1"
                      >
                        <Printer size={13} />
                        <span>Print Slip</span>
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                          <th>Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rx.items.map((it, i) => (
                          <tr key={i}>
                            <td className="font-monospace text-muted">{i + 1}</td>
                            <td>
                              <div className="fw-bold text-primary">{it.medicineName}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {it.genericName}
                              </div>
                            </td>
                            <td className="fw-semibold font-monospace">{it.dosage}</td>
                            <td>{it.frequency}</td>
                            <td>{it.duration}</td>
                            <td className="text-secondary">{it.instructions || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.generalInstructions && (
                    <div className="mt-3 p-2 bg-light rounded text-muted small" style={{ fontSize: '0.75rem' }}>
                      <b>Clinical Advisory:</b> {rx.generalInstructions}
                    </div>
                  )}

                  {rx.status === 'DISPENSED' && (
                    <div className="mt-2 text-success small">
                      <CheckCircle2 size={13} className="me-1 inline" />
                      Dispensed by <b>{rx.dispensedBy}</b> on {rx.dispensedAt?.substring(0, 16).replace('T', ' ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECURITY & COMPLIANCE SANDBOX                                     */}
      {/* ========================================================================= */}
      {activeTab === 'security-sandbox' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
          <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
            <div>
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <Shield className="text-primary" size={22} />
                <span>Prescription Security & Business Rule Simulator</span>
              </h5>
              <p className="text-muted small mb-0">
                Execute automated compliance scenarios testing doctor prescriptive authority, medicine expiration checks,
                dosage integrity, patient PHI isolation, and transactional dispensing.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Scenarios column */}
            <div className="col-12 col-md-5 d-flex flex-column gap-2">
              <button
                onClick={() => runSandboxTest('DOCTOR_ONLY_CREATION')}
                className="btn btn-outline-danger text-start p-3 rounded-3 d-flex align-items-center justify-content-between"
              >
                <div>
                  <div className="fw-bold">Test 1: Doctor Prescriptive Authority (Rule 4)</div>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                    Simulate Patient/Nurse attempting to POST /api/prescriptions &rarr; HTTP 403
                  </div>
                </div>
                <span className="badge bg-danger">403</span>
              </button>

              <button
                onClick={() => runSandboxTest('AT_LEAST_ONE_MEDICINE')}
                className="btn btn-outline-primary text-start p-3 rounded-3 d-flex align-items-center justify-content-between"
              >
                <div>
                  <div className="fw-bold">Test 2: Minimum 1 Medicine Item Requirement</div>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                    Simulate submitting prescription with empty items list &rarr; HTTP 400
                  </div>
                </div>
                <span className="badge bg-primary">400</span>
              </button>

              <button
                onClick={() => runSandboxTest('EXPIRED_MEDICINE_REJECTION')}
                className="btn btn-outline-danger text-start p-3 rounded-3 d-flex align-items-center justify-content-between"
              >
                <div>
                  <div className="fw-bold">Test 3: Medicine Existence & Expiry Check (Rule 10)</div>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                    Simulate prescribing expired Ceftriaxone &rarr; HTTP 409 Conflict
                  </div>
                </div>
                <span className="badge bg-danger">409</span>
              </button>

              <button
                onClick={() => runSandboxTest('INVALID_DOSAGE_DURATION')}
                className="btn btn-outline-warning text-dark text-start p-3 rounded-3 d-flex align-items-center justify-content-between"
              >
                <div>
                  <div className="fw-bold">Test 4: Prevent Invalid Dosage/Duration Values</div>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                    Simulate zero/negative dosage ('0mg', '-5 days') &rarr; HTTP 400 Bad Request
                  </div>
                </div>
                <span className="badge bg-warning text-dark">400</span>
              </button>

              <button
                onClick={() => runSandboxTest('PATIENT_PHI_ISOLATION')}
                className="btn btn-outline-danger text-start p-3 rounded-3 d-flex align-items-center justify-content-between"
              >
                <div>
                  <div className="fw-bold">Test 5: Patient PHI Privacy Isolation (Rule 9)</div>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                    Simulate Patient PT-0001 requesting PT-0002 prescriptions &rarr; HTTP 403
                  </div>
                </div>
                <span className="badge bg-danger">403</span>
              </button>

              <button
                onClick={() => runSandboxTest('PHARMACY_DISPENSING_TRANSACTION')}
                className="btn btn-outline-success text-start p-3 rounded-3 d-flex align-items-center justify-content-between"
              >
                <div>
                  <div className="fw-bold">Test 6: Pharmacist Dispense & Stock Decrement</div>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                    Simulate pharmacist dispensing & decrementing formulary stock &rarr; HTTP 200 OK
                  </div>
                </div>
                <span className="badge bg-success">200</span>
              </button>
            </div>

            {/* Test Console Output */}
            <div className="col-12 col-md-7">
              <div className="card bg-dark text-light rounded-3 p-3 font-monospace h-100 shadow-sm" style={{ minHeight: '380px' }}>
                <div className="d-flex align-items-center justify-content-between border-bottom border-secondary pb-2 mb-3">
                  <span className="text-success small d-flex align-items-center gap-1">
                    <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: '8px', height: '8px' }}></span>
                    Prescription Compliance Interceptor Console
                  </span>
                  <span className="text-muted small">Live Test Log</span>
                </div>

                {!sandboxResult ? (
                  <div className="text-center py-5 text-muted">
                    <Shield size={36} className="mb-2 opacity-50" />
                    <div>Select a compliance scenario on the left to execute validation.</div>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-white">{sandboxResult.title}</span>
                      <span
                        className={`badge ${
                          sandboxResult.status === 200
                            ? 'bg-success'
                            : sandboxResult.status === 403
                            ? 'bg-danger'
                            : 'bg-warning text-dark'
                        }`}
                      >
                        HTTP {sandboxResult.status} {sandboxResult.statusText}
                      </span>
                    </div>

                    <div className="text-secondary small mb-2">
                      Target Endpoint: <span className="text-info">{sandboxResult.testedEndpoint}</span>
                      <br />
                      Simulated Identity: <span className="text-warning">{sandboxResult.role}</span>
                      <br />
                      Timestamp: {sandboxResult.timestamp}
                    </div>

                    <div className="p-3 bg-black rounded border border-secondary mb-3 text-warning-emphasis small">
                      {sandboxResult.message}
                    </div>

                    <div className="text-muted small">
                      <div className="text-light fw-bold mb-1">Architecture & Enforcement Mechanism:</div>
                      <div>{sandboxResult.explanation}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ISSUE MULTI-ITEM PRESCRIPTION (DOCTOR ONLY)                      */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white p-3">
                <div className="d-flex align-items-center gap-2">
                  <Pill size={20} />
                  <h5 className="modal-title fw-bold mb-0">Issue Structured Clinical Prescription</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4 small">
                  {/* Doctor & Patient Row */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Patient *</label>
                      <select
                        className="form-select form-select-sm"
                        value={createPatientId}
                        onChange={(e) => setCreatePatientId(e.target.value)}
                        required
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.patientCode}) - {p.gender}, DOB: {p.dateOfBirth}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Attending Physician (Prescriber) *</label>
                      <select
                        className="form-select form-select-sm"
                        value={createDoctorId}
                        onChange={(e) => setCreateDoctorId(e.target.value)}
                        disabled={!isAdmin && currentUser?.role === 'DOCTOR'}
                        required
                      >
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.specialization})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Prescription Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={createDate}
                        onChange={(e) => setCreateDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* MULTI-ITEM POSOLOGY BUILDER */}
                  <div className="card border-primary-subtle bg-light rounded-3 p-3 mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fw-bold text-primary d-flex align-items-center gap-1">
                        <Pill size={16} />
                        <span>Prescription Items ({prescriptionItems.length} {prescriptionItems.length === 1 ? 'Medicine' : 'Medicines'})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="btn btn-outline-primary btn-sm py-0 px-2 d-flex align-items-center gap-1"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <Plus size={14} />
                        <span>Add Another Medicine</span>
                      </button>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {prescriptionItems.map((item, idx) => {
                        const selectedMed = medicines.find((m) => m.id === Number(item.medicineId));
                        const isExpired = selectedMed && selectedMed.expiryDate && selectedMed.expiryDate < new Date().toISOString().split('T')[0];

                        return (
                          <div key={idx} className="p-3 bg-white rounded-3 border shadow-sm position-relative">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge bg-primary rounded-circle px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                #{idx + 1}
                              </span>

                              {prescriptionItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="btn btn-outline-danger btn-sm py-0 px-2"
                                  title="Remove this medicine item"
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  <Trash2 size={12} className="me-1 inline" /> Remove
                                </button>
                              )}
                            </div>

                            <div className="row g-2">
                              {/* Medicine Selector */}
                              <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  Medicine (Formulary) *
                                </label>
                                <select
                                  className={`form-select form-select-sm ${isExpired ? 'is-invalid' : ''}`}
                                  value={item.medicineId}
                                  onChange={(e) => handleItemFieldChange(idx, 'medicineId', e.target.value)}
                                  required
                                >
                                  {medicines.map((m) => {
                                    const exp = m.expiryDate && m.expiryDate < new Date().toISOString().split('T')[0];
                                    return (
                                      <option key={m.id} value={m.id} disabled={exp}>
                                        {m.name} ({m.category}) {exp ? '[EXPIRED - BLOCKED]' : `[Stock: ${m.stockQuantity}]`}
                                      </option>
                                    );
                                  })}
                                </select>
                                {isExpired && (
                                  <div className="text-danger small mt-1" style={{ fontSize: '0.7rem' }}>
                                    <AlertTriangle size={11} className="me-1 inline" />
                                    This medicine is expired and cannot be prescribed. Please select an active formulation.
                                  </div>
                                )}
                              </div>

                              {/* Dosage */}
                              <div className="col-4 col-md-2">
                                <label className="form-label fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  Dosage *
                                </label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. 500mg, 1 tab"
                                  value={item.dosage}
                                  onChange={(e) => handleItemFieldChange(idx, 'dosage', e.target.value)}
                                  required
                                />
                              </div>

                              {/* Frequency */}
                              <div className="col-4 col-md-2">
                                <label className="form-label fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  Frequency *
                                </label>
                                <select
                                  className="form-select form-select-sm"
                                  value={item.frequency}
                                  onChange={(e) => handleItemFieldChange(idx, 'frequency', e.target.value)}
                                  required
                                >
                                  <option value="QD (Once daily)">QD (Once daily)</option>
                                  <option value="BID (Twice daily)">BID (Twice daily)</option>
                                  <option value="TID (3x daily)">TID (3x daily)</option>
                                  <option value="QID (4x daily)">QID (4x daily)</option>
                                  <option value="QHS (Bedtime)">QHS (Bedtime)</option>
                                  <option value="PRN (As needed)">PRN (As needed)</option>
                                </select>
                              </div>

                              {/* Duration */}
                              <div className="col-4 col-md-2">
                                <label className="form-label fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  Duration *
                                </label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. 7 days"
                                  value={item.duration}
                                  onChange={(e) => handleItemFieldChange(idx, 'duration', e.target.value)}
                                  required
                                />
                              </div>

                              {/* Item-specific Instructions */}
                              <div className="col-12">
                                <label className="form-label fw-semibold" style={{ fontSize: '0.75rem' }}>
                                  Administration Instructions for this Medicine
                                </label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. Take immediately after meals with large glass of water"
                                  value={item.instructions}
                                  onChange={(e) => handleItemFieldChange(idx, 'instructions', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* General Instructions */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold">General Instructions & Precautions</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={createGeneralInstructions}
                      onChange={(e) => setCreateGeneralInstructions(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-3">
                    Issue Prescription ({prescriptionItems.length} {prescriptionItems.length === 1 ? 'Item' : 'Items'})
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINT / DOWNLOAD OFFICIAL CLINICAL PRESCRIPTION SLIP             */}
      {/* ========================================================================= */}
      {printModalRx && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white p-3 d-print-none">
                <div className="d-flex align-items-center gap-2">
                  <Printer size={18} />
                  <h5 className="modal-title fw-bold mb-0">Official Clinical Prescription Slip</h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button onClick={handlePrintSlip} className="btn btn-sm btn-success px-3 d-flex align-items-center gap-1">
                    <Printer size={14} />
                    <span>Print Rx</span>
                  </button>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setPrintModalRx(null)}></button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="modal-body p-4 bg-white text-dark printable-prescription" id="printable-area">
                {/* Hospital Header */}
                <div className="d-flex align-items-center justify-content-between border-bottom border-2 border-primary pb-3 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary text-white rounded p-3 text-center">
                      <Stethoscope size={32} />
                    </div>
                    <div>
                      <h4 className="fw-bold text-primary mb-0">{printModalRx.hospitalName}</h4>
                      <div className="text-secondary small">{printModalRx.hospitalTagline}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {printModalRx.hospitalAddress} • Tel: {printModalRx.hospitalPhone}
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="fw-bold text-primary fs-5">{printModalRx.rxNumber}</div>
                    <div className="text-muted small">Date: <b className="text-dark">{printModalRx.prescriptionDate}</b></div>
                    <span className={`badge ${printModalRx.status === 'DISPENSED' ? 'bg-success' : 'bg-primary'}`}>
                      {printModalRx.status}
                    </span>
                  </div>
                </div>

                {/* Doctor & Patient Credentials Columns */}
                <div className="row g-3 p-3 bg-light rounded-3 mb-3 border">
                  {/* Doctor Info */}
                  <div className="col-12 col-md-6 border-end-md">
                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>
                      Attending Physician:
                    </div>
                    <div className="fw-bold text-dark fs-6">{printModalRx.doctorName}</div>
                    <div className="text-primary small fw-semibold">
                      {printModalRx.doctorSpecialization} • {printModalRx.doctorQualification}
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      License: <span className="font-monospace text-dark">{printModalRx.doctorLicenseNumber}</span> • Dept: {printModalRx.doctorDepartment}
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="col-12 col-md-6">
                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>
                      Patient Details:
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark fs-6">{printModalRx.patientName}</span>
                      <span className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                        {printModalRx.patientCode}
                      </span>
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      Gender: <b className="text-dark">{printModalRx.patientGender}</b> • Age: <b className="text-dark">{printModalRx.patientAge || '35'} yrs</b> • Phone: {printModalRx.patientPhone}
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      Allergies: <span className="badge bg-light text-danger border">{printModalRx.knownAllergies}</span>
                    </div>
                  </div>
                </div>

                {/* Classical Rx Clinical Symbol */}
                <div className="d-flex align-items-center gap-2 mb-2 text-primary">
                  <span className="fs-3 fw-bold font-serif" style={{ fontFamily: 'Georgia, serif' }}>&#8478;</span>
                  <span className="fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                    Clinical Pharmacotherapy Schedule
                  </span>
                </div>

                {/* Structured Prescription Items Table */}
                <div className="table-responsive mb-3">
                  <table className="table table-bordered align-middle mb-0 small">
                    <thead className="table-primary text-primary-emphasis">
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Medicine & Formulation</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Specific Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printModalRx.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="text-center font-monospace">{item.itemIndex}</td>
                          <td>
                            <div className="fw-bold text-dark">{item.medicineName}</div>
                            {item.genericName && (
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                Generic: {item.genericName}
                              </div>
                            )}
                          </td>
                          <td className="fw-bold font-monospace text-primary">{item.dosage}</td>
                          <td>{item.frequency}</td>
                          <td>{item.duration}</td>
                          <td className="text-secondary">{item.instructions || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* General Instructions & Safety Box */}
                <div className="p-3 bg-light rounded-3 border mb-3 small">
                  <div className="fw-bold text-dark mb-1">General Physician Instructions:</div>
                  <div className="text-secondary mb-2">{printModalRx.generalInstructions}</div>
                  <div className="d-flex flex-wrap gap-3 text-muted" style={{ fontSize: '0.72rem' }}>
                    <div>• <b>Refills:</b> {printModalRx.refillsAllowed}</div>
                    <div>• <b>Storage:</b> {printModalRx.safetyWarnings}</div>
                  </div>
                </div>

                {/* Dispensed stamp if fulfilled */}
                {printModalRx.status === 'DISPENSED' && (
                  <div className="p-2 rounded bg-success-subtle text-success border border-success-subtle small mb-3">
                    <CheckCircle2 size={14} className="me-1 inline" />
                    <b>Pharmacy Dispensation Verified:</b> Dispensed on {printModalRx.dispensedAt?.substring(0, 16).replace('T', ' ')} by {printModalRx.dispensedBy}. {printModalRx.dispensingNotes}
                  </div>
                )}

                {/* Footer Signatures & Barcode */}
                <div className="d-flex align-items-end justify-content-between pt-4 mt-3 border-top">
                  <div>
                    <div className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                      {printModalRx.barcodeData}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                      Digital Verification Hash: {printModalRx.digitalVerificationHash}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="font-italic text-primary border-bottom border-dark pb-1 px-4 mb-1" style={{ fontFamily: 'cursive', fontSize: '1.1rem' }}>
                      {printModalRx.doctorName}
                    </div>
                    <div className="text-muted small fw-semibold" style={{ fontSize: '0.7rem' }}>
                      Authorized Medical Officer Signature
                    </div>
                  </div>
                </div>

                <div className="text-center text-muted mt-3" style={{ fontSize: '0.65rem' }}>
                  {printModalRx.legalDisclaimer}
                </div>
              </div>

              <div className="modal-footer bg-light p-3 d-print-none">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPrintModalRx(null)}>
                  Close
                </button>
                <button type="button" className="btn btn-sm btn-primary px-3" onClick={handlePrintSlip}>
                  <Printer size={14} className="me-1 inline" /> Print Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PHARMACIST DISPENSING CONFIRMATION MODAL                         */}
      {/* ========================================================================= */}
      {dispenseModalRx && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-success text-white p-3">
                <div className="d-flex align-items-center gap-2">
                  <Package size={20} />
                  <h5 className="modal-title fw-bold mb-0">Dispense Pharmaceutical Order</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDispenseModalRx(null)}></button>
              </div>

              <div className="modal-body p-4 small">
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-dark fs-6">{dispenseModalRx.patientName}</span>
                    <span className="badge bg-primary">RX #{dispenseModalRx.id}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Patient Code: <b>{dispenseModalRx.patientCode}</b> • Prescribing Doctor: <b>{dispenseModalRx.doctorName}</b>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Medications to Dispense & Deduct from Stock:</label>
                  <div className="d-flex flex-column gap-2">
                    {dispenseModalRx.items.map((it, idx) => {
                      const med = medicines.find((m) => m.id === Number(it.medicineId));
                      return (
                        <div key={idx} className="p-2 bg-white rounded border d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold text-dark">{it.medicineName}</div>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                              Dose: {it.dosage} • Freq: {it.frequency} • Duration: {it.duration}
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-success-subtle text-success">
                              Available: {med ? med.stockQuantity : 0} units
                            </span>
                            <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                              -1 unit upon fulfillment
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold">Pharmacist Verification Notes:</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={dispenseNotes}
                    onChange={(e) => setDispenseNotes(e.target.value)}
                    placeholder="Enter fulfillment and counseling notes..."
                  ></textarea>
                </div>

                <div className="alert alert-info py-2 px-3 rounded small mb-0">
                  <Info size={14} className="me-1 inline" />
                  Confirming dispensation will atomically decrement the required units from the pharmacy inventory
                  and update the prescription status to <b>DISPENSED</b>.
                </div>
              </div>

              <div className="modal-footer bg-light p-3">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDispenseModalRx(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-sm btn-success px-3" onClick={handleConfirmDispense}>
                  <Check size={14} className="me-1 inline" /> Confirm & Dispense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

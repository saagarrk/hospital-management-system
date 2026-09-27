import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDataService } from '../../services/mockDataService';
import { RuleBadge } from '../common/RuleBadge';
import {
  BedDouble,
  Plus,
  AlertCircle,
  CheckCircle2,
  User,
  ArrowRightLeft,
  IndianRupee,
  Layers,
  Wrench,
  Clock,
  Search,
  Filter,
  Building2,
  Stethoscope,
  Activity,
  FileText,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import Swal from 'sweetalert2';

export const InpatientModule = () => {
  const { currentUser, hasRole } = useAuth();
  const currentRole = currentUser?.role;

  // Active Tab
  const [activeTab, setActiveTab] = useState('ward_map'); // ward_map, admissions, admit, rooms_beds, transfers, discharge_prep, sandbox

  // State
  const [rooms, setRooms] = useState(() => mockDataService.getRooms());
  const [beds, setBeds] = useState(() => mockDataService.getBeds());
  const [admissions, setAdmissions] = useState(() => mockDataService.getAdmissions());
  const [transfers, setTransfers] = useState(() => mockDataService.getBedTransfers());
  const patients = mockDataService.getPatients();
  const doctors = mockDataService.getDoctors();

  // Filters
  const [wardFilter, setWardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReassignDoctorModal, setShowReassignDoctorModal] = useState(false);
  const [showBedStatusModal, setShowBedStatusModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  // Selected entities for modals
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [dischargePrepData, setDischargePrepData] = useState(null);

  // Form states
  const [admitForm, setAdmitForm] = useState({
    patientId: '2',
    doctorId: '1',
    bedId: '',
    reasonForAdmission: 'Acute observation and inpatient clinical monitoring',
    admissionType: 'EMERGENCY',
    provisionalDiagnosis: 'Hypertensive urgency with palpitations',
    emergencyContact: 'Next of kin (+91 98220 88009)',
  });

  const [transferForm, setTransferForm] = useState({
    targetBedId: '',
    reason: 'Clinical condition escalation requiring specialized ICU telemetry',
  });

  const [reassignDoctorForm, setReassignDoctorForm] = useState({
    newDoctorId: '1',
    reason: 'Shift handover and specialty consultation',
  });

  const [bedStatusForm, setBedStatusForm] = useState({
    status: 'MAINTENANCE',
    reason: 'Routine biological decontamination and mattress servicing',
  });

  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    roomType: 'GENERAL_WARD',
    floor: 'Ground Floor',
    departmentName: 'General Inpatient Care',
    dailyRate: 150.0,
    capacity: 4,
    status: 'ACTIVE',
  });

  const [bedForm, setBedForm] = useState({
    roomId: '',
    bedNumber: '',
    status: 'AVAILABLE',
    notes: 'New active station',
  });

  const [dischargeForm, setDischargeForm] = useState({
    diagnosisSummary: 'Patient hemodynamically stabilized; clinical parameters normalized.',
    treatmentGiven: 'Telemetry monitoring, intravenous antihypertensive protocol, and laboratory profiling.',
    dischargeAdvice: 'Take prescribed medication after breakfast. Low sodium diet. Follow-up in 10 days.',
  });

  // Sandbox simulation results
  const [sandboxLogs, setSandboxLogs] = useState([]);

  // Refresh all state from mock store
  const refreshState = () => {
    setRooms(mockDataService.getRooms());
    setBeds(mockDataService.getBeds());
    setAdmissions(mockDataService.getAdmissions());
    setTransfers(mockDataService.getBedTransfers());
  };

  // KPIs
  const summary = useMemo(() => {
    const totalBeds = beds.length;
    const available = beds.filter((b) => b.status === 'AVAILABLE').length;
    const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
    const reserved = beds.filter((b) => b.status === 'RESERVED').length;
    const maintenance = beds.filter((b) => b.status === 'MAINTENANCE').length;
    const activeAdmissions = admissions.filter((a) => a.status === 'ADMITTED').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

    return {
      totalRooms: rooms.length,
      totalBeds,
      available,
      occupied,
      reserved,
      maintenance,
      activeAdmissions,
      occupancyRate,
    };
  }, [beds, admissions, rooms]);

  // Filtered beds
  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      const matchWard = wardFilter === 'ALL' || b.roomType === wardFilter;
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const matchSearch =
        !searchQuery ||
        b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.currentPatientName && b.currentPatientName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchWard && matchStatus && matchSearch;
    });
  }, [beds, wardFilter, statusFilter, searchQuery]);

  // Group filtered beds by room
  const bedsByRoom = useMemo(() => {
    const map = {};
    filteredBeds.forEach((bed) => {
      if (!map[bed.roomNumber]) {
        map[bed.roomNumber] = {
          roomNumber: bed.roomNumber,
          roomType: bed.roomType,
          floor: bed.floor,
          dailyRate: bed.dailyRate,
          beds: [],
        };
      }
      map[bed.roomNumber].beds.push(bed);
    });
    return Object.values(map);
  }, [filteredBeds]);

  // Available beds for admissions or transfers
  const availableBeds = useMemo(() => {
    return beds.filter((b) => b.status === 'AVAILABLE');
  }, [beds]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // 1. Patient Admission (Rule 1, 2, 4)
  const handleAdmissionSubmit = (e) => {
    e.preventDefault();
    try {
      if (!admitForm.bedId) {
        Swal.fire({ icon: 'warning', title: 'Bed Required', text: 'Please select an available bed.' });
        return;
      }

      const adm = mockDataService.admitPatient(admitForm, currentRole);
      refreshState();
      setShowAdmitModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Admission Confirmed',
        html: `
          <div class="text-start small">
            <p class="mb-1">Patient <b>${adm.patientName}</b> successfully admitted.</p>
            <p class="mb-1">Assigned Bed: <b class="text-primary">${adm.bedNumber}</b> (${adm.roomNumber})</p>
            <p class="mb-0 text-success">✓ Bed status synchronized to <b>OCCUPIED</b>.</p>
          </div>
        `,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: err.status === 409 ? 'HTTP 409 Conflict' : 'Admission Failed',
        html: `<div class="text-start alert alert-danger py-2 small mb-0">${err.message}</div>`,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // 2. Patient Transfer (Rule 5 & 6)
  const handleOpenTransferModal = (adm) => {
    setSelectedAdmission(adm);
    const firstAvail = availableBeds.find((b) => b.id !== adm.bedId);
    setTransferForm({
      targetBedId: firstAvail ? String(firstAvail.id) : '',
      reason: 'Clinical step-down care / specialized ward transfer',
    });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    try {
      const result = mockDataService.transferBed(
        selectedAdmission.id,
        transferForm.targetBedId,
        transferForm.reason,
        currentRole,
        currentUser?.fullName || 'Charge Nurse'
      );

      refreshState();
      setShowTransferModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Bed Transfer Executed Atomically',
        html: `
          <div class="text-start small">
            <p class="mb-1">Patient <b>${result.admission.patientName}</b> transferred successfully:</p>
            <div class="p-2 bg-light rounded border mb-2 font-monospace">
              ${result.transferRecord.fromBedNumber} (${result.transferRecord.fromRoomNumber}) 
              &rarr; <b class="text-primary">${result.transferRecord.toBedNumber} (${result.transferRecord.toRoomNumber})</b>
            </div>
            <ul class="mb-0 ps-3 text-muted">
              <li>Old bed ${result.transferRecord.fromBedNumber} released to <b>AVAILABLE</b></li>
              <li>New bed ${result.transferRecord.toBedNumber} occupied atomically (Rule 5)</li>
            </ul>
          </div>
        `,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: err.status === 409 ? 'HTTP 409 Conflict (Rule 6)' : 'Transfer Denied',
        html: `<div class="text-start alert alert-danger py-2 small mb-0">${err.message}</div>`,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // 3. Reassign Attending Doctor
  const handleOpenReassignDoctor = (adm) => {
    setSelectedAdmission(adm);
    const otherDoc = doctors.find((d) => d.id !== adm.doctorId);
    setReassignDoctorForm({
      newDoctorId: otherDoc ? String(otherDoc.id) : String(doctors[0]?.id),
      reason: 'Shift handover & specialist secondary opinion',
    });
    setShowReassignDoctorModal(true);
  };

  const handleReassignDoctorSubmit = (e) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    try {
      const updated = mockDataService.reassignDoctor(
        selectedAdmission.id,
        reassignDoctorForm.newDoctorId,
        reassignDoctorForm.reason,
        currentRole
      );
      refreshState();
      setShowReassignDoctorModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Doctor Reassigned',
        text: `Attending physician updated to ${updated.doctorName}.`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Reassignment Failed', text: err.message });
    }
  };

  // 4. Change Bed Status (AVAILABLE, RESERVED, MAINTENANCE)
  const handleOpenBedStatusModal = (bed) => {
    setSelectedBed(bed);
    setBedStatusForm({
      status: bed.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE',
      reason: bed.status === 'AVAILABLE' ? 'Sterilization and mechanical maintenance' : 'Maintenance complete, cleaned',
    });
    setShowBedStatusModal(true);
  };

  const handleBedStatusSubmit = (e) => {
    e.preventDefault();
    if (!selectedBed) return;

    try {
      const updated = mockDataService.updateBedStatus(
        selectedBed.id,
        bedStatusForm.status,
        bedStatusForm.reason,
        currentRole
      );
      refreshState();
      setShowBedStatusModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Bed Status Updated',
        html: `Bed <b>${updated.bedNumber}</b> status set to <span class="badge bg-secondary">${updated.status}</span>.`,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Status Update Blocked',
        html: `<div class="text-start alert alert-danger py-2 small mb-0">${err.message}</div>`,
      });
    }
  };

  // 5. Room CRUD
  const handleOpenCreateRoom = () => {
    setSelectedRoom(null);
    setRoomForm({
      roomNumber: `WARD-${Math.floor(200 + Math.random() * 99)}`,
      roomType: 'GENERAL_WARD',
      floor: 'Floor 1',
      departmentName: 'General Inpatient Care',
      dailyRate: 140.0,
      capacity: 4,
      status: 'ACTIVE',
    });
    setShowRoomModal(true);
  };

  const handleOpenEditRoom = (room) => {
    setSelectedRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      floor: room.floor,
      departmentName: room.departmentName,
      dailyRate: room.dailyRate,
      capacity: room.capacity,
      status: room.status,
    });
    setShowRoomModal(true);
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    try {
      if (selectedRoom) {
        mockDataService.updateRoom(selectedRoom.id, roomForm, currentRole);
      } else {
        mockDataService.addRoom(roomForm, currentRole);
      }
      refreshState();
      setShowRoomModal(false);
      Swal.fire({
        icon: 'success',
        title: selectedRoom ? 'Room Updated' : 'Room Created',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Room Error', text: err.message });
    }
  };

  const handleDeleteRoom = (room) => {
    Swal.fire({
      title: `Delete Room ${room.roomNumber}?`,
      text: 'This will permanently remove the room. Occupied rooms cannot be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete room',
    }).then((res) => {
      if (res.isConfirmed) {
        try {
          mockDataService.deleteRoom(room.id, currentRole);
          refreshState();
          Swal.fire({ icon: 'success', title: 'Room Deleted', timer: 1200, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Deletion Blocked', text: err.message });
        }
      }
    });
  };

  // 6. Bed CRUD
  const handleOpenCreateBed = (roomId = null) => {
    const defaultRoom = roomId ? rooms.find((r) => r.id === roomId) : rooms[0];
    setBedForm({
      roomId: defaultRoom ? String(defaultRoom.id) : '',
      bedNumber: `${defaultRoom?.roomNumber || 'BED'}-${Math.floor(1 + Math.random() * 9)}`,
      status: 'AVAILABLE',
      notes: 'New clinical intake unit',
    });
    setShowBedModal(true);
  };

  const handleBedSubmit = (e) => {
    e.preventDefault();
    try {
      mockDataService.addBed(bedForm, currentRole);
      refreshState();
      setShowBedModal(false);
      Swal.fire({ icon: 'success', title: 'Bed Created Successfully', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Bed Error', text: err.message });
    }
  };

  const handleDeleteBed = (bed) => {
    Swal.fire({
      title: `Delete Bed ${bed.bedNumber}?`,
      text: 'Occupied beds cannot be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete bed',
    }).then((res) => {
      if (res.isConfirmed) {
        try {
          mockDataService.deleteBed(bed.id, currentRole);
          refreshState();
          Swal.fire({ icon: 'success', title: 'Bed Deleted', timer: 1200, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Deletion Blocked', text: err.message });
        }
      }
    });
  };

  // 7. Discharge Preparation & Execution (Rule 3, 4, 10)
  const handleOpenDischargePrep = (adm) => {
    try {
      const prep = mockDataService.prepareDischarge(adm.id);
      setSelectedAdmission(adm);
      setDischargePrepData(prep);
      setDischargeForm({
        diagnosisSummary: 'Condition stabilized; patient afebrile and vital parameters within normal ranges.',
        treatmentGiven: 'Acute inpatient stabilization, hemodynamic monitoring, and targeted pharmacotherapy.',
        dischargeAdvice: 'Low-sodium diet, continue oral medication protocol, and schedule outpatient follow-up in 14 days.',
      });
      setShowDischargeModal(true);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Cannot Prepare Discharge', text: err.message });
    }
  };

  const handleExecuteDischarge = () => {
    if (!selectedAdmission) return;
    try {
      const discharged = mockDataService.dischargePatient(selectedAdmission.id, dischargeForm, currentRole);
      refreshState();
      setShowDischargeModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Patient Discharged & Bed Released',
        html: `
          <div class="text-start small">
            <p class="mb-1">Patient <b>${discharged.patientName}</b> has been discharged.</p>
            <p class="mb-1 text-success fw-semibold">✓ Bed ${discharged.bedNumber} released and status synchronized to <b>AVAILABLE</b>.</p>
            <p class="mb-0 text-muted">Discharge summary and exit clinical instructions generated.</p>
          </div>
        `,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Discharge Blocked (Rule 10)',
        html: `
          <div class="text-start">
            <div class="alert alert-danger py-2 small mb-2 font-monospace">${err.message}</div>
            <p class="small text-muted mb-0">Navigate to the <b>Billing & Clearance</b> module to settle the pending balance before releasing this patient.</p>
          </div>
        `,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // =========================================================================
  // SANDBOX SIMULATIONS (Rules 1 - 6)
  // =========================================================================

  const addSandboxLog = (title, status, detail, type = 'info') => {
    const entry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      title,
      status,
      detail,
      type,
    };
    setSandboxLogs((prev) => [entry, ...prev.slice(0, 19)]);
  };

  // Test 1: Rule 1 & 7: Attempt to assign an OCCUPIED or MAINTENANCE bed
  const runRule1Test = () => {
    const occupiedOrMaint = beds.find((b) => b.status === 'OCCUPIED' || b.status === 'MAINTENANCE');
    if (!occupiedOrMaint) {
      Swal.fire({ icon: 'info', title: 'No occupied or maintenance bed currently available for test.' });
      return;
    }

    try {
      mockDataService.admitPatient(
        {
          patientId: 2,
          doctorId: 1,
          bedId: occupiedOrMaint.id,
          reasonForAdmission: 'Concurrency safety collision test',
        },
        currentRole
      );
      addSandboxLog('Rule 1 Test Failed', 'FAIL', 'System erroneously allowed intake into unavailable bed!', 'danger');
    } catch (err) {
      addSandboxLog(
        'Rule 1 & 7 Bed Lock Enforced',
        'HTTP 409 CONFLICT (PASS)',
        `Blocked assignment to ${occupiedOrMaint.bedNumber} (Status: ${occupiedOrMaint.status}): ${err.message}`,
        'success'
      );
      Swal.fire({
        icon: 'success',
        title: 'Rule 1 Enforced: 409 Conflict',
        html: `
          <div class="text-start small">
            <p class="mb-1 text-success fw-bold">✓ Concurrency Guard Active:</p>
            <div class="p-2 bg-light rounded border font-monospace text-danger mb-2">${err.message}</div>
            <p class="text-muted mb-0">Occupied or maintenance beds cannot be assigned to another patient.</p>
          </div>
        `,
      });
    }
  };

  // Test 2: Rule 2: Attempt duplicate admission for already admitted patient
  const runRule2Test = () => {
    const activeAdm = admissions.find((a) => a.status === 'ADMITTED');
    const availBed = availableBeds[0];

    if (!activeAdm || !availBed) {
      Swal.fire({ icon: 'info', title: 'Requires an active admission and an available bed.' });
      return;
    }

    try {
      mockDataService.admitPatient(
        {
          patientId: activeAdm.patientId,
          doctorId: activeAdm.doctorId,
          bedId: availBed.id,
          reasonForAdmission: 'Duplicate admission conflict test',
        },
        currentRole
      );
      addSandboxLog('Rule 2 Test Failed', 'FAIL', 'Duplicate admission allowed!', 'danger');
    } catch (err) {
      addSandboxLog(
        'Rule 2 Duplicate Admission Blocked',
        'HTTP 409 CONFLICT (PASS)',
        `Blocked intake for ${activeAdm.patientName}: ${err.message}`,
        'success'
      );
      Swal.fire({
        icon: 'success',
        title: 'Rule 2 Enforced: Multiple Admissions Blocked',
        html: `
          <div class="text-start small">
            <p class="mb-1 text-success fw-bold">✓ Single Admission Constraint Enforced:</p>
            <div class="p-2 bg-light rounded border font-monospace text-danger mb-2">${err.message}</div>
            <p class="text-muted mb-0">A patient cannot have multiple active admissions at the hospital.</p>
          </div>
        `,
      });
    }
  };

  // Test 3: Rule 5 & 6: Transfer to unavailable bed & atomic transfer test
  const runRule6Test = () => {
    const activeAdm = admissions.find((a) => a.status === 'ADMITTED');
    const occupiedOrMaint = beds.find(
      (b) => b.id !== activeAdm?.bedId && (b.status === 'OCCUPIED' || b.status === 'MAINTENANCE')
    );

    if (!activeAdm || !occupiedOrMaint) {
      Swal.fire({ icon: 'info', title: 'Requires active admission and an unavailable target bed.' });
      return;
    }

    try {
      mockDataService.transferBed(
        activeAdm.id,
        occupiedOrMaint.id,
        'Attempting illegal transfer to occupied bed',
        currentRole
      );
      addSandboxLog('Rule 6 Test Failed', 'FAIL', 'Transfer to unavailable bed was permitted!', 'danger');
    } catch (err) {
      addSandboxLog(
        'Rule 6 Transfer Lock Enforced',
        'HTTP 409 CONFLICT (PASS)',
        `Prevented transfer to ${occupiedOrMaint.bedNumber} (${occupiedOrMaint.status}): ${err.message}`,
        'success'
      );
      Swal.fire({
        icon: 'success',
        title: 'Rule 6 Enforced: Unavailable Bed Transfer Blocked',
        html: `
          <div class="text-start small">
            <p class="mb-1 text-success fw-bold">✓ Transfer Pre-condition Enforced:</p>
            <div class="p-2 bg-light rounded border font-monospace text-danger mb-2">${err.message}</div>
            <p class="text-muted mb-0">Patients can only be transferred to beds that are currently AVAILABLE.</p>
          </div>
        `,
      });
    }
  };

  // Test 4: Rule 4: Bed status synchronized atomically on admission and discharge
  const runRule4Test = () => {
    const availBed = availableBeds[0];
    const nonAdmittedPatient = patients.find(
      (p) => !admissions.some((a) => a.patientId === p.id && a.status === 'ADMITTED')
    );

    if (!availBed || !nonAdmittedPatient) {
      Swal.fire({ icon: 'info', title: 'Requires available bed and unadmitted patient.' });
      return;
    }

    try {
      // Step A: Admit
      const adm = mockDataService.admitPatient(
        {
          patientId: nonAdmittedPatient.id,
          doctorId: 1,
          bedId: availBed.id,
          reasonForAdmission: 'Automated atomic synchronization test',
        },
        currentRole
      );

      const bedAfterAdmit = mockDataService.getBedById(availBed.id);
      const isOccupied = bedAfterAdmit.status === 'OCCUPIED' && bedAfterAdmit.currentPatientId === nonAdmittedPatient.id;

      // Step B: Discharge
      mockDataService.dischargePatient(adm.id, { diagnosisSummary: 'Auto test stabilized' }, currentRole);
      const bedAfterDischarge = mockDataService.getBedById(availBed.id);
      const isAvailableAgain = bedAfterDischarge.status === 'AVAILABLE' && bedAfterDischarge.currentPatientId === null;

      refreshState();

      if (isOccupied && isAvailableAgain) {
        addSandboxLog(
          'Rule 4 Synchronization Verified',
          'ATOMIC PASS',
          `Bed ${availBed.bedNumber} transitioned AVAILABLE -> OCCUPIED -> AVAILABLE synchronously.`,
          'success'
        );
        Swal.fire({
          icon: 'success',
          title: 'Rule 4 Synchronization Verified',
          html: `
            <div class="text-start small">
              <p class="mb-1 text-success fw-bold">✓ Bed Status Atomic Synchronization:</p>
              <ul class="mb-0 ps-3 text-muted">
                <li>Admitted ${nonAdmittedPatient.name} &rarr; Bed marked <b>OCCUPIED</b></li>
                <li>Discharged patient &rarr; Bed automatically reverted to <b>AVAILABLE</b></li>
                <li>No stale pointers or orphaned bed states detected.</li>
              </ul>
            </div>
          `,
        });
      } else {
        throw new Error('Bed status did not synchronize properly with admission state.');
      }
    } catch (err) {
      addSandboxLog('Rule 4 Test Error', 'FAIL', err.message, 'danger');
      Swal.fire({ icon: 'error', title: 'Test Failed', text: err.message });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">AVAILABLE</span>;
      case 'OCCUPIED':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">OCCUPIED</span>;
      case 'RESERVED':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">RESERVED</span>;
      case 'MAINTENANCE':
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">MAINTENANCE</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Module Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <BedDouble className="text-primary" size={28} />
              <span>Inpatient, Room & Bed Management</span>
            </h2>
            <RuleBadge ruleNumber={7} title="Rule 1: Occupied Bed 409 Lock" />
            <RuleBadge ruleNumber={8} title="Rule 2: Single Admission Check" />
            <RuleBadge ruleNumber={10} title="Rule 4 & 5: Atomic Bed Sync & Transfer" />
            <span className="badge bg-dark-subtle text-dark border font-monospace">@Transactional Enforced</span>
          </div>
          <p className="text-muted small mb-0">
            Real-time multi-ward layout, patient admission intake, doctor assignment, atomic bed transfer, room/bed CRUD, and discharge clearance.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            onClick={refreshState}
            className="btn btn-outline-secondary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
            title="Refresh state"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          {hasRole('ADMIN', 'RECEPTIONIST', 'DOCTOR') && (
            <button
              onClick={() => {
                const firstAvail = availableBeds[0];
                setAdmitForm((prev) => ({
                  ...prev,
                  bedId: firstAvail ? String(firstAvail.id) : '',
                }));
                setShowAdmitModal(true);
              }}
              className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
            >
              <Plus size={16} />
              <span>Admit Patient</span>
            </button>
          )}

          {hasRole('ADMIN') && (
            <button
              onClick={handleOpenCreateRoom}
              className="btn btn-outline-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
            >
              <Building2 size={15} />
              <span>Add Room</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Total Beds</span>
              <BedDouble size={16} className="text-primary" />
            </div>
            <div className="fs-4 fw-bold text-dark">{summary.totalBeds}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Across {summary.totalRooms} Rooms
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100 border-start border-success border-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Available</span>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <div className="fs-4 fw-bold text-success">{summary.available}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Ready for immediate intake
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100 border-start border-danger border-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Occupied</span>
              <User size={16} className="text-danger" />
            </div>
            <div className="fs-4 fw-bold text-danger">{summary.occupied}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Occupancy: {summary.occupancyRate}%
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100 border-start border-warning border-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Reserved</span>
              <Clock size={16} className="text-warning" />
            </div>
            <div className="fs-4 fw-bold text-warning">{summary.reserved}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Scheduled admissions
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100 border-start border-secondary border-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Maintenance</span>
              <Wrench size={16} className="text-secondary" />
            </div>
            <div className="fs-4 fw-bold text-secondary">{summary.maintenance}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Servicing / Sanitation
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-primary text-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-white-50 small">Admitted</span>
              <Activity size={16} className="text-white" />
            </div>
            <div className="fs-4 fw-bold">{summary.activeAdmissions}</div>
            <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>
              Active inpatients
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4 bg-white p-2 rounded-3 shadow-sm border border-light-subtle">
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('ward_map')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'ward_map' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <BedDouble size={16} />
            <span>Interactive Ward & Bed Map</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('admissions')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'admissions' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <User size={16} />
            <span>Admitted Patients ({summary.activeAdmissions})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('rooms_beds')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'rooms_beds' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <Building2 size={16} />
            <span>Room & Bed Management</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('transfers')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'transfers' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <ArrowRightLeft size={16} />
            <span>Transfer History ({transfers.length})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'sandbox' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Safety & Concurrency Sandbox</span>
          </button>
        </li>
      </ul>

      {/* ========================================================================= */}
      {/* TAB 1: INTERACTIVE WARD & BED MAP */}
      {/* ========================================================================= */}
      {activeTab === 'ward_map' && (
        <div>
          {/* Controls Bar */}
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <Search size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search bed, room number, or patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="d-flex align-items-center gap-2">
                  <Filter size={14} className="text-muted" />
                  <select
                    className="form-select form-select-sm"
                    value={wardFilter}
                    onChange={(e) => setWardFilter(e.target.value)}
                  >
                    <option value="ALL">All Ward Types</option>
                    <option value="ICU">Intensive Care Unit (ICU)</option>
                    <option value="GENERAL_WARD">General Ward</option>
                    <option value="SEMI_PRIVATE">Semi-Private Ward</option>
                    <option value="PRIVATE_AC">Private AC Suite</option>
                  </select>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Bed Statuses</option>
                  <option value="AVAILABLE">AVAILABLE only</option>
                  <option value="OCCUPIED">OCCUPIED only</option>
                  <option value="RESERVED">RESERVED only</option>
                  <option value="MAINTENANCE">MAINTENANCE only</option>
                </select>
              </div>

              <div className="col-12 col-md-2 text-md-end text-muted small">
                Showing <b>{filteredBeds.length}</b> of {beds.length} beds
              </div>
            </div>
          </div>

          {/* Grouped by Room View */}
          {bedsByRoom.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white">
              <BedDouble size={40} className="text-muted mx-auto mb-2" />
              <h6 className="fw-bold text-dark">No beds found matching filters</h6>
              <p className="text-muted small mb-0">Try changing the ward filter or status dropdown.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {bedsByRoom.map((roomGroup) => (
                <div key={roomGroup.roomNumber} className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
                  {/* Room Header Strip */}
                  <div className="card-header bg-light border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark font-monospace fs-6 px-2 py-1">
                        {roomGroup.roomNumber}
                      </span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {roomGroup.roomType}
                      </span>
                      <span className="text-muted small">
                        {roomGroup.floor} • ₹{roomGroup.dailyRate}/day
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small">
                        {roomGroup.beds.length} Station(s)
                      </span>
                      {hasRole('ADMIN', 'NURSE') && (
                        <button
                          onClick={() => {
                            const r = rooms.find((x) => x.roomNumber === roomGroup.roomNumber);
                            handleOpenCreateBed(r?.id);
                          }}
                          className="btn btn-outline-primary btn-sm py-0 px-2"
                          style={{ fontSize: '0.75rem' }}
                          title="Add bed to this room"
                        >
                          <Plus size={12} /> Add Bed
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bed Grid Inside This Room */}
                  <div className="card-body p-3">
                    <div className="row g-3">
                      {roomGroup.beds.map((bed) => {
                        const isOccupied = bed.status === 'OCCUPIED';
                        const isReserved = bed.status === 'RESERVED';
                        const isMaintenance = bed.status === 'MAINTENANCE';
                        const isAvailable = bed.status === 'AVAILABLE';

                        // Matching admission if occupied
                        const matchingAdm = admissions.find(
                          (a) => a.bedId === bed.id && a.status === 'ADMITTED'
                        );

                        return (
                          <div key={bed.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                            <div
                              className={`card h-100 rounded-3 p-3 transition-all ${
                                isOccupied
                                  ? 'border-danger-subtle bg-danger-subtle shadow-sm'
                                  : isReserved
                                  ? 'border-warning-subtle bg-warning-subtle shadow-sm'
                                  : isMaintenance
                                  ? 'border-secondary-subtle bg-light text-muted shadow-sm'
                                  : 'border-success-subtle bg-white shadow-sm hover-shadow'
                              }`}
                            >
                              {/* Top bed header */}
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold font-monospace text-dark fs-5">
                                  {bed.bedNumber}
                                </span>
                                {getStatusBadge(bed.status)}
                              </div>

                              {/* Bed Status Content */}
                              {isOccupied && (
                                <div className="mb-3">
                                  <div className="p-2 bg-white rounded border border-danger-subtle mb-2">
                                    <div className="fw-bold text-danger d-flex align-items-center gap-1 small text-truncate">
                                      <User size={14} />
                                      <span>{bed.currentPatientName || 'Patient Admitted'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-1 text-muted small" style={{ fontSize: '0.7rem' }}>
                                      <span className="font-monospace">{bed.currentPatientCode || 'PT-REG'}</span>
                                      {matchingAdm && <span>{matchingAdm.doctorName?.split(' ')[1] || 'Attending'}</span>}
                                    </div>
                                  </div>
                                  <div className="small text-danger fw-semibold" style={{ fontSize: '0.72rem' }}>
                                    <Lock size={12} className="inline me-1" />
                                    Rule 1 Guard: Double-booking locked
                                  </div>
                                </div>
                              )}

                              {isAvailable && (
                                <div className="mb-3">
                                  <div className="p-2 bg-success-subtle rounded border border-success-subtle text-success small">
                                    <div className="fw-semibold d-flex align-items-center gap-1">
                                      <CheckCircle2 size={14} /> Ready for Patient Intake
                                    </div>
                                    <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                      Sanitized & verified available
                                    </div>
                                  </div>
                                </div>
                              )}

                              {isReserved && (
                                <div className="mb-3">
                                  <div className="p-2 bg-white rounded border border-warning-subtle text-warning-emphasis small">
                                    <div className="fw-semibold d-flex align-items-center gap-1">
                                      <Clock size={14} /> Held for Scheduled Intake
                                    </div>
                                    <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                      {bed.notes || 'Reserved for surgical recovery'}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {isMaintenance && (
                                <div className="mb-3">
                                  <div className="p-2 bg-white rounded border border-secondary-subtle text-secondary small">
                                    <div className="fw-semibold d-flex align-items-center gap-1">
                                      <Wrench size={14} /> Engineering / Sanitation
                                    </div>
                                    <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                      {bed.notes || 'Undergoing maintenance check'}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Card Action Buttons */}
                              <div className="mt-auto pt-2 border-top border-light-subtle d-flex flex-wrap gap-1">
                                {isAvailable && hasRole('ADMIN', 'RECEPTIONIST', 'DOCTOR') && (
                                  <button
                                    onClick={() => {
                                      setAdmitForm((prev) => ({ ...prev, bedId: String(bed.id) }));
                                      setShowAdmitModal(true);
                                    }}
                                    className="btn btn-primary btn-sm py-1 px-2 flex-grow-1"
                                    style={{ fontSize: '0.72rem' }}
                                  >
                                    Admit Patient
                                  </button>
                                )}

                                {isOccupied && matchingAdm && hasRole('ADMIN', 'NURSE', 'DOCTOR') && (
                                  <button
                                    onClick={() => handleOpenTransferModal(matchingAdm)}
                                    className="btn btn-outline-primary btn-sm py-1 px-2 flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                    style={{ fontSize: '0.72rem' }}
                                    title="Transfer patient to another bed atomically"
                                  >
                                    <ArrowRightLeft size={12} />
                                    <span>Transfer</span>
                                  </button>
                                )}

                                {isOccupied && matchingAdm && hasRole('ADMIN', 'DOCTOR') && (
                                  <button
                                    onClick={() => handleOpenDischargePrep(matchingAdm)}
                                    className="btn btn-outline-danger btn-sm py-1 px-2 d-flex align-items-center gap-1"
                                    style={{ fontSize: '0.72rem' }}
                                    title="Discharge preparation and financial review"
                                  >
                                    <CheckCircle2 size={12} />
                                    <span>Discharge</span>
                                  </button>
                                )}

                                {!isOccupied && hasRole('ADMIN', 'NURSE', 'DOCTOR') && (
                                  <button
                                    onClick={() => handleOpenBedStatusModal(bed)}
                                    className="btn btn-outline-secondary btn-sm py-1 px-2"
                                    style={{ fontSize: '0.72rem' }}
                                    title="Change bed status (Available / Reserved / Maintenance)"
                                  >
                                    <Wrench size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADMITTED PATIENTS */}
      {/* ========================================================================= */}
      {activeTab === 'admissions' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
          <div className="card-header bg-white border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <h5 className="fw-bold mb-0">Active Inpatient Admissions</h5>
              <p className="text-muted small mb-0">
                Patients currently occupying beds with attending physician assignments and length-of-stay tracking.
              </p>
            </div>
            <span className="badge bg-primary font-monospace fs-6 px-3 py-1">
              {admissions.filter((a) => a.status === 'ADMITTED').length} Active
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase">
                <tr>
                  <th>Patient Info</th>
                  <th>Ward & Bed</th>
                  <th>Attending Physician</th>
                  <th>Admission Date</th>
                  <th>Length of Stay</th>
                  <th>Clinical Reason</th>
                  <th>Status</th>
                  <th className="text-end">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {admissions
                  .filter((a) => a.status === 'ADMITTED')
                  .map((adm) => {
                    // Length of stay calculation
                    const admDate = new Date(adm.admissionDate);
                    const now = new Date();
                    const diffDays = Math.max(1, Math.ceil((now - admDate) / (1000 * 60 * 60 * 24)));
                    const dailyRate = adm.dailyRate || 150;
                    const accruedCharges = diffDays * dailyRate;

                    return (
                      <tr key={adm.id}>
                        <td>
                          <div className="fw-bold text-dark">{adm.patientName}</div>
                          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.65rem' }}>
                            {adm.patientCode}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-dark font-monospace">{adm.bedNumber}</span>
                            <span className="text-primary fw-semibold">{adm.roomNumber}</span>
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {adm.roomType} (₹{dailyRate}/day)
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark d-flex align-items-center gap-1">
                            <Stethoscope size={13} className="text-primary" />
                            <span>{adm.doctorName}</span>
                          </div>
                          {hasRole('ADMIN', 'DOCTOR') && (
                            <button
                              onClick={() => handleOpenReassignDoctor(adm)}
                              className="btn btn-link p-0 text-muted"
                              style={{ fontSize: '0.68rem', textDecoration: 'underline' }}
                            >
                              Reassign Doctor
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="font-monospace">{adm.admissionDate?.substring(0, 16)}</div>
                          <span className="badge bg-light text-dark border" style={{ fontSize: '0.65rem' }}>
                            {adm.admissionType || 'EMERGENCY'}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{diffDays} Day(s)</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            ₹{accruedCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })} accrued
                          </div>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: 200 }} title={adm.reasonForAdmission}>
                            {adm.reasonForAdmission}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            ADMITTED
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            {hasRole('ADMIN', 'NURSE', 'DOCTOR') && (
                              <button
                                onClick={() => handleOpenTransferModal(adm)}
                                className="btn btn-outline-primary btn-sm py-1 px-2 d-inline-flex align-items-center gap-1"
                                title="Transfer to another ward or bed"
                              >
                                <ArrowRightLeft size={13} />
                                <span>Transfer</span>
                              </button>
                            )}

                            {hasRole('ADMIN', 'DOCTOR') && (
                              <button
                                onClick={() => handleOpenDischargePrep(adm)}
                                className="btn btn-outline-danger btn-sm py-1 px-2 d-inline-flex align-items-center gap-1"
                                title="Discharge preparation and checklist"
                              >
                                <CheckCircle2 size={13} />
                                <span>Discharge</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {admissions.filter((a) => a.status === 'ADMITTED').length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No active inpatient admissions. Use <b>Admit Patient</b> to register a new admission.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROOM & BED MANAGEMENT (CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'rooms_beds' && (
        <div className="row g-4">
          {/* Rooms Column */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
              <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <Building2 size={18} className="text-primary" />
                    <span>Hospital Rooms & Wards ({rooms.length})</span>
                  </h6>
                  <p className="text-muted small mb-0">Configure room types, floors, and daily billing rates.</p>
                </div>
                {hasRole('ADMIN') && (
                  <button onClick={handleOpenCreateRoom} className="btn btn-primary btn-sm px-2 py-1">
                    <Plus size={14} /> Add Room
                  </button>
                )}
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light text-uppercase">
                    <tr>
                      <th>Room</th>
                      <th>Type & Floor</th>
                      <th>Daily Rate</th>
                      <th>Beds (Capacity)</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="fw-bold font-monospace text-dark">{r.roomNumber}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{r.departmentName}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{r.roomType}</span>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{r.floor}</div>
                        </td>
                        <td>
                          <span className="fw-semibold text-primary font-monospace">₹{r.dailyRate}/day</span>
                        </td>
                        <td>
                          <span className="fw-bold">{r.totalBeds || 0}</span> / {r.capacity || 4}
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {r.occupiedBeds || 0} occupied
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            {hasRole('ADMIN') && (
                              <>
                                <button
                                  onClick={() => handleOpenEditRoom(r)}
                                  className="btn btn-outline-secondary btn-sm p-1"
                                  title="Edit room"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(r)}
                                  className="btn btn-outline-danger btn-sm p-1"
                                  title="Delete room"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Beds Column */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
              <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <BedDouble size={18} className="text-primary" />
                    <span>Bed Inventory & Status Control ({beds.length})</span>
                  </h6>
                  <p className="text-muted small mb-0">Manage bed stations and maintenance/reservation state.</p>
                </div>
                {hasRole('ADMIN', 'NURSE') && (
                  <button onClick={() => handleOpenCreateBed()} className="btn btn-primary btn-sm px-2 py-1">
                    <Plus size={14} /> Add Bed
                  </button>
                )}
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light text-uppercase">
                    <tr>
                      <th>Bed Number</th>
                      <th>Room</th>
                      <th>Status</th>
                      <th>Patient / Note</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beds.map((b) => (
                      <tr key={b.id}>
                        <td className="font-monospace fw-bold text-dark">{b.bedNumber}</td>
                        <td>
                          <div className="fw-medium">{b.roomNumber}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{b.roomType}</div>
                        </td>
                        <td>{getStatusBadge(b.status)}</td>
                        <td>
                          {b.currentPatientName ? (
                            <span className="text-danger fw-semibold">{b.currentPatientName}</span>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>{b.notes || '—'}</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            {b.status !== 'OCCUPIED' && hasRole('ADMIN', 'NURSE', 'DOCTOR') && (
                              <button
                                onClick={() => handleOpenBedStatusModal(b)}
                                className="btn btn-outline-secondary btn-sm p-1"
                                title="Change status"
                              >
                                <Wrench size={13} />
                              </button>
                            )}
                            {b.status !== 'OCCUPIED' && hasRole('ADMIN') && (
                              <button
                                onClick={() => handleDeleteBed(b)}
                                className="btn btn-outline-danger btn-sm p-1"
                                title="Delete bed"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BED TRANSFER LOG */}
      {/* ========================================================================= */}
      {activeTab === 'transfers' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
          <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <ArrowRightLeft className="text-primary" size={20} />
                <span>Patient Bed Transfer Audit Log</span>
              </h5>
              <p className="text-muted small mb-0">
                Rule 5 & 6 Compliance: Full chronological record of patient relocations with authorized personnel.
              </p>
            </div>
            <span className="badge bg-secondary font-monospace">{transfers.length} Transfers Recorded</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light text-uppercase">
                <tr>
                  <th>Timestamp</th>
                  <th>Patient</th>
                  <th>Source Bed (Released)</th>
                  <th>Destination Bed (Occupied)</th>
                  <th>Clinical Reason</th>
                  <th>Authorized By</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td className="font-monospace text-muted">{t.transferDate}</td>
                    <td>
                      <div className="fw-bold text-dark">{t.patientName}</div>
                      <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.65rem' }}>
                        {t.patientCode}
                      </span>
                    </td>
                    <td>
                      <div className="badge bg-light text-dark border font-monospace">
                        {t.fromBedNumber}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{t.fromRoomNumber}</div>
                    </td>
                    <td>
                      <div className="badge bg-primary font-monospace">
                        {t.toBedNumber}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{t.toRoomNumber}</div>
                    </td>
                    <td>
                      <span className="text-dark">{t.transferReason}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{t.transferredBy}</span>
                    </td>
                  </tr>
                ))}
                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No transfer records found in current session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SAFETY & CONCURRENCY SANDBOX */}
      {/* ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 h-100">
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <ShieldCheck size={22} className="text-primary" />
                <span>Business Rule & Concurrency Verification Suite</span>
              </h5>
              <p className="text-muted small mb-4">
                Execute automated interactive test vectors to verify transactional consistency and locking guards.
              </p>

              <div className="d-flex flex-column gap-3">
                {/* Test 1 */}
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold text-dark small">Test 1: Rule 1 & 7 Collision Guard</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Simulates attempting to admit a patient into an <b>OCCUPIED</b> or <b>MAINTENANCE</b> bed.
                      </div>
                    </div>
                    <button onClick={runRule1Test} className="btn btn-outline-danger btn-sm px-3">
                      Run Test 1
                    </button>
                  </div>
                  <div className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.68rem' }}>
                    Expected: HTTP 409 Conflict, Negative-booking prevented
                  </div>
                </div>

                {/* Test 2 */}
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold text-dark small">Test 2: Rule 2 Single Admission Check</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Simulates admitting a patient who already has an active hospital admission.
                      </div>
                    </div>
                    <button onClick={runRule2Test} className="btn btn-outline-danger btn-sm px-3">
                      Run Test 2
                    </button>
                  </div>
                  <div className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.68rem' }}>
                    Expected: HTTP 409 Conflict, Duplicate admission blocked
                  </div>
                </div>

                {/* Test 3 */}
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold text-dark small">Test 3: Rule 6 Unavailable Bed Transfer Lock</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Attempts to transfer an admitted patient to a bed that is currently occupied or under maintenance.
                      </div>
                    </div>
                    <button onClick={runRule6Test} className="btn btn-outline-danger btn-sm px-3">
                      Run Test 3
                    </button>
                  </div>
                  <div className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.68rem' }}>
                    Expected: HTTP 409 Conflict, Atomic pre-condition failed
                  </div>
                </div>

                {/* Test 4 */}
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold text-dark small">Test 4: Rule 4 Atomic Status Synchronization</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Runs end-to-end admission and discharge to verify bed status transitions atomically without race conditions.
                      </div>
                    </div>
                    <button onClick={runRule4Test} className="btn btn-outline-success btn-sm px-3">
                      Run Test 4
                    </button>
                  </div>
                  <div className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.68rem' }}>
                    Expected: AVAILABLE &rarr; OCCUPIED &rarr; AVAILABLE
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sandbox Logs Column */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-dark text-white p-4 h-100 font-monospace">
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                <span className="small text-uppercase text-secondary fw-bold">Live Execution & Guard Log</span>
                <button
                  onClick={() => setSandboxLogs([])}
                  className="btn btn-outline-secondary btn-sm py-0 px-2 text-white"
                  style={{ fontSize: '0.7rem' }}
                >
                  Clear Logs
                </button>
              </div>

              <div className="overflow-auto small" style={{ maxHeight: '420px' }}>
                {sandboxLogs.length === 0 ? (
                  <div className="text-secondary py-5 text-center">
                    // Ready. Click any test button on the left to execute security assertions.
                  </div>
                ) : (
                  sandboxLogs.map((log) => (
                    <div key={log.id} className="mb-2 pb-2 border-bottom border-secondary-subtle">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-white-50" style={{ fontSize: '0.7rem' }}>
                          [{log.time}]
                        </span>
                        <span
                          className={`badge ${
                            log.type === 'success' ? 'bg-success' : log.type === 'danger' ? 'bg-danger' : 'bg-info'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="text-white fw-semibold mt-1">{log.title}</div>
                      <div className="text-white-50 small mt-1" style={{ fontSize: '0.75rem' }}>
                        {log.detail}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADMIT PATIENT */}
      {/* ========================================================================= */}
      {showAdmitModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <BedDouble size={20} />
                  <span>Inpatient Admission & Bed Assignment</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAdmitModal(false)}></button>
              </div>
              <form onSubmit={handleAdmissionSubmit}>
                <div className="modal-body p-4 small">
                  <div className="row g-3">
                    {/* Patient */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Patient *</label>
                      <select
                        className="form-select form-select-sm"
                        value={admitForm.patientId}
                        onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                        required
                      >
                        {patients.map((p) => {
                          const isAlreadyAdmitted = admissions.some(
                            (a) => a.patientId === p.id && a.status === 'ADMITTED'
                          );
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.patientCode}) {isAlreadyAdmitted ? '⚠️ [ALREADY ADMITTED]' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {admissions.some(
                        (a) => a.patientId === Number(admitForm.patientId) && a.status === 'ADMITTED'
                      ) && (
                        <div className="text-danger small mt-1">
                          ⚠️ Rule 2 Violation: Patient already has an active hospital admission.
                        </div>
                      )}
                    </div>

                    {/* Attending Doctor */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Attending Doctor *</label>
                      <select
                        className="form-select form-select-sm"
                        value={admitForm.doctorId}
                        onChange={(e) => setAdmitForm({ ...admitForm, doctorId: e.target.value })}
                        required
                      >
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.specialization})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Available Bed Selection */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Assign Bed (Available Only) *</label>
                      <select
                        className="form-select form-select-sm font-monospace"
                        value={admitForm.bedId}
                        onChange={(e) => setAdmitForm({ ...admitForm, bedId: e.target.value })}
                        required
                      >
                        <option value="">-- Choose an Available Bed --</option>
                        {beds.map((b) => (
                          <option
                            key={b.id}
                            value={b.id}
                            disabled={b.status !== 'AVAILABLE'}
                          >
                            {b.bedNumber} | {b.roomNumber} ({b.roomType}) - [₹{b.dailyRate}/day] - {b.status}
                          </option>
                        ))}
                      </select>
                      <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                        Rule 1 & 7 Guard: Unavailable or occupied beds are disabled.
                      </div>
                    </div>

                    {/* Admission Type */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Admission Type *</label>
                      <select
                        className="form-select form-select-sm"
                        value={admitForm.admissionType}
                        onChange={(e) => setAdmitForm({ ...admitForm, admissionType: e.target.value })}
                        required
                      >
                        <option value="EMERGENCY">Emergency Admission</option>
                        <option value="ELECTIVE">Elective / Planned Surgery</option>
                        <option value="TRANSFER">Inter-facility Transfer</option>
                        <option value="OBSERVATION">Clinical Observation</option>
                      </select>
                    </div>

                    {/* Provisional Diagnosis */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">Provisional Clinical Diagnosis</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={admitForm.provisionalDiagnosis}
                        onChange={(e) => setAdmitForm({ ...admitForm, provisionalDiagnosis: e.target.value })}
                        placeholder="e.g. Acute coronary syndrome, community-acquired pneumonia"
                      />
                    </div>

                    {/* Reason for Admission */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">Clinical Reason for Admission *</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={admitForm.reasonForAdmission}
                        onChange={(e) => setAdmitForm({ ...admitForm, reasonForAdmission: e.target.value })}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAdmitModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-3">
                    Confirm Admission & Occupy Bed
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PATIENT TRANSFER (ATOMIC SWAP) */}
      {/* ========================================================================= */}
      {showTransferModal && selectedAdmission && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <ArrowRightLeft size={18} />
                  <span>Transfer Patient Bed (Rule 5 & 6)</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTransferModal(false)}></button>
              </div>
              <form onSubmit={handleTransferSubmit}>
                <div className="modal-body p-4 small">
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="fw-bold text-dark">{selectedAdmission.patientName}</div>
                    <div className="text-muted font-monospace">{selectedAdmission.patientCode}</div>
                    <div className="mt-2 text-primary fw-semibold">
                      Current Bed: <span className="badge bg-danger text-white">{selectedAdmission.bedNumber}</span> ({selectedAdmission.roomNumber})
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Destination Bed (Available Only) *</label>
                    <select
                      className="form-select form-select-sm font-monospace"
                      value={transferForm.targetBedId}
                      onChange={(e) => setTransferForm({ ...transferForm, targetBedId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Target Available Bed --</option>
                      {beds
                        .filter((b) => b.id !== selectedAdmission.bedId)
                        .map((b) => (
                          <option
                            key={b.id}
                            value={b.id}
                            disabled={b.status !== 'AVAILABLE'}
                          >
                            {b.bedNumber} | {b.roomNumber} ({b.roomType}) - [{b.status}]
                          </option>
                        ))}
                    </select>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                      Rule 6: Target bed must be AVAILABLE. Occupied or maintenance beds cannot be targeted.
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Clinical Reason for Transfer *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={transferForm.reason}
                      onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowTransferModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Execute Atomic Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REASSIGN DOCTOR */}
      {/* ========================================================================= */}
      {showReassignDoctorModal && selectedAdmission && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Stethoscope size={18} />
                  <span>Reassign Attending Physician</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReassignDoctorModal(false)}></button>
              </div>
              <form onSubmit={handleReassignDoctorSubmit}>
                <div className="modal-body p-4 small">
                  <div className="mb-3">
                    <label className="form-label text-muted">Patient</label>
                    <div className="fw-bold">{selectedAdmission.patientName} ({selectedAdmission.patientCode})</div>
                    <div className="text-muted small">Current Attending: <b>{selectedAdmission.doctorName}</b></div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">New Attending Doctor *</label>
                    <select
                      className="form-select form-select-sm"
                      value={reassignDoctorForm.newDoctorId}
                      onChange={(e) => setReassignDoctorForm({ ...reassignDoctorForm, newDoctorId: e.target.value })}
                      required
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Reassignment Note / Clinical Reason</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={reassignDoctorForm.reason}
                      onChange={(e) => setReassignDoctorForm({ ...reassignDoctorForm, reason: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowReassignDoctorModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Update Attending Doctor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BED STATUS CHANGE */}
      {/* ========================================================================= */}
      {showBedStatusModal && selectedBed && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Wrench size={18} />
                  <span>Update Bed Status ({selectedBed.bedNumber})</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowBedStatusModal(false)}></button>
              </div>
              <form onSubmit={handleBedStatusSubmit}>
                <div className="modal-body p-4 small">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Target Bed Status *</label>
                    <select
                      className="form-select form-select-sm"
                      value={bedStatusForm.status}
                      onChange={(e) => setBedStatusForm({ ...bedStatusForm, status: e.target.value })}
                      required
                    >
                      <option value="AVAILABLE">AVAILABLE (Intake Ready)</option>
                      <option value="RESERVED">RESERVED (Hold for Scheduled Case)</option>
                      <option value="MAINTENANCE">MAINTENANCE (Servicing / Sanitization)</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Reason / Technician Note</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={bedStatusForm.reason}
                      onChange={(e) => setBedStatusForm({ ...bedStatusForm, reason: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowBedStatusModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Save Bed Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ROOM MODAL (CREATE / EDIT) */}
      {/* ========================================================================= */}
      {showRoomModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {selectedRoom ? `Edit Room ${selectedRoom.roomNumber}` : 'Create Hospital Room'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRoomModal(false)}></button>
              </div>
              <form onSubmit={handleRoomSubmit}>
                <div className="modal-body p-4 small">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Room Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace text-uppercase"
                        value={roomForm.roomNumber}
                        onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Room Type *</label>
                      <select
                        className="form-select form-select-sm"
                        value={roomForm.roomType}
                        onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                        required
                      >
                        <option value="ICU">ICU</option>
                        <option value="GENERAL_WARD">GENERAL_WARD</option>
                        <option value="SEMI_PRIVATE">SEMI_PRIVATE</option>
                        <option value="PRIVATE_AC">PRIVATE_AC</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold">Floor / Wing *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={roomForm.floor}
                        onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Daily Rate (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm"
                        value={roomForm.dailyRate}
                        onChange={(e) => setRoomForm({ ...roomForm, dailyRate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label fw-semibold">Capacity (Beds)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={roomForm.capacity}
                        onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={roomForm.status}
                        onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowRoomModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    {selectedRoom ? 'Update Room' : 'Save Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: BED MODAL (CREATE) */}
      {/* ========================================================================= */}
      {showBedModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Add Bed Station</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowBedModal(false)}></button>
              </div>
              <form onSubmit={handleBedSubmit}>
                <div className="modal-body p-4 small">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Parent Room *</label>
                    <select
                      className="form-select form-select-sm"
                      value={bedForm.roomId}
                      onChange={(e) => setBedForm({ ...bedForm, roomId: e.target.value })}
                      required
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roomNumber} ({r.roomType} - {r.floor})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Bed Number / Identifier *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace text-uppercase"
                      value={bedForm.bedNumber}
                      onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Initial Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={bedForm.status}
                      onChange={(e) => setBedForm({ ...bedForm, status: e.target.value })}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RESERVED">RESERVED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Station Notes</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={bedForm.notes}
                      onChange={(e) => setBedForm({ ...bedForm, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowBedModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Create Bed
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: DISCHARGE PREPARATION & CLEARANCE (RULE 3, 4, 10) */}
      {/* ========================================================================= */}
      {showDischargeModal && selectedAdmission && dischargePrepData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <CheckCircle2 size={20} />
                  <span>Discharge Preparation & Financial Clearance Review</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDischargeModal(false)}></button>
              </div>
              <div className="modal-body p-4 small">
                {/* Financial Review Box */}
                <div className="card bg-light border mb-4 p-3 rounded-3">
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="text-muted small">Patient Name</div>
                      <div className="fw-bold fs-6">{dischargePrepData.patientName}</div>
                      <div className="text-muted font-monospace">{dischargePrepData.patientCode}</div>
                    </div>

                    <div className="col-6 col-md-4">
                      <div className="text-muted small">Stay Duration & Bed</div>
                      <div className="fw-bold">{dischargePrepData.lengthOfStayDays} Day(s)</div>
                      <div className="text-muted">
                        {dischargePrepData.bedNumber} (₹{dischargePrepData.dailyRate}/day)
                      </div>
                    </div>

                    <div className="col-6 col-md-4">
                      <div className="text-muted small">Accrued Bed Cost</div>
                      <div className="fw-bold text-primary fs-6 font-monospace">
                        ₹{dischargePrepData.accruedRoomCharges?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                        Length of stay × daily rate
                      </div>
                    </div>
                  </div>

                  {/* Financial Rule 10 Status Strip */}
                  <hr className="my-2" />
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-1">
                    <div>
                      <span className="fw-semibold">Rule 10 Billing Clearance: </span>
                      {dischargePrepData.billingCleared ? (
                        <span className="badge bg-success font-monospace">CLEARED (Balance: ₹0.00)</span>
                      ) : (
                        <span className="badge bg-danger font-monospace">
                          OUTSTANDING BALANCE: ₹{dischargePrepData.outstandingBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>

                    <div className="text-muted small">
                      Total Billed: ₹{dischargePrepData.totalBilledAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Paid: ₹{dischargePrepData.totalPaidAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {!dischargePrepData.billingCleared && (
                    <div className="alert alert-danger py-2 small mb-0 mt-2 d-flex align-items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>
                        Rule 10 Clearance Error: Cannot discharge patient with unsettled invoice. Settle balance in <b>Billing</b> module.
                      </span>
                    </div>
                  )}
                </div>

                {/* Clinical Clearance Checklist */}
                <h6 className="fw-bold text-dark mb-2">Clinical Milestone Verification</h6>
                <div className="row g-2 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="p-2 border rounded bg-white d-flex align-items-center gap-2 text-success">
                      <CheckCircle2 size={16} />
                      <span className="small fw-semibold">Vitals Stable</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 border rounded bg-white d-flex align-items-center gap-2 text-success">
                      <CheckCircle2 size={16} />
                      <span className="small fw-semibold">Lab Tests Finalized</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 border rounded bg-white d-flex align-items-center gap-2 text-success">
                      <CheckCircle2 size={16} />
                      <span className="small fw-semibold">Meds Reconciled</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 border rounded bg-white d-flex align-items-center gap-2 text-success">
                      <CheckCircle2 size={16} />
                      <span className="small fw-semibold">Doctor Approved</span>
                    </div>
                  </div>
                </div>

                {/* Discharge Summary Form */}
                <h6 className="fw-bold text-dark mb-2">Discharge Summary & Instructions</h6>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Final Clinical Diagnosis Summary *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={dischargeForm.diagnosisSummary}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, diagnosisSummary: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Treatment Given During Stay</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={dischargeForm.treatmentGiven}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, treatmentGiven: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Discharge Advice & Follow-Up Protocol</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={dischargeForm.dischargeAdvice}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeAdvice: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowDischargeModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDischarge}
                  disabled={!dischargePrepData.billingCleared}
                  className="btn btn-sm btn-danger px-3 d-flex align-items-center gap-1"
                >
                  <CheckCircle2 size={14} />
                  <span>Finalize Discharge & Release Bed (AVAILABLE)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

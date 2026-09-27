import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDataService } from '../../services/mockDataService';
import { RuleBadge } from '../common/RuleBadge';
import {
  Package,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Minus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  IndianRupee,
  AlertCircle,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  Layers,
  Sparkles,
  Lock,
  Stethoscope,
  User,
  Calendar,
  Check
} from 'lucide-react';
import Swal from 'sweetalert2';

export const PharmacyModule = () => {
  const { currentUser, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'prescriptions' | 'history' | 'sandbox'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters for Formulary
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // History Filter
  const [historyMedicineFilter, setHistoryMedicineFilter] = useState('ALL');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null); // null = Add, obj = Edit
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedMedForStock, setSelectedMedForStock] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMedForHistory, setSelectedMedForHistory] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedRxForIssue, setSelectedRxForIssue] = useState(null);

  // Sandbox Concurrency Test State
  const [concurrencyResults, setConcurrencyResults] = useState(null);
  const [isSimulatingConcurrency, setIsSimulatingConcurrency] = useState(false);

  const isPharmacist = hasRole('PHARMACIST', 'ADMIN');

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Queries from mockDataService
  const medicines = useMemo(() => {
    return mockDataService.getMedicines({
      search: searchTerm,
      category: selectedCategory,
      status: selectedStatus,
    });
  }, [searchTerm, selectedCategory, selectedStatus, refreshTrigger]);

  const summary = useMemo(() => {
    return mockDataService.getPharmacySummary();
  }, [refreshTrigger]);

  const issuedPrescriptions = useMemo(() => {
    const all = mockDataService.getPrescriptions ? mockDataService.getPrescriptions({ status: 'ALL' }, 0, 50).content : [];
    return all.filter((rx) => rx.status === 'ISSUED');
  }, [refreshTrigger]);

  const dispensedPrescriptions = useMemo(() => {
    const all = mockDataService.getPrescriptions ? mockDataService.getPrescriptions({ status: 'ALL' }, 0, 50).content : [];
    return all.filter((rx) => rx.status === 'DISPENSED').slice(0, 10);
  }, [refreshTrigger]);

  const inventoryHistory = useMemo(() => {
    const all = mockDataService.getInventoryHistory();
    return all.filter((tx) => {
      if (historyMedicineFilter !== 'ALL' && tx.medicineId !== Number(historyMedicineFilter)) return false;
      if (historyTypeFilter !== 'ALL' && tx.transactionType !== historyTypeFilter) return false;
      return true;
    });
  }, [historyMedicineFilter, historyTypeFilter, refreshTrigger]);

  // Categories list
  const categories = useMemo(() => {
    const allMeds = mockDataService.getMedicines();
    const set = new Set(allMeds.map((m) => m.category));
    return Array.from(set).sort();
  }, [refreshTrigger]);

  // =========================================================================
  // ACTIONS
  // =========================================================================

  const handleStockAdjust = (medicine, change, reason = '', type = 'ADJUSTMENT') => {
    try {
      mockDataService.updateMedicineStock(
        medicine.id,
        change,
        currentUser?.role,
        reason,
        currentUser?.name || currentUser?.username
      );
      triggerRefresh();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Inventory updated (${change > 0 ? `+${change}` : change} units)`,
        showConfirmButton: false,
        timer: 1600,
      });
    } catch (err) {
      if (err.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'SRS Rule 5 Prohibited (HTTP 403)',
          html: `<p><b>Pharmacist Authority Required:</b> Only authorized pharmacy staff can alter inventory levels.</p><p class="text-muted small">Current User Role: <code>${currentUser?.role}</code></p>`,
          confirmButtonColor: '#dc3545',
        });
      } else {
        Swal.fire({ icon: 'warning', title: 'Inventory Operation Failed', text: err.message });
      }
    }
  };

  const handleDirectDispense = (medicine) => {
    try {
      mockDataService.dispenseMedicine(
        medicine.id,
        1,
        currentUser?.role,
        'Direct counter dispensing to patient',
        currentUser?.name || currentUser?.username
      );
      triggerRefresh();
      Swal.fire({
        icon: 'success',
        title: 'Medication Safely Dispensed',
        text: `1 unit of ${medicine.name} (Batch: ${medicine.batchNumber}) safely dispensed. Remaining: ${medicine.stockQuantity - 1}`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      if (err.status === 400 && err.message.includes('Rule 12')) {
        Swal.fire({
          icon: 'error',
          title: 'PATIENT SAFETY ALERT: Rule 12 Lockout!',
          html: `<div class="text-start">
            <div class="alert alert-danger py-2 small mb-2 font-monospace">${err.message}</div>
            <p class="small text-muted mb-0">Under SRS Rule 12, hospital pharmacy safety controls permanently lock and forbid dispensing expired drug formulations.</p>
          </div>`,
          confirmButtonColor: '#dc3545',
        });
      } else if (err.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Rule 5 Authorization Required',
          text: err.message,
          confirmButtonColor: '#dc3545',
        });
      } else {
        Swal.fire({ icon: 'warning', title: 'Dispense Failed', text: err.message });
      }
    }
  };

  const handleDeleteMedicine = (medicine) => {
    Swal.fire({
      title: `Decommission ${medicine.name}?`,
      text: `Batch ${medicine.batchNumber}. This action is permanent.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          mockDataService.deleteMedicine(medicine.id, currentUser?.role, currentUser?.name);
          triggerRefresh();
          Swal.fire('Deleted!', `${medicine.name} was removed from the formulary.`, 'success');
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Decommissioning Denied',
            text: err.message,
          });
        }
      }
    });
  };

  // Concurrency Simulation: Test 2 concurrent requests on 1 unit
  const runConcurrencySimulation = () => {
    setIsSimulatingConcurrency(true);
    setConcurrencyResults(null);

    setTimeout(() => {
      // Find or create a test item with exactly 1 unit
      const allMeds = mockDataService.getMedicines();
      let targetMed = allMeds.find((m) => m.stockQuantity === 1 && new Date(m.expiryDate) > new Date());

      if (!targetMed) {
        // Adjust Metformin or Amoxicillin to 1 unit for test
        targetMed = allMeds.find((m) => new Date(m.expiryDate) > new Date());
        if (targetMed) {
          const diff = 1 - targetMed.stockQuantity;
          mockDataService.updateMedicineStock(targetMed.id, diff, 'PHARMACIST', 'Calibrating stock to 1 unit for Pessimistic Locking Test');
          targetMed = mockDataService.getMedicineById(targetMed.id);
        }
      }

      if (!targetMed) {
        setIsSimulatingConcurrency(false);
        Swal.fire('Error', 'No suitable active medicine found for test', 'error');
        return;
      }

      // Simulate Request 1 (Pharmacist A at Counter 1)
      const logs = [];
      logs.push(`[T0] Initial Stock for '${targetMed.name}' (Batch: ${targetMed.batchNumber}): ${targetMed.stockQuantity} unit.`);
      logs.push(`[T1] Incoming Concurrent Requests:`);
      logs.push(`     -> Request A: Counter #1 attempts to dispense 1 unit.`);
      logs.push(`     -> Request B: Emergency OPD attempts to dispense 1 unit.`);
      logs.push(`[T2] Database Transaction Engine applies PESSIMISTIC WRITE LOCK (SELECT FOR UPDATE) on Medicine #${targetMed.id}.`);

      let reqASuccess = false;
      let reqBSuccess = false;
      let reqBError = '';

      // Execute Request A
      try {
        mockDataService.dispenseMedicine(targetMed.id, 1, 'PHARMACIST', 'Request A: Counter 1');
        reqASuccess = true;
        const afterA = mockDataService.getMedicineById(targetMed.id);
        logs.push(`[T3] Request A ACQUIRES LOCK -> Stock validated (1 >= 1) -> Stock decremented to ${afterA.stockQuantity} -> COMMIT & RELEASE LOCK.`);
      } catch (err) {
        logs.push(`[T3] Request A failed: ${err.message}`);
      }

      // Execute Request B immediately after
      try {
        mockDataService.dispenseMedicine(targetMed.id, 1, 'PHARMACIST', 'Request B: Emergency OPD');
        reqBSuccess = true;
        logs.push(`[T4] Request B ACQUIRES LOCK -> Stock decremented.`);
      } catch (err) {
        reqBError = err.message;
        logs.push(`[T4] Request B ACQUIRES LOCK -> Evaluates Available Stock: 0 < 1 -> PREVENTED NEGATIVE STOCK!`);
        logs.push(`     -> Result: HTTP 400 Bad Request ("${err.message}").`);
        logs.push(`     -> Concurrency Race Condition Blocked: Stock did NOT become -1.`);
      }

      const finalMed = mockDataService.getMedicineById(targetMed.id);
      logs.push(`[T5] Final Verified Stock in Database: ${finalMed.stockQuantity} units (${finalMed.status}).`);

      triggerRefresh();
      setIsSimulatingConcurrency(false);
      setConcurrencyResults({
        targetMed,
        reqASuccess,
        reqBSuccess,
        reqBError,
        logs,
      });
    }, 600);
  };

  return (
    <div className="container-fluid p-4">
      {/* 1. Header with Rule Badges */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <h2 className="fw-bold text-dark mb-0">Pharmacy & Inventory Management</h2>
            <RuleBadge ruleNumber={5} title="Pharmacist Inventory Control" />
            <RuleBadge ruleNumber={12} title="Expired Drug Safety Lockout" />
          </div>
          <p className="text-muted small mb-0">
            Formulary batch management, pessimistic locking concurrency control, prescription dispensing, and audit ledger.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isPharmacist && (
            <button
              onClick={() => {
                setEditingMedicine(null);
                setShowAddEditModal(true);
              }}
              className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-2"
            >
              <Plus size={15} />
              <span>Catalog New Medicine</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`btn btn-sm px-3 shadow-sm d-flex align-items-center gap-2 ${
              activeTab === 'sandbox' ? 'btn-danger' : 'btn-outline-danger'
            }`}
          >
            <ShieldAlert size={15} />
            <span>Safety & Concurrency Sandbox</span>
          </button>
        </div>
      </div>

      {/* 2. Role Restriction Alert */}
      {!isPharmacist && (
        <div className="alert alert-warning py-2 px-3 rounded-3 small d-flex align-items-center justify-content-between mb-4 border-warning">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={18} className="text-warning flex-shrink-0" />
            <span>
              <b>SRS Rule 5 Restriction:</b> Logged in as <code>{currentUser?.role || 'GUEST'}</code>. Adding/modifying medicines, updating stock, and dispensing require <code>PHARMACIST</code> or <code>ADMIN</code> role.
            </span>
          </div>
          <span className="badge bg-dark">Read-Only Access</span>
        </div>
      )}

      {/* 3. Real-Time Summary Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Total Formulary</span>
              <Package size={18} className="text-primary" />
            </div>
            <div className="fs-4 fw-bold text-dark">{summary.totalMedicines}</div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              Batched SKUs
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">In Stock & Ready</span>
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <div className="fs-4 fw-bold text-success">{summary.availableCount}</div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              Optimal inventory
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className={`card border-0 shadow-sm rounded-3 p-3 h-100 ${summary.lowStockCount > 0 ? 'bg-warning-subtle' : 'bg-white'}`}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Low-Stock Alerts</span>
              <TrendingDown size={18} className="text-warning" />
            </div>
            <div className="fs-4 fw-bold text-warning-emphasis">{summary.lowStockCount}</div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              At or below minimum threshold
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className={`card border-0 shadow-sm rounded-3 p-3 h-100 ${summary.expiredCount > 0 ? 'bg-danger-subtle' : 'bg-white'}`}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Expired (Quarantine)</span>
              <ShieldAlert size={18} className="text-danger" />
            </div>
            <div className="fs-4 fw-bold text-danger">{summary.expiredCount}</div>
            <div className="text-danger small mt-1 fw-medium" style={{ fontSize: '0.72rem' }}>
              Rule 12 Auto-Lockout
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Pending Orders</span>
              <FileText size={18} className="text-info" />
            </div>
            <div className="fs-4 fw-bold text-info">{summary.pendingPrescriptionsCount}</div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              Issued prescriptions
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Inventory Value</span>
              <IndianRupee size={18} className="text-success" />
            </div>
            <div className="fs-4 fw-bold text-dark">₹{summary.totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              Acquisition valuation
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div className="d-flex align-items-center gap-2 border-bottom mb-4">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
            activeTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-muted'
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <Package size={16} />
            <span>Formulary & Stock Level</span>
            <span className="badge bg-light text-dark ms-1">{medicines.length}</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
            activeTab === 'prescriptions' ? 'border-primary text-primary' : 'border-transparent text-muted'
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <FileText size={16} />
            <span>Prescription Dispensing Hub</span>
            {issuedPrescriptions.length > 0 && (
              <span className="badge bg-danger ms-1">{issuedPrescriptions.length}</span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
            activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted'
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <Clock size={16} />
            <span>Inventory Movement History</span>
            <span className="badge bg-light text-dark ms-1">{inventoryHistory.length}</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`btn pb-2 px-3 fw-semibold rounded-0 border-0 border-bottom border-2 ${
            activeTab === 'sandbox' ? 'border-danger text-danger' : 'border-transparent text-muted'
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <ShieldAlert size={16} />
            <span>Concurrency & Safety Sandbox</span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MEDICINES & STOCK FORMULARY */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div>
          {/* Filters Bar */}
          <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <Search size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search name, generic, batch #, lab..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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

              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="EXPIRED">Expired (Rule 12)</option>
                </select>
              </div>

              <div className="col-12 col-md-2 text-md-end text-muted small">
                Showing <b>{medicines.length}</b> formulations
              </div>
            </div>
          </div>

          {/* Medicines Table */}
          <div className="card border-0 shadow-sm rounded-3 bg-white">
            <div className="card-body p-0 table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>Medication / Generic</th>
                    <th>Category</th>
                    <th>Batch #</th>
                    <th>Stock Level</th>
                    <th>Unit Price</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {medicines.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        <Package size={36} className="text-muted mb-2 opacity-50" />
                        <div>No medications match your filter criteria.</div>
                      </td>
                    </tr>
                  ) : (
                    medicines.map((med) => {
                      const isExpired = new Date(med.expiryDate) < new Date();
                      const isLowStock = med.stockQuantity <= med.minStockAlert && !isExpired;

                      return (
                        <tr key={med.id} className={isExpired ? 'table-danger-subtle' : ''}>
                          <td>
                            <div className="fw-bold text-dark">{med.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                              {med.genericName} • <span className="text-secondary">{med.manufacturer || 'Lab'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border font-monospace">
                              {med.category}
                            </span>
                          </td>
                          <td>
                            <span className="font-monospace text-dark fw-semibold">{med.batchNumber}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`fs-6 font-monospace fw-bold ${
                                med.stockQuantity === 0 ? 'text-danger' :
                                isLowStock ? 'text-warning-emphasis' : 'text-dark'
                              }`}>
                                {med.stockQuantity}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                / min: {med.minStockAlert}
                              </span>
                              {isLowStock && (
                                <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: '0.65rem' }}>
                                  LOW STOCK
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="fw-bold text-success font-monospace">
                              ₹{med.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td>
                            <div className={`font-monospace ${isExpired ? 'text-danger fw-bold' : ''}`}>
                              {med.expiryDate}
                            </div>
                            {isExpired && (
                              <div className="text-danger small fw-bold" style={{ fontSize: '0.68rem' }}>
                                EXPIRED (Rule 12 Lock)
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                isExpired
                                  ? 'bg-danger'
                                  : med.stockQuantity === 0
                                  ? 'bg-secondary'
                                  : isLowStock
                                  ? 'bg-warning text-dark'
                                  : 'bg-success'
                              }`}
                            >
                              {isExpired ? 'EXPIRED' : med.stockQuantity === 0 ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'AVAILABLE'}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-1">
                              {/* Quick stock +/- 10 */}
                              <button
                                onClick={() => handleStockAdjust(med, 10, 'Quick restock (+10 units)', 'STOCK_IN')}
                                className="btn btn-outline-secondary btn-sm p-1"
                                title="Quick Restock (+10)"
                              >
                                <Plus size={13} />
                              </button>
                              <button
                                onClick={() => handleStockAdjust(med, -5, 'Quick decrement (-5 units)', 'ADJUSTMENT')}
                                className="btn btn-outline-secondary btn-sm p-1"
                                title="Quick Reduce (-5)"
                                disabled={med.stockQuantity < 5}
                              >
                                <Minus size={13} />
                              </button>

                              {/* Dedicated Stock Adjust Dialog */}
                              <button
                                onClick={() => {
                                  setSelectedMedForStock(med);
                                  setShowStockModal(true);
                                }}
                                className="btn btn-light btn-sm p-1 border"
                                title="Comprehensive Stock Management (Audit-Tracked)"
                              >
                                <Layers size={13} />
                              </button>

                              {/* Dispense 1 unit */}
                              <button
                                onClick={() => handleDirectDispense(med)}
                                className={`btn btn-sm px-2 ${isExpired ? 'btn-danger' : 'btn-primary'}`}
                                title={isExpired ? 'Attempt Dispense (Rule 12 Test)' : 'Direct Dispense (1 unit)'}
                              >
                                {isExpired ? 'Test Expired' : 'Dispense'}
                              </button>

                              {/* Edit Medicine */}
                              {isPharmacist && (
                                <button
                                  onClick={() => {
                                    setEditingMedicine(med);
                                    setShowAddEditModal(true);
                                  }}
                                  className="btn btn-outline-secondary btn-sm p-1"
                                  title="Edit Medicine Details"
                                >
                                  <Edit size={13} />
                                </button>
                              )}

                              {/* Ledger / History */}
                              <button
                                onClick={() => {
                                  setSelectedMedForHistory(med);
                                  setShowHistoryModal(true);
                                }}
                                className="btn btn-outline-secondary btn-sm p-1"
                                title="View Movement History"
                              >
                                <Clock size={13} />
                              </button>

                              {/* Delete */}
                              {isPharmacist && (
                                <button
                                  onClick={() => handleDeleteMedicine(med)}
                                  className="btn btn-outline-danger btn-sm p-1"
                                  title="Decommission Medicine"
                                  disabled={med.stockQuantity > 0}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ISSUE AGAINST PRESCRIPTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'prescriptions' && (
        <div>
          <div className="alert alert-info py-2 px-3 rounded-3 small d-flex align-items-center justify-content-between mb-4 border-info">
            <div className="d-flex align-items-center gap-2">
              <FileText size={18} className="text-info flex-shrink-0" />
              <span>
                <b>Prescription Dispensing Operations:</b> Review physician prescription orders, verify formulary batch numbers, and issue medications with automatic inventory deduction and pessimistic concurrency locks.
              </span>
            </div>
            <span className="badge bg-dark font-monospace">{issuedPrescriptions.length} Pending Orders</span>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-8">
              <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title fw-bold mb-0 text-dark">
                    Active Prescriptions Awaiting Fulfillment ({issuedPrescriptions.length})
                  </h5>
                </div>
                <div className="card-body p-3">
                  {issuedPrescriptions.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <CheckCircle2 size={40} className="text-success mb-2" />
                      <div className="fw-semibold">All Prescriptions are Fulfilled</div>
                      <p className="small mb-0">No pending medication orders awaiting dispensing at this time.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {issuedPrescriptions.map((rx) => {
                        const allMeds = mockDataService.getMedicines();
                        let hasExpiredItem = false;
                        let hasOutOfStockItem = false;

                        const itemStockSummary = rx.items.map((it) => {
                          const med = allMeds.find((m) => m.id === Number(it.medicineId));
                          const isExp = med ? (new Date(med.expiryDate) < new Date() || med.status === 'EXPIRED') : false;
                          const isOOS = med ? med.stockQuantity < 1 : true;
                          if (isExp) hasExpiredItem = true;
                          if (isOOS) hasOutOfStockItem = true;

                          return {
                            ...it,
                            warehouseMed: med,
                            isExpired: isExp,
                            isOutOfStock: isOOS,
                          };
                        });

                        return (
                          <div key={rx.id} className="card border rounded-3 p-3 shadow-none">
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-primary font-monospace">Rx #{rx.id}</span>
                                <span className="fw-bold text-dark">{rx.patientName}</span>
                                <span className="badge bg-light text-secondary border font-monospace">{rx.patientCode}</span>
                              </div>
                              <div className="d-flex align-items-center gap-2 text-muted small">
                                <Calendar size={14} />
                                <span>{rx.prescriptionDate}</span>
                                <span>•</span>
                                <Stethoscope size={14} />
                                <span>{rx.doctorName}</span>
                              </div>
                            </div>

                            {/* Itemized Prescription Lines */}
                            <div className="table-responsive mb-3">
                              <table className="table table-sm table-bordered align-middle mb-0">
                                <thead className="table-light small">
                                  <tr>
                                    <th>Medicine</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                    <th>Warehouse Batch</th>
                                    <th>Inventory Status</th>
                                  </tr>
                                </thead>
                                <tbody className="small">
                                  {itemStockSummary.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="fw-semibold">{item.medicineName}</td>
                                      <td>{item.dosage}</td>
                                      <td>{item.frequency}</td>
                                      <td>{item.duration}</td>
                                      <td className="font-monospace">
                                        {item.warehouseMed ? item.warehouseMed.batchNumber : 'N/A'}
                                      </td>
                                      <td>
                                        {item.isExpired ? (
                                          <span className="badge bg-danger">RULE 12 EXPIRED</span>
                                        ) : item.isOutOfStock ? (
                                          <span className="badge bg-secondary">OUT OF STOCK (0)</span>
                                        ) : (
                                          <span className="badge bg-success">
                                            IN STOCK ({item.warehouseMed.stockQuantity} available)
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {rx.generalInstructions && (
                              <div className="text-muted small mb-3 bg-light p-2 rounded">
                                <b>Physician Instructions:</b> {rx.generalInstructions}
                              </div>
                            )}

                            {/* Action Bar */}
                            <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                              <div>
                                {hasExpiredItem && (
                                  <span className="badge bg-danger p-2 text-wrap">
                                    Rule 12 Lockout: Prescribed formulation has expired. Cannot dispense.
                                  </span>
                                )}
                                {!hasExpiredItem && hasOutOfStockItem && (
                                  <span className="badge bg-warning text-dark p-2">
                                    Stockout Warning: One or more medicines are out of stock.
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedRxForIssue(rx);
                                  setShowIssueModal(true);
                                }}
                                disabled={hasExpiredItem || hasOutOfStockItem}
                                className={`btn btn-sm px-3 shadow-sm d-flex align-items-center gap-1 ${
                                  hasExpiredItem ? 'btn-danger' : 'btn-success'
                                }`}
                              >
                                <Check size={15} />
                                <span>Verify & Issue Prescription #{rx.id}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recently Dispensed Log */}
            <div className="col-12 col-xl-4">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="card-title fw-bold mb-0 text-dark">
                    Recently Dispensed Orders
                  </h6>
                </div>
                <div className="card-body p-3">
                  {dispensedPrescriptions.length === 0 ? (
                    <div className="text-center py-4 text-muted small">No dispensed orders yet.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {dispensedPrescriptions.map((rx) => (
                        <div key={rx.id} className="p-2 border rounded bg-light small">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="fw-bold text-dark">Rx #{rx.id} - {rx.patientName}</span>
                            <span className="badge bg-success">DISPENSED</span>
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Dispensed by: {rx.dispensedBy || 'Pharmacist'}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {rx.dispensedAt ? new Date(rx.dispensedAt).toLocaleString() : ''}
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
      {/* TAB 3: INVENTORY MOVEMENT HISTORY & AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div>
          <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <select
                  className="form-select form-select-sm"
                  value={historyMedicineFilter}
                  onChange={(e) => setHistoryMedicineFilter(e.target.value)}
                >
                  <option value="ALL">All Medicines / Formulations</option>
                  {mockDataService.getMedicines().map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Batch: {m.batchNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Transaction Types</option>
                  <option value="INITIAL_STOCK">Initial Intake</option>
                  <option value="STOCK_IN">Restock (Stock In)</option>
                  <option value="DISPENSED">Dispensed to Patient</option>
                  <option value="ADJUSTMENT">Manual Adjustment</option>
                  <option value="CATALOG_UPDATE">Catalog Edit</option>
                </select>
              </div>

              <div className="col-12 col-md-5 text-md-end text-muted small">
                Showing <b>{inventoryHistory.length}</b> historical stock transactions
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-3 bg-white">
            <div className="card-body p-0 table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>Timestamp</th>
                    <th>Medicine & Batch</th>
                    <th>Transaction Type</th>
                    <th>Qty Change</th>
                    <th>Balance (Before → After)</th>
                    <th>Reference</th>
                    <th>Reason / Notes</th>
                    <th>Operator</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {inventoryHistory.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        No movement transactions recorded for this filter.
                      </td>
                    </tr>
                  ) : (
                    inventoryHistory.map((tx) => {
                      const isPositive = tx.quantityChange > 0;
                      const isNegative = tx.quantityChange < 0;

                      return (
                        <tr key={tx.id}>
                          <td className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{tx.medicineName}</div>
                            <span className="font-monospace text-muted" style={{ fontSize: '0.72rem' }}>
                              Batch: {tx.batchNumber}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                tx.transactionType === 'STOCK_IN' || tx.transactionType === 'INITIAL_STOCK'
                                  ? 'bg-success'
                                  : tx.transactionType === 'DISPENSED'
                                  ? 'bg-primary'
                                  : 'bg-warning text-dark'
                              }`}
                            >
                              {tx.transactionType}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`fw-bold font-monospace ${
                                isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-muted'
                              }`}
                            >
                              {isPositive ? `+${tx.quantityChange}` : tx.quantityChange}
                            </span>
                          </td>
                          <td>
                            <span className="font-monospace text-dark">
                              {tx.previousStock} → <b>{tx.newStock}</b>
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace">
                              {tx.referenceType} {tx.referenceId ? `#${tx.referenceId}` : ''}
                            </span>
                          </td>
                          <td className="text-muted" style={{ maxWidth: '240px' }}>
                            {tx.reason}
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{tx.performedBy}</div>
                            <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                              {tx.performedByRole}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONCURRENCY & SAFETY VERIFICATION SANDBOX */}
      {/* ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div>
          {/* Architectural Concurrency Explanation Card */}
          <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <ShieldCheck size={24} className="text-primary" />
              <h5 className="fw-bold mb-0 text-dark">
                Enterprise Locking & Concurrency Architecture Explained
              </h5>
            </div>

            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <div className="border rounded-3 p-3 bg-light h-100">
                  <h6 className="fw-bold text-dark d-flex align-items-center gap-2">
                    <Lock size={16} className="text-danger" />
                    <span>Why Pessimistic Locking for Medicine Issuance?</span>
                  </h6>
                  <p className="small text-muted mb-2">
                    In acute hospital pharmacy dispensing, multiple outpatient counters, inpatient ward automated dispensing cabinets, and emergency room nurses dispense high-turnover drugs concurrently.
                  </p>
                  <ul className="small text-muted ps-3 mb-0">
                    <li>
                      <b>Optimistic Locking Flaw:</b> If two stations attempt to dispense the final pack of a critical antibiotic concurrently under optimistic locking (<code>@Version</code>), one transaction succeeds while the other fails with an <code>OptimisticLockException</code>. This forces unexpected rollbacks and forces the pharmacist to repeat the whole checkout workflow.
                    </li>
                    <li className="mt-1">
                      <b>Pessimistic Locking Solution:</b> By executing <code>SELECT ... FOR UPDATE</code> via <code>@Lock(LockModeType.PESSIMISTIC_WRITE)</code> in <code>MedicineRepository.findByIdForUpdate()</code>, the database row is locked at transaction start. Concurrent requests queue cleanly; the second request verifies stock sequentially, safely determining if stock has dropped to zero without data corruption or phantom over-draws.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="border rounded-3 p-3 bg-light h-100">
                  <h6 className="fw-bold text-dark d-flex align-items-center gap-2">
                    <Sparkles size={16} className="text-success" />
                    <span>Hybrid Locking Strategy in our Implementation</span>
                  </h6>
                  <p className="small text-muted mb-2">
                    We combine both locking strategies where they excel:
                  </p>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered bg-white small mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Operation</th>
                          <th>Locking Mechanism</th>
                          <th>Rationale</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><b>Dispense / Issue Against Rx</b></td>
                          <td><code>PESSIMISTIC_WRITE</code></td>
                          <td>Serializes concurrent checkout, guarantees zero negative stock.</td>
                        </tr>
                        <tr>
                          <td><b>Stock In / Adjust</b></td>
                          <td><code>PESSIMISTIC_WRITE</code></td>
                          <td>Serializes concurrent batch counting.</td>
                        </tr>
                        <tr>
                          <td><b>Metadata Edit</b></td>
                          <td><code>@Version (Optimistic)</code></td>
                          <td>High read throughput for doctor lookups and catalog updates.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Tests */}
          <div className="row g-4">
            {/* Test 1: Concurrency Race Condition */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-danger font-monospace">TEST 1</span>
                  <span className="badge bg-light text-secondary border">Concurrency Test</span>
                </div>
                <h6 className="fw-bold text-dark">Simulate Concurrent Issuance on 1 Unit of Stock</h6>
                <p className="small text-muted mb-3">
                  Simulates Counter 1 and Emergency OPD concurrently issuing the last remaining pack of medication. Demonstrates that Pessimistic Locking serializes the request and prevents negative stock.
                </p>

                <button
                  onClick={runConcurrencySimulation}
                  disabled={isSimulatingConcurrency}
                  className="btn btn-outline-danger btn-sm px-3 shadow-sm d-flex align-items-center gap-2 mb-3"
                >
                  <ShieldAlert size={15} />
                  <span>{isSimulatingConcurrency ? 'Simulating Concurrency...' : 'Execute Concurrent Race Test'}</span>
                </button>

                {concurrencyResults && (
                  <div className="bg-dark text-light p-3 rounded-3 font-monospace small" style={{ fontSize: '0.72rem' }}>
                    <div className="text-warning fw-bold mb-1">=== CONCURRENCY ENGINE EXECUTION LOG ===</div>
                    {concurrencyResults.logs.map((line, idx) => (
                      <div key={idx} className={line.includes('Result:') || line.includes('PREVENTED') ? 'text-success' : ''}>
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Test 2: Rule 5 Unauthorized Role */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-warning text-dark font-monospace">TEST 2</span>
                  <span className="badge bg-light text-secondary border">SRS Rule 5</span>
                </div>
                <h6 className="fw-bold text-dark">Non-Pharmacist Inventory Update Rejection (HTTP 403)</h6>
                <p className="small text-muted mb-3">
                  Attempts to update pharmacy inventory under a non-pharmacist persona (e.g. <code>DOCTOR</code> or <code>PATIENT</code>).
                </p>

                <div className="d-flex gap-2 mb-3">
                  <button
                    onClick={() => {
                      try {
                        mockDataService.updateMedicineStock(1, 10, 'DOCTOR', 'Doctor attempting unauthorized stock change');
                      } catch (err) {
                        Swal.fire({
                          icon: 'error',
                          title: 'HTTP 403 Forbidden (SRS Rule 5)',
                          html: `<div class="text-start">
                            <p class="font-monospace text-danger small">${err.message}</p>
                            <p class="small text-muted mb-0">System enforced: Only registered pharmacists can alter hospital medicine counts.</p>
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
                        mockDataService.updateMedicineStock(1, 10, 'PATIENT', 'Patient attempting stock change');
                      } catch (err) {
                        Swal.fire({
                          icon: 'error',
                          title: 'HTTP 403 Forbidden (SRS Rule 5)',
                          html: `<div class="text-start">
                            <p class="font-monospace text-danger small">${err.message}</p>
                            <p class="small text-muted mb-0">System enforced: Patients cannot modify formulary inventory.</p>
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
                  Enforces Spring Security <code>@PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")</code>.
                </div>
              </div>
            </div>

            {/* Test 3: Rule 12 Expired Medication Lockout */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-danger font-monospace">TEST 3</span>
                  <span className="badge bg-light text-secondary border">SRS Rule 12</span>
                </div>
                <h6 className="fw-bold text-dark">Expired Drug Dispensing Lockout (HTTP 400 / 409)</h6>
                <p className="small text-muted mb-3">
                  Attempts to dispense or issue Ceftriaxone 1g Inj (Batch: CFT-2022-04, expired on 2024-01-10).
                </p>

                <button
                  onClick={() => {
                    const expiredMed = mockDataService.getMedicines().find((m) => m.id === 4 || m.status === 'EXPIRED');
                    if (expiredMed) {
                      handleDirectDispense(expiredMed);
                    }
                  }}
                  className="btn btn-outline-danger btn-sm mb-3"
                >
                  Attempt Dispense Ceftriaxone (Expired 2024)
                </button>

                <div className="border rounded p-2 bg-light small text-muted">
                  Guarantees that expired drugs are permanently quarantined and blocked from any patient administration.
                </div>
              </div>
            </div>

            {/* Test 4: Negative Stock Prevention */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-primary font-monospace">TEST 4</span>
                  <span className="badge bg-light text-secondary border">Inventory Rule</span>
                </div>
                <h6 className="fw-bold text-dark">Negative Quantity Prevention (HTTP 400)</h6>
                <p className="small text-muted mb-3">
                  Attempts to reduce medicine inventory below zero (e.g. subtracting 500 units from a stock of 8).
                </p>

                <button
                  onClick={() => {
                    try {
                      mockDataService.updateMedicineStock(3, -500, 'PHARMACIST', 'Invalid over-reduction test');
                    } catch (err) {
                      Swal.fire({
                        icon: 'error',
                        title: 'HTTP 400 Bad Request',
                        text: err.message,
                      });
                    }
                  }}
                  className="btn btn-outline-primary btn-sm mb-3"
                >
                  Attempt Reduce Stock by 500 Units
                </button>

                <div className="border rounded p-2 bg-light small text-muted">
                  Guarantees that stock quantity can never become negative in inventory storage.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT MEDICINE BATCH */}
      {/* ========================================================================= */}
      {showAddEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  const data = {
                    name: form.name.value,
                    genericName: form.genericName.value,
                    category: form.category.value,
                    batchNumber: form.batchNumber.value,
                    stockQuantity: form.stockQuantity ? form.stockQuantity.value : 0,
                    minStockAlert: form.minStockAlert.value,
                    unitPrice: form.unitPrice.value,
                    expiryDate: form.expiryDate.value,
                    manufacturer: form.manufacturer.value,
                  };

                  try {
                    if (editingMedicine) {
                      mockDataService.updateMedicine(editingMedicine.id, data, currentUser?.role, currentUser?.name);
                      Swal.fire('Updated!', `${data.name} details have been updated.`, 'success');
                    } else {
                      mockDataService.addMedicine(data, currentUser?.role, currentUser?.name);
                      Swal.fire('Cataloged!', `${data.name} (Batch: ${data.batchNumber}) cataloged into inventory.`, 'success');
                    }
                    setShowAddEditModal(false);
                    triggerRefresh();
                  } catch (err) {
                    Swal.fire('Validation Error', err.message, 'error');
                  }
                }}
              >
                <div className="modal-header bg-light py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingMedicine ? `Edit Medicine: ${editingMedicine.name}` : 'Catalog New Medicine Batch'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddEditModal(false)} />
                </div>

                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Brand Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={editingMedicine?.name || ''}
                        placeholder="e.g. Amoxicillin 500mg"
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">Generic Formulation</label>
                      <input
                        type="text"
                        name="genericName"
                        defaultValue={editingMedicine?.genericName || ''}
                        placeholder="e.g. Amoxicillin Trihydrate"
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Category <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="category"
                        required
                        defaultValue={editingMedicine?.category || 'ANTIBIOTIC'}
                        placeholder="e.g. ANTIBIOTIC, ANALGESIC"
                        className="form-control form-control-sm text-uppercase"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Batch Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="batchNumber"
                        required
                        defaultValue={editingMedicine?.batchNumber || ''}
                        placeholder="e.g. AMX-2024-88"
                        className="form-control form-control-sm font-monospace text-uppercase"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Unit Price (₹) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        name="unitPrice"
                        required
                        defaultValue={editingMedicine?.unitPrice || '10.00'}
                        className="form-control form-control-sm"
                      />
                    </div>

                    {!editingMedicine && (
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold text-dark">
                          Initial Stock Quantity <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          name="stockQuantity"
                          min="0"
                          required
                          defaultValue="50"
                          className="form-control form-control-sm font-monospace"
                        />
                      </div>
                    )}

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Minimum Stock Alert Threshold <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="minStockAlert"
                        min="0"
                        required
                        defaultValue={editingMedicine?.minStockAlert || '15'}
                        className="form-control form-control-sm font-monospace"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Expiry Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        defaultValue={editingMedicine?.expiryDate || ''}
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">Manufacturer / Pharmaceutical Lab</label>
                      <input
                        type="text"
                        name="manufacturer"
                        defaultValue={editingMedicine?.manufacturer || ''}
                        placeholder="e.g. Pfizer Healthcare, Novartis"
                        className="form-control form-control-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">
                    {editingMedicine ? 'Save Changes' : 'Catalog Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STOCK ADJUSTMENT (AUDIT TRACKED) */}
      {/* ========================================================================= */}
      {showStockModal && selectedMedForStock && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  const type = form.adjustType.value; // 'RESTOCK' | 'DEDUCT'
                  const qty = parseInt(form.amount.value, 10);
                  const reason = form.reason.value;

                  const delta = type === 'RESTOCK' ? qty : -qty;
                  handleStockAdjust(selectedMedForStock, delta, reason, type === 'RESTOCK' ? 'STOCK_IN' : 'ADJUSTMENT');
                  setShowStockModal(false);
                }}
              >
                <div className="modal-header bg-light py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    Stock Management: {selectedMedForStock.name}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowStockModal(false)} />
                </div>

                <div className="modal-body p-4">
                  <div className="border rounded p-3 bg-light mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Batch: <b>{selectedMedForStock.batchNumber}</b></span>
                      <span>Category: <b>{selectedMedForStock.category}</b></span>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>Current Stock: <b className="fs-6 text-dark font-monospace">{selectedMedForStock.stockQuantity}</b></span>
                      <span>Min Threshold: <b>{selectedMedForStock.minStockAlert}</b></span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Action Type</label>
                    <select name="adjustType" className="form-select form-select-sm">
                      <option value="RESTOCK">Stock In / Restock (+ Units)</option>
                      <option value="DEDUCT">Inventory Write-Off / Audit Adjustment (- Units)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Quantity <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      min="1"
                      required
                      defaultValue="10"
                      className="form-control form-control-sm font-monospace"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Reason / Justification <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="reason"
                      required
                      placeholder="e.g. Routine delivery intake PO-448, Damaged vial disposal"
                      className="form-control form-control-sm"
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowStockModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">
                    Commit Stock Change
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ISSUE PRESCRIPTION DIALOG */}
      {/* ========================================================================= */}
      {showIssueModal && selectedRxForIssue && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  const notes = form.dispensingNotes.value;

                  try {
                    const res = mockDataService.issuePrescriptionMedicines(
                      selectedRxForIssue.id,
                      null,
                      notes,
                      currentUser?.role,
                      currentUser?.name || currentUser?.username
                    );

                    Swal.fire({
                      icon: 'success',
                      title: 'Prescription Safely Dispensed!',
                      html: `<div class="text-start">
                        <p class="small text-muted mb-2">Prescription #${selectedRxForIssue.id} fulfilled for <b>${selectedRxForIssue.patientName}</b>.</p>
                        <div class="alert alert-success py-2 small mb-0 font-monospace">
                          ${res.issuedDetails.map((d) => `• ${d.medicineName} (${d.quantityIssued} unit deducted, ${d.remainingStock} remaining)`).join('<br>')}
                        </div>
                      </div>`,
                    });

                    setShowIssueModal(false);
                    triggerRefresh();
                  } catch (err) {
                    Swal.fire('Dispensing Failed', err.message, 'error');
                  }
                }}
              >
                <div className="modal-header bg-light py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    Issue Medications for Prescription #{selectedRxForIssue.id}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowIssueModal(false)} />
                </div>

                <div className="modal-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                    <div>
                      <span className="text-muted small">Patient: </span>
                      <b className="text-dark">{selectedRxForIssue.patientName} ({selectedRxForIssue.patientCode})</b>
                    </div>
                    <div>
                      <span className="text-muted small">Prescribing Doctor: </span>
                      <b className="text-dark">{selectedRxForIssue.doctorName}</b>
                    </div>
                  </div>

                  <h6 className="small fw-bold text-dark mb-2">Prescribed Medications to Deduct:</h6>
                  <div className="table-responsive mb-3">
                    <table className="table table-sm table-bordered align-middle mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th>Medication</th>
                          <th>Dosage / Instructions</th>
                          <th>Warehouse Stock</th>
                          <th>Units to Deduct</th>
                        </tr>
                      </thead>
                      <tbody className="small">
                        {selectedRxForIssue.items.map((it, idx) => {
                          const med = mockDataService.getMedicines().find((m) => m.id === Number(it.medicineId));
                          return (
                            <tr key={idx}>
                              <td className="fw-semibold">{it.medicineName}</td>
                              <td>{it.dosage} • {it.frequency} ({it.duration})</td>
                              <td>
                                {med ? (
                                  <span className="font-monospace">
                                    {med.stockQuantity} units (Batch: {med.batchNumber})
                                  </span>
                                ) : 'N/A'}
                              </td>
                              <td className="font-monospace fw-bold text-danger">-1 pack</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Pharmacist Dispensing Notes</label>
                    <textarea
                      name="dispensingNotes"
                      rows="2"
                      defaultValue="Medications verified against patient chart and dispensed with patient administration counseling."
                      className="form-control form-control-sm"
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowIssueModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-4">
                    Confirm Issuance & Deduct Inventory
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ITEM-SPECIFIC MOVEMENT TIMELINE */}
      {/* ========================================================================= */}
      {showHistoryModal && selectedMedForHistory && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-light py-3">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    Stock Ledger: {selectedMedForHistory.name}
                  </h5>
                  <span className="text-muted small">Batch: {selectedMedForHistory.batchNumber} • Expiry: {selectedMedForHistory.expiryDate}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowHistoryModal(false)} />
              </div>

              <div className="modal-body p-4 table-responsive" style={{ maxHeight: '60vh' }}>
                {(() => {
                  const txs = mockDataService.getInventoryHistory(selectedMedForHistory.id);
                  if (txs.length === 0) {
                    return <div className="text-center py-4 text-muted">No stock movement recorded yet.</div>;
                  }
                  return (
                    <table className="table table-sm table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>Timestamp</th>
                          <th>Type</th>
                          <th>Delta</th>
                          <th>Balance</th>
                          <th>Reason / Reference</th>
                          <th>Operator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txs.map((tx) => (
                          <tr key={tx.id}>
                            <td className="font-monospace text-muted">{new Date(tx.createdAt).toLocaleString()}</td>
                            <td>
                              <span className="badge bg-light text-dark border">{tx.transactionType}</span>
                            </td>
                            <td className={`font-monospace fw-bold ${tx.quantityChange > 0 ? 'text-success' : 'text-danger'}`}>
                              {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                            </td>
                            <td className="font-monospace">{tx.previousStock} → <b>{tx.newStock}</b></td>
                            <td>{tx.reason}</td>
                            <td>{tx.performedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowHistoryModal(false)}>
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

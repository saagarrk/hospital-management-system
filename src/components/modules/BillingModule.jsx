import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockDataService } from '../../services/mockDataService';
import { RuleBadge } from '../common/RuleBadge';
import {
  CreditCard,
  IndianRupee,
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Tag,
  ShieldAlert,
  ArrowRight,
  FileText,
  User,
  RefreshCw,
  Building2,
  Stethoscope,
  FlaskConical,
  Pill,
  Scissors,
  Layers,
  Check,
  X,
  Lock,
} from 'lucide-react';
import Swal from 'sweetalert2';

export const BillingModule = () => {
  const { currentUser, hasRole } = useAuth();
  const currentRole = currentUser?.role;

  // Active Tab: 'invoices', 'generate', 'payments', 'sandbox'
  const [activeTab, setActiveTab] = useState('invoices');

  // Core state
  const [bills, setBills] = useState(() => mockDataService.getBills());
  const [payments, setPayments] = useState(() => mockDataService.getPayments());
  const patients = mockDataService.getPatients();
  const admissions = mockDataService.getAdmissions();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UNPAID, PARTIAL, PAID
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, INPATIENT, OUTPATIENT, PHARMACY, LABORATORY, EMERGENCY

  // Modals state
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CARD', // CASH, CARD, UPI, ONLINE
    transactionReference: '',
    notes: 'POS payment settlement',
  });

  // Add Items Form
  const [newItemRows, setNewItemRows] = useState([
    { itemType: 'CONSULTATION', description: 'Doctor Specialist Review', quantity: 1, unitPrice: 150.0 },
  ]);

  // Discount Form
  const [discountForm, setDiscountForm] = useState({
    discountType: 'PERCENTAGE', // PERCENTAGE, AMOUNT
    discountValue: 10.0,
    discountReason: 'Senior citizen authorized clinical concession',
  });

  // New Invoice Form
  const [generateForm, setGenerateForm] = useState({
    patientId: '1',
    billType: 'OUTPATIENT',
    admissionId: '',
    taxRate: 5.0,
    discountPercentage: 0.0,
    discountReason: '',
    notes: 'Outpatient clinical encounter billing statement',
    items: [
      { itemType: 'CONSULTATION', description: 'Comprehensive Specialist Medical Consultation', quantity: 1, unitPrice: 150.0 },
      { itemType: 'LAB_TEST', description: 'Complete Blood Count & Metabolic Profile', quantity: 1, unitPrice: 85.0 },
    ],
  });

  // Sandbox state
  const [sandboxLogs, setSandboxLogs] = useState([]);

  const refreshState = () => {
    setBills(mockDataService.getBills());
    setPayments(mockDataService.getPayments());
  };

  // KPIs
  const summary = useMemo(() => {
    return mockDataService.getBillingSummary();
  }, [bills, payments]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return mockDataService.getBills({
      search: searchQuery,
      paymentStatus: statusFilter,
      billType: typeFilter,
    });
  }, [bills, searchQuery, statusFilter, typeFilter]);

  // Presets for quick adding items
  const CLINICAL_PRESETS = [
    { itemType: 'CONSULTATION', description: 'General Physician Consultation', unitPrice: 80.0 },
    { itemType: 'CONSULTATION', description: 'Specialist Cardiology Rounds', unitPrice: 150.0 },
    { itemType: 'ROOM_CHARGE', description: 'General Ward Bed Daily Rate', unitPrice: 120.0 },
    { itemType: 'ROOM_CHARGE', description: 'ICU Telemetry Station Daily Rate', unitPrice: 850.0 },
    { itemType: 'LAB_TEST', description: 'Comprehensive Metabolic Panel (CMP)', unitPrice: 95.0 },
    { itemType: 'LAB_TEST', description: 'Lipid Profile & Cardiac Troponin', unitPrice: 140.0 },
    { itemType: 'MEDICINE', description: 'IV Antibiotic Ceftriaxone 1g Vial', unitPrice: 48.0 },
    { itemType: 'MEDICINE', description: 'Oral Antihypertensive Regimen (30 Days)', unitPrice: 65.0 },
    { itemType: 'PROCEDURE', description: 'Minor Emergency Wound Laceration Suturing', unitPrice: 350.0 },
    { itemType: 'OTHER_SERVICE', description: 'Sterile Nursing & Consumables Kit', unitPrice: 45.0 },
  ];

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // 1. Open Payment Modal
  const handleOpenPayment = (bill) => {
    setSelectedBill(bill);
    const balance = Math.round((bill.netAmount - bill.paidAmount) * 100) / 100;
    setPaymentForm({
      amount: balance.toFixed(2),
      paymentMethod: 'CARD',
      transactionReference: `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Counter POS settlement',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const res = mockDataService.recordPayment(
        selectedBill.id,
        {
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          transactionReference: paymentForm.transactionReference,
          notes: paymentForm.notes,
        },
        currentRole
      );

      refreshState();
      setShowPaymentModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Payment Credited',
        html: `
          <div class="text-start small">
            <p class="mb-1">Payment of <b>₹${parseFloat(paymentForm.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b> recorded via <b>${paymentForm.paymentMethod}</b>.</p>
            <p class="mb-1 font-monospace text-muted">Receipt: <b>${res.receipt.paymentReceiptNumber}</b> | Ref: ${res.receipt.transactionReference}</p>
            <p class="mb-0 text-success fw-semibold">
              Invoice Status: <span class="badge ${res.bill.paymentStatus === 'PAID' ? 'bg-success' : 'bg-warning'}">${res.bill.paymentStatus}</span> (Remaining: ₹${(res.bill.netAmount - res.bill.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
            </p>
          </div>
        `,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: err.status === 409 ? 'HTTP 409 Conflict (Duplicate Ref)' : 'Payment Denied',
        html: `<div class="text-start alert alert-danger py-2 small mb-0">${err.message}</div>`,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // 2. Open Invoice Detail View
  const handleViewInvoice = (bill) => {
    setSelectedBill(bill);
    setShowInvoiceModal(true);
  };

  // 3. Open Add Items Modal
  const handleOpenAddItems = (bill) => {
    setSelectedBill(bill);
    setNewItemRows([
      { itemType: 'CONSULTATION', description: 'Attending Physician Round Review', quantity: 1, unitPrice: 120.0 },
    ]);
    setShowAddItemsModal(true);
  };

  const handleAddItemsSubmit = (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      mockDataService.addBillItems(selectedBill.id, newItemRows, currentRole);
      refreshState();
      setShowAddItemsModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Invoice Items Added',
        text: 'Financial subtotal, tax, and net amount have been recalculated on the backend.',
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Action Denied', text: err.message });
    }
  };

  // 4. Open Apply Discount Modal
  const handleOpenDiscount = (bill) => {
    setSelectedBill(bill);
    setDiscountForm({
      discountType: 'PERCENTAGE',
      discountValue: 10.0,
      discountReason: 'Authorized medical director concession',
    });
    setShowDiscountModal(true);
  };

  const handleDiscountSubmit = (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      mockDataService.applyDiscount(
        selectedBill.id,
        {
          discountPercentage: discountForm.discountType === 'PERCENTAGE' ? discountForm.discountValue : null,
          discountAmount: discountForm.discountType === 'AMOUNT' ? discountForm.discountValue : null,
          discountReason: discountForm.discountReason,
        },
        currentRole
      );
      refreshState();
      setShowDiscountModal(false);

      Swal.fire({
        icon: 'success',
        title: 'Discount Applied',
        text: 'The invoice discount and net balance have been updated.',
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Discount Blocked',
        html: `<div class="text-start alert alert-danger py-2 small mb-0">${err.message}</div>`,
      });
    }
  };

  // 5. Generate Bill Submit
  const handleGenerateBillSubmit = (e) => {
    e.preventDefault();
    try {
      const generated = mockDataService.generateBill(generateForm, currentRole);
      refreshState();
      setActiveTab('invoices');

      Swal.fire({
        icon: 'success',
        title: 'Invoice Generated',
        html: `
          <div class="text-start small">
            <p class="mb-1">Invoice <b>${generated.billNumber}</b> created for <b>${generated.patientName}</b>.</p>
            <p class="mb-1">Subtotal: <b>₹${generated.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b> | Tax: ₹${generated.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Net: <b>₹${generated.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></p>
            <p class="mb-0 text-muted">All totals calculated on backend with <code>BigDecimal</code> precision.</p>
          </div>
        `,
        confirmButtonColor: '#0d6efd',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Generation Failed', text: err.message });
    }
  };

  // =========================================================================
  // SANDBOX ASSERTIONS (Never Trust Frontend Totals, Concurrency, Idempotency)
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

  // Test 1: Frontend Total Tamper Test
  const runTamperTest = () => {
    try {
      // Simulate client attempting to send manipulated total of ₹1.00 for ₹1000 worth of services
      const fakeClientTotal = 1.0;
      const realItems = [
        { itemType: 'ROOM_CHARGE', description: 'ICU Telemetry Station', quantity: 1, unitPrice: 850.0 },
        { itemType: 'LAB_TEST', description: 'Cardiac Troponin Panel', quantity: 1, unitPrice: 150.0 },
      ];

      // Call backend service which discards client total and computes real sum
      const bill = mockDataService.generateBill(
        {
          patientId: 1,
          billType: 'INPATIENT',
          items: realItems,
          clientTamperedTotal: fakeClientTotal, // Disregarded!
        },
        currentRole
      );

      refreshState();

      if (bill.totalAmount >= 1000.0) {
        addSandboxLog(
          'Frontend Tamper Protection Verified',
          'PASS (BACKEND AUTHORITATIVE)',
          `Client requested ₹${fakeClientTotal}. Backend calculated exact subtotal: ₹${bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} + 5% tax = Net ₹${bill.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          'success'
        );
        Swal.fire({
          icon: 'success',
          title: 'Tamper Protection Verified',
          html: `
            <div class="text-start small">
              <p class="text-success fw-bold mb-1">✓ Backend Calculated Financial Values with BigDecimal:</p>
              <ul class="mb-0 ps-3 text-muted">
                <li>Client attempt: Fraudulent total of <b>₹${fakeClientTotal}</b></li>
                <li>Backend authoritative computation: Subtotal <b>₹${bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></li>
                <li>Tax computed on server (5%): <b>₹${bill.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></li>
                <li>Authoritative Net Payable: <b>₹${bill.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></li>
              </ul>
            </div>
          `,
        });
      } else {
        throw new Error('Backend accepted client-submitted total!');
      }
    } catch (err) {
      addSandboxLog('Tamper Test Error', 'FAIL', err.message, 'danger');
      Swal.fire({ icon: 'error', title: 'Test Failed', text: err.message });
    }
  };

  // Test 2: Overpayment Prevention
  const runOverpaymentTest = () => {
    const targetBill = bills.find((b) => b.paymentStatus !== 'PAID');
    if (!targetBill) {
      Swal.fire({ icon: 'info', title: 'Requires an unpaid or partial invoice.' });
      return;
    }

    const remaining = targetBill.netAmount - targetBill.paidAmount;
    const excessiveAmount = remaining + 500.0;

    try {
      mockDataService.recordPayment(targetBill.id, excessiveAmount, currentRole);
      addSandboxLog('Overpayment Test Failed', 'FAIL', 'System permitted payment exceeding balance!', 'danger');
    } catch (err) {
      addSandboxLog(
        'Overpayment Guard Enforced',
        'HTTP 400 (PASS)',
        `Blocked attempt to pay ₹${excessiveAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} against balance of ₹${remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}: ${err.message}`,
        'success'
      );
      Swal.fire({
        icon: 'success',
        title: 'Overpayment Guard Enforced',
        html: `
          <div class="text-start small">
            <p class="mb-1 text-success fw-bold">✓ Financial Boundary Guard Active:</p>
            <div class="p-2 bg-light rounded border text-danger font-monospace mb-2">${err.message}</div>
            <p class="text-muted mb-0">Payments exceeding the remaining net amount are rejected with HTTP 400.</p>
          </div>
        `,
      });
    }
  };

  // Test 3: Duplicate Transaction Reference Guard (Idempotency)
  const runDuplicateRefTest = () => {
    const targetBill = bills.find((b) => b.paymentStatus !== 'PAID');
    if (!targetBill) {
      Swal.fire({ icon: 'info', title: 'Requires an unpaid invoice.' });
      return;
    }

    const sharedRef = `TXN-DUP-TEST-${Date.now()}`;

    try {
      // 1st attempt: Valid ₹100 payment
      mockDataService.recordPayment(
        targetBill.id,
        {
          amount: 100.0,
          paymentMethod: 'UPI',
          transactionReference: sharedRef,
        },
        currentRole
      );

      // 2nd attempt: Duplicate reference replay
      mockDataService.recordPayment(
        targetBill.id,
        {
          amount: 100.0,
          paymentMethod: 'UPI',
          transactionReference: sharedRef,
        },
        currentRole
      );

      addSandboxLog('Duplicate Payment Test Failed', 'FAIL', 'Replay was permitted!', 'danger');
    } catch (err) {
      refreshState();
      addSandboxLog(
        'Idempotency Guard Enforced',
        'HTTP 409 CONFLICT (PASS)',
        `Duplicate payment rejected: ${err.message}`,
        'success'
      );
      Swal.fire({
        icon: 'success',
        title: 'Idempotency Guard Enforced: 409 Conflict',
        html: `
          <div class="text-start small">
            <p class="mb-1 text-success fw-bold">✓ Duplicate Payment Processing Blocked:</p>
            <div class="p-2 bg-light rounded border text-danger font-monospace mb-2">${err.message}</div>
            <p class="text-muted mb-0">Replay attack or accidental double-clicking with identical transaction reference safely rejected.</p>
          </div>
        `,
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">PAID (SETTLED)</span>;
      case 'PARTIAL':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">PARTIAL</span>;
      case 'UNPAID':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">UNPAID</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const getItemTypeBadge = (type) => {
    switch (type) {
      case 'CONSULTATION':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">CONSULTATION</span>;
      case 'ROOM_CHARGE':
        return <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">ROOM CHARGE</span>;
      case 'LAB_TEST':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">LABORATORY</span>;
      case 'MEDICINE':
        return <span className="badge bg-emerald-subtle text-success border border-success-subtle">MEDICINE</span>;
      case 'PROCEDURE':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">PROCEDURE</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">SERVICE</span>;
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <CreditCard className="text-primary" size={28} />
              <span>Billing, Invoicing & Payments</span>
            </h2>
            <RuleBadge ruleNumber={10} title="Pre-Discharge Billing Clearance" />
            <span className="badge bg-dark-subtle text-dark border font-monospace">BigDecimal Engine</span>
          </div>
          <p className="text-muted small mb-0">
            Multi-service itemization (consultation, rooms, labs, pharmacy, surgical procedures), authorized discounts, tax calculations, and idempotent payment processing.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            onClick={refreshState}
            className="btn btn-outline-secondary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
            title="Refresh billing data"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          {hasRole('ADMIN', 'RECEPTIONIST') && (
            <button
              onClick={() => setActiveTab('generate')}
              className="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1"
            >
              <Plus size={16} />
              <span>Generate Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3 col-xl-2dot4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Total Invoices</span>
              <FileText size={16} className="text-primary" />
            </div>
            <div className="fs-4 fw-bold text-dark">{summary.totalInvoices}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Hospital statements
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3 col-xl-2dot4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100 border-start border-primary border-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Total Billed</span>
              <IndianRupee size={16} className="text-primary" />
            </div>
            <div className="fs-4 fw-bold text-primary font-monospace">₹{summary.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Subtotal + Taxes
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3 col-xl-2dot4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100 border-start border-success border-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Collected</span>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <div className="fs-4 fw-bold text-success font-monospace">₹{summary.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              {summary.paidCount} fully settled
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3 col-xl-2dot4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100 border-start border-danger border-4">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small">Outstanding Due</span>
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <div className="fs-4 fw-bold text-danger font-monospace">₹{summary.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              {summary.unpaidCount + summary.partialCount} pending invoices
            </div>
          </div>
        </div>

        <div className="col-12 col-md-12 col-xl-2dot4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-dark text-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-white-50 small">Rule 10 Gate</span>
              <Receipt size={16} className="text-warning" />
            </div>
            <div className="fs-5 fw-bold text-warning">Discharge Clearance</div>
            <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>
              Settlement verified prior to bed release
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <ul className="nav nav-pills mb-4 bg-white p-2 rounded-3 shadow-sm border border-light-subtle">
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'invoices' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <Receipt size={16} />
            <span>Invoices & Accounts ({bills.length})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('generate')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'generate' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <Plus size={16} />
            <span>Generate Invoice</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('payments')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'payments' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <CreditCard size={16} />
            <span>Payment Receipts Ledger ({payments.length})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`nav-link small py-2 px-3 d-flex align-items-center gap-2 ${
              activeTab === 'sandbox' ? 'active fw-bold' : 'text-dark'
            }`}
          >
            <ShieldAlert size={16} />
            <span>Financial Security Sandbox</span>
          </button>
        </li>
      </ul>

      {/* ========================================================================= */}
      {/* TAB 1: INVOICES & FINANCIAL RECORDS */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div>
          {/* Filters Bar */}
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
                    placeholder="Search invoice #, patient name, code..."
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="UNPAID">UNPAID only</option>
                    <option value="PARTIAL">PARTIAL only</option>
                    <option value="PAID">PAID (Settled) only</option>
                  </select>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Account Types</option>
                  <option value="INPATIENT">INPATIENT</option>
                  <option value="OUTPATIENT">OUTPATIENT</option>
                  <option value="PHARMACY">PHARMACY</option>
                  <option value="LABORATORY">LABORATORY</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>
              </div>

              <div className="col-12 col-md-2 text-md-end text-muted small">
                Showing <b>{filteredBills.length}</b> of {bills.length} invoices
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>Invoice Details</th>
                    <th>Patient Account</th>
                    <th>Account Type</th>
                    <th>Subtotal & Discounts</th>
                    <th>Tax (5%)</th>
                    <th>Net Amount</th>
                    <th>Paid / Remaining Due</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredBills.map((bill) => {
                    const remaining = Math.max(0, bill.netAmount - bill.paidAmount);
                    const isPaid = bill.paymentStatus === 'PAID';

                    return (
                      <tr key={bill.id} className={!isPaid && remaining > 0 ? 'table-warning-subtle' : ''}>
                        <td>
                          <div className="fw-bold font-monospace text-primary">{bill.billNumber}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Date: {bill.billDate} • Due: {bill.dueDate || '—'}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{bill.patientName}</div>
                          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.65rem' }}>
                            {bill.patientCode}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace">
                            {bill.billType}
                          </span>
                          {bill.admissionId && (
                            <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                              Adm #{bill.admissionId}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold font-monospace text-dark">₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          {bill.discountAmount > 0 ? (
                            <div className="text-success" style={{ fontSize: '0.7rem' }}>
                              - ₹{bill.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({bill.discountPercentage || 0}%)
                            </div>
                          ) : (
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>No discount</div>
                          )}
                        </td>
                        <td>
                          <div className="font-monospace text-muted">₹{(bill.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>{bill.taxRate || 5}% GST</div>
                        </td>
                        <td>
                          <div className="fw-bold text-dark font-monospace fs-6">₹{bill.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>{bill.items?.length || 0} Line item(s)</div>
                        </td>
                        <td>
                          <div className="font-monospace text-success fw-medium">
                            Paid: ₹{bill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          {remaining > 0 ? (
                            <div className="font-monospace text-danger fw-bold">
                              Due: ₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Cleared ₹0.00</div>
                          )}
                        </td>
                        <td>{getStatusBadge(bill.paymentStatus)}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            {/* View / Print Invoice */}
                            <button
                              onClick={() => handleViewInvoice(bill)}
                              className="btn btn-outline-secondary btn-sm py-1 px-2"
                              title="View and print invoice statement"
                            >
                              <Printer size={13} />
                            </button>

                            {/* Add Items (if unpaid or partial) */}
                            {!isPaid && hasRole('ADMIN', 'RECEPTIONIST') && (
                              <button
                                onClick={() => handleOpenAddItems(bill)}
                                className="btn btn-outline-primary btn-sm py-1 px-2"
                                title="Add billable items to invoice"
                              >
                                <Plus size={13} />
                              </button>
                            )}

                            {/* Apply Discount */}
                            {!isPaid && hasRole('ADMIN', 'RECEPTIONIST') && (
                              <button
                                onClick={() => handleOpenDiscount(bill)}
                                className="btn btn-outline-dark btn-sm py-1 px-2"
                                title="Apply authorized discount"
                              >
                                <Tag size={13} />
                              </button>
                            )}

                            {/* Record Payment */}
                            {!isPaid && (
                              <button
                                onClick={() => handleOpenPayment(bill)}
                                className="btn btn-success btn-sm py-1 px-2 d-inline-flex align-items-center gap-1"
                                title="Record payment"
                              >
                                <IndianRupee size={13} />
                                <span>Pay</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        No invoices found matching current filter parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GENERATE NEW INVOICE */}
      {/* ========================================================================= */}
      {activeTab === 'generate' && (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <Plus size={20} className="text-primary" />
                <span>Create New Patient Billing Statement</span>
              </h5>
              <p className="text-muted small mb-4">
                Calculate charges across consultation, hospital beds, diagnostics, pharmaceuticals, and surgical procedures. All monetary calculations are performed strictly on the backend.
              </p>

              <form onSubmit={handleGenerateBillSubmit}>
                {/* Patient & Account Parameters */}
                <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Patient *</label>
                    <select
                      className="form-select form-select-sm"
                      value={generateForm.patientId}
                      onChange={(e) => setGenerateForm({ ...generateForm, patientId: e.target.value })}
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
                    <label className="form-label fw-semibold small">Bill / Service Category *</label>
                    <select
                      className="form-select form-select-sm"
                      value={generateForm.billType}
                      onChange={(e) => setGenerateForm({ ...generateForm, billType: e.target.value })}
                      required
                    >
                      <option value="OUTPATIENT">OUTPATIENT (OPD & General Care)</option>
                      <option value="INPATIENT">INPATIENT (Hospitalization & Ward)</option>
                      <option value="PHARMACY">PHARMACY (Dispensary Prescriptions)</option>
                      <option value="LABORATORY">LABORATORY (Pathology & Diagnostics)</option>
                      <option value="EMERGENCY">EMERGENCY (Trauma & Urgent Care)</option>
                    </select>
                  </div>

                  {generateForm.billType === 'INPATIENT' && (
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Link Active Inpatient Admission</label>
                      <select
                        className="form-select form-select-sm"
                        value={generateForm.admissionId}
                        onChange={(e) => setGenerateForm({ ...generateForm, admissionId: e.target.value })}
                      >
                        <option value="">-- None / Standalone Inpatient Bill --</option>
                        {admissions
                          .filter((a) => a.status === 'ADMITTED')
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              Adm #{a.id} - {a.patientName} ({a.bedNumber} - {a.roomNumber})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Healthcare Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control form-control-sm"
                      value={generateForm.taxRate}
                      onChange={(e) => setGenerateForm({ ...generateForm, taxRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Line Items Builder */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">Itemized Clinical Services</h6>
                  <button
                    type="button"
                    onClick={() =>
                      setGenerateForm((prev) => ({
                        ...prev,
                        items: [
                          ...prev.items,
                          { itemType: 'CONSULTATION', description: '', quantity: 1, unitPrice: 50.0 },
                        ],
                      }))
                    }
                    className="btn btn-outline-primary btn-sm py-1 px-2"
                  >
                    <Plus size={13} /> Add Line Item
                  </button>
                </div>

                <div className="table-responsive border rounded-3 mb-4">
                  <table className="table table-sm align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '22%' }}>Category</th>
                        <th style={{ width: '40%' }}>Description</th>
                        <th style={{ width: '12%' }}>Qty</th>
                        <th style={{ width: '16%' }}>Unit (₹)</th>
                        <th className="text-end" style={{ width: '10%' }}>Del</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generateForm.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={item.itemType}
                              onChange={(e) => {
                                const copy = [...generateForm.items];
                                copy[idx].itemType = e.target.value;
                                setGenerateForm({ ...generateForm, items: copy });
                              }}
                            >
                              <option value="CONSULTATION">CONSULTATION</option>
                              <option value="ROOM_CHARGE">ROOM_CHARGE</option>
                              <option value="LAB_TEST">LAB_TEST</option>
                              <option value="MEDICINE">MEDICINE</option>
                              <option value="PROCEDURE">PROCEDURE</option>
                              <option value="OTHER_SERVICE">OTHER_SERVICE</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Clinical item description..."
                              value={item.description}
                              onChange={(e) => {
                                const copy = [...generateForm.items];
                                copy[idx].description = e.target.value;
                                setGenerateForm({ ...generateForm, items: copy });
                              }}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className="form-control form-control-sm"
                              value={item.quantity}
                              onChange={(e) => {
                                const copy = [...generateForm.items];
                                copy[idx].quantity = parseInt(e.target.value) || 1;
                                setGenerateForm({ ...generateForm, items: copy });
                              }}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-control form-control-sm font-monospace"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const copy = [...generateForm.items];
                                copy[idx].unitPrice = parseFloat(e.target.value) || 0;
                                setGenerateForm({ ...generateForm, items: copy });
                              }}
                              required
                            />
                          </td>
                          <td className="text-end">
                            {generateForm.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = generateForm.items.filter((_, i) => i !== idx);
                                  setGenerateForm({ ...generateForm, items: copy });
                                }}
                                className="btn btn-outline-danger btn-sm p-1"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Discount & Courtesy Deductions */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold small">Discount Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control form-control-sm"
                      placeholder="0.0"
                      value={generateForm.discountPercentage}
                      onChange={(e) => setGenerateForm({ ...generateForm, discountPercentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-12 col-md-8">
                    <label className="form-label fw-semibold small">Discount Authorization Note</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Senior citizen welfare, staff family courtesy"
                      value={generateForm.discountReason}
                      onChange={(e) => setGenerateForm({ ...generateForm, discountReason: e.target.value })}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" onClick={() => setActiveTab('invoices')} className="btn btn-secondary btn-sm px-3">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">
                    Generate Authoritative Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Preset Selector Column */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
              <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                <Tag size={16} className="text-primary" />
                <span>Clinical Charge Presets</span>
              </h6>
              <p className="text-muted small mb-3">
                Click any standard hospital item below to quickly add it to your invoice builder.
              </p>

              <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '480px' }}>
                {CLINICAL_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      setGenerateForm((prev) => ({
                        ...prev,
                        items: [
                          ...prev.items,
                          {
                            itemType: preset.itemType,
                            description: preset.description,
                            quantity: 1,
                            unitPrice: preset.unitPrice,
                          },
                        ],
                      }))
                    }
                    className="p-2 border rounded-3 bg-light hover-shadow cursor-pointer transition-all d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <div className="fw-semibold small text-dark">{preset.description}</div>
                      <div className="mt-1">{getItemTypeBadge(preset.itemType)}</div>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold font-monospace text-primary small">₹{preset.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>+ Add</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENT RECEIPTS LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
          <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Receipt className="text-primary" size={20} />
                <span>Payment Receipts & Remittance Audit Log</span>
              </h5>
              <p className="text-muted small mb-0">
                Idempotent transaction ledger across CASH, CARD, UPI, and ONLINE channels.
              </p>
            </div>
            <span className="badge bg-secondary font-monospace">{payments.length} Receipts Processed</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light text-uppercase">
                <tr>
                  <th>Receipt #</th>
                  <th>Invoice Link</th>
                  <th>Timestamp</th>
                  <th>Method</th>
                  <th>Transaction Reference</th>
                  <th>Amount Credited</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="fw-bold font-monospace text-dark">{p.paymentReceiptNumber}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-primary border font-monospace">{p.billNumber}</span>
                    </td>
                    <td className="font-monospace text-muted">{p.paymentDate}</td>
                    <td>
                      <span className="badge bg-dark-subtle text-dark border font-monospace">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className="font-monospace text-muted">{p.transactionReference}</span>
                    </td>
                    <td>
                      <span className="fw-bold font-monospace text-success fs-6">₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No payment transactions recorded in current ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FINANCIAL SECURITY SANDBOX */}
      {/* ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 h-100">
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <ShieldAlert size={22} className="text-danger" />
                <span>Financial Integrity & Concurrency Sandbox</span>
              </h5>
              <p className="text-muted small mb-4">
                Execute automated interactive assertions verifying that financial calculations, boundary limits, and idempotency guarantees hold under adversarial conditions.
              </p>

              <div className="d-flex flex-column gap-3">
                {/* Test 1 */}
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold text-dark small">Test 1: Never Trust Frontend Totals</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Simulates client tampering sending a ₹1.00 total for ₹1,000 worth of clinical services. Backend authoritative engine recomputes exact sum.
                      </div>
                    </div>
                    <button onClick={runTamperTest} className="btn btn-outline-danger btn-sm px-3">
                      Run Test 1
                    </button>
                  </div>
                  <div className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.68rem' }}>
                    Assertion: Server BigDecimal calculation supersedes client payload
                  </div>
                </div>

                {/* Test 2 */}
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold text-dark small">Test 2: Overpayment Prevention</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Simulates attempting to credit an amount that exceeds the remaining unpaid invoice balance.
                      </div>
                    </div>
                    <button onClick={runOverpaymentTest} className="btn btn-outline-danger btn-sm px-3">
                      Run Test 2
                    </button>
                  </div>
                  <div className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.68rem' }}>
                    Assertion: HTTP 400 Bad Request if payAmount &gt; remaining
                  </div>
                </div>

                {/* Test 3 */}
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold text-dark small">Test 3: Idempotency & Duplicate Reference Check</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Simulates replaying a payment with an already processed transaction reference.
                      </div>
                    </div>
                    <button onClick={runDuplicateRefTest} className="btn btn-outline-danger btn-sm px-3">
                      Run Test 3
                    </button>
                  </div>
                  <div className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.68rem' }}>
                    Assertion: HTTP 409 Conflict prevents double payment processing
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sandbox Logs Column */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-dark text-white p-4 h-100 font-monospace">
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                <span className="small text-uppercase text-secondary fw-bold">Live Financial Security Log</span>
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
                    // Ready. Click any test button on the left to verify financial security rules.
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
      {/* MODAL 1: RECORD PAYMENT */}
      {/* ========================================================================= */}
      {showPaymentModal && selectedBill && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <CreditCard size={18} />
                  <span>Record Payment: {selectedBill.billNumber}</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <form onSubmit={handlePaymentSubmit}>
                <div className="modal-body p-4 small">
                  {/* Account Summary Strip */}
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{selectedBill.patientName}</div>
                        <div className="text-muted font-monospace">{selectedBill.patientCode}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Remaining Balance</div>
                        <div className="fs-5 fw-bold text-danger font-monospace">
                          ₹{(selectedBill.netAmount - selectedBill.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={(selectedBill.netAmount - selectedBill.paidAmount).toFixed(2)}
                      className="form-control form-control-sm font-monospace fs-6"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      required
                    />
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                      Overpayment protection: Max allowed is ₹{(selectedBill.netAmount - selectedBill.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Channel / Method *</label>
                    <select
                      className="form-select form-select-sm"
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="CARD">CARD (Credit / Debit POS Terminal)</option>
                      <option value="UPI">UPI (Unified Instant Payment / QR Code)</option>
                      <option value="CASH">CASH (Counter Cashier Desk)</option>
                      <option value="ONLINE">ONLINE (Patient Portal / Net Banking)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Transaction Reference / UTR Number *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace text-uppercase"
                      value={paymentForm.transactionReference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                      required
                    />
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                      Idempotency Guard: Unique reference prevents duplicate transaction posting.
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Payment Note / Remittance Memo</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-success px-4">
                    Confirm & Credit Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INVOICE PRINTABLE DOCUMENT / DETAILED BREAKDOWN */}
      {/* ========================================================================= */}
      {showInvoiceModal && selectedBill && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <FileText size={18} />
                  <span>Hospital Invoice Statement: {selectedBill.billNumber}</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowInvoiceModal(false)}></button>
              </div>

              <div className="modal-body p-4 small" id="printable-invoice">
                {/* Letterhead */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                  <div>
                    <h4 className="fw-bold text-primary mb-0">Shree Jeevan Multispeciality Hospital</h4>
                    <div className="text-muted small">Pune, Maharashtra • "Compassionate Care. Trusted Healthcare."</div>
                    <div className="text-muted small font-monospace">GSTIN: 27AAAAJ1234F1Z8 · Contact: +91 20 2567 8900 · care@shreejeevan.com</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold fs-5 font-monospace text-dark">{selectedBill.billNumber}</div>
                    <div className="text-muted small">Bill Date: {selectedBill.billDate}</div>
                    <div className="text-muted small">Due Date: {selectedBill.dueDate || 'Upon Receipt'}</div>
                    <div className="mt-1">{getStatusBadge(selectedBill.paymentStatus)}</div>
                  </div>
                </div>

                {/* Patient Information Strip */}
                <div className="row g-3 p-3 bg-light rounded border mb-4">
                  <div className="col-6 col-md-4">
                    <div className="text-muted small">Patient Name</div>
                    <div className="fw-bold fs-6">{selectedBill.patientName}</div>
                    <div className="text-muted font-monospace">{selectedBill.patientCode}</div>
                  </div>

                  <div className="col-6 col-md-4">
                    <div className="text-muted small">Account Type</div>
                    <div className="fw-bold">{selectedBill.billType}</div>
                    {selectedBill.admissionId && (
                      <div className="text-muted font-monospace">Inpatient Admission #{selectedBill.admissionId}</div>
                    )}
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="text-muted small">Billing Notes</div>
                    <div className="text-muted">{selectedBill.notes || 'Routine encounter billing statement'}</div>
                  </div>
                </div>

                {/* Itemized Table */}
                <h6 className="fw-bold text-dark mb-2">Itemized Services & Charges</h6>
                <div className="table-responsive border rounded-3 mb-4">
                  <table className="table table-sm align-middle mb-0 small">
                    <thead className="table-light text-uppercase">
                      <tr>
                        <th>#</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.items?.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="text-muted">{idx + 1}</td>
                          <td>{getItemTypeBadge(it.itemType)}</td>
                          <td className="fw-medium text-dark">{it.description}</td>
                          <td className="text-center font-monospace">{it.quantity}</td>
                          <td className="text-end font-monospace">₹{it.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="text-end font-monospace fw-semibold">₹{it.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    {/* Attached Payment History */}
                    <h6 className="fw-bold text-dark mb-2">Receipts Credited Against Invoice</h6>
                    <div className="border rounded p-2 bg-light">
                      {mockDataService.getPayments(selectedBill.id).map((pay) => (
                        <div key={pay.id} className="d-flex justify-content-between align-items-center py-1 border-bottom border-light-subtle">
                          <div>
                            <span className="fw-semibold font-monospace">{pay.paymentReceiptNumber}</span>
                            <span className="badge bg-secondary-subtle text-secondary ms-1">{pay.paymentMethod}</span>
                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>{pay.paymentDate}</div>
                          </div>
                          <span className="fw-bold text-success font-monospace">+₹{pay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      {mockDataService.getPayments(selectedBill.id).length === 0 && (
                        <div className="text-muted py-2 text-center" style={{ fontSize: '0.75rem' }}>
                          No payments recorded yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Subtotal (Gross Charges):</span>
                        <span className="font-monospace fw-semibold">₹{selectedBill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {selectedBill.discountAmount > 0 && (
                        <div className="d-flex justify-content-between mb-1 text-success">
                          <span>
                            Authorized Discount ({selectedBill.discountPercentage || 0}%):
                            {selectedBill.discountReason && (
                              <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                                Reason: {selectedBill.discountReason}
                              </div>
                            )}
                          </span>
                          <span className="font-monospace fw-semibold">- ₹{selectedBill.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Healthcare Tax ({selectedBill.taxRate || 5}%):</span>
                        <span className="font-monospace">₹{(selectedBill.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <hr className="my-2" />

                      <div className="d-flex justify-content-between mb-1 fs-6">
                        <span className="fw-bold">Total Net Payable:</span>
                        <span className="font-monospace fw-bold text-dark">₹{selectedBill.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="d-flex justify-content-between mb-1 text-success">
                        <span>Total Paid / Credited:</span>
                        <span className="font-monospace fw-semibold">₹{selectedBill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="d-flex justify-content-between pt-1 border-top border-dark-subtle fs-6">
                        <span className="fw-bold text-danger">Outstanding Balance Due:</span>
                        <span className="font-monospace fw-bold text-danger fs-5">
                          ₹{Math.max(0, selectedBill.netAmount - selectedBill.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowInvoiceModal(false)}>
                  Close
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
                  >
                    <Printer size={14} />
                    <span>Print Statement</span>
                  </button>
                  {selectedBill.paymentStatus !== 'PAID' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowInvoiceModal(false);
                        handleOpenPayment(selectedBill);
                      }}
                      className="btn btn-sm btn-success d-flex align-items-center gap-1"
                    >
                      <IndianRupee size={14} />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD ITEMS TO EXISTING INVOICE */}
      {/* ========================================================================= */}
      {showAddItemsModal && selectedBill && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Plus size={18} />
                  <span>Add Services to Invoice: {selectedBill.billNumber}</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddItemsModal(false)}></button>
              </div>

              <form onSubmit={handleAddItemsSubmit}>
                <div className="modal-body p-4 small">
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{selectedBill.patientName}</div>
                        <div className="text-muted font-monospace">{selectedBill.patientCode}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted small">Current Net</div>
                        <div className="fs-6 fw-bold font-monospace text-dark">₹{selectedBill.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">New Clinical Charges to Append</h6>
                    <button
                      type="button"
                      onClick={() =>
                        setNewItemRows((prev) => [
                          ...prev,
                          { itemType: 'LAB_TEST', description: '', quantity: 1, unitPrice: 75.0 },
                        ])
                      }
                      className="btn btn-outline-primary btn-sm py-1 px-2"
                    >
                      <Plus size={13} /> Add Line
                    </button>
                  </div>

                  <div className="table-responsive border rounded-3 mb-3">
                    <table className="table table-sm align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '25%' }}>Type</th>
                          <th style={{ width: '40%' }}>Description</th>
                          <th style={{ width: '12%' }}>Qty</th>
                          <th style={{ width: '15%' }}>Unit Price (₹)</th>
                          <th className="text-end" style={{ width: '8%' }}>Del</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newItemRows.map((it, idx) => (
                          <tr key={idx}>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={it.itemType}
                                onChange={(e) => {
                                  const copy = [...newItemRows];
                                  copy[idx].itemType = e.target.value;
                                  setNewItemRows(copy);
                                }}
                              >
                                <option value="CONSULTATION">CONSULTATION</option>
                                <option value="ROOM_CHARGE">ROOM_CHARGE</option>
                                <option value="LAB_TEST">LAB_TEST</option>
                                <option value="MEDICINE">MEDICINE</option>
                                <option value="PROCEDURE">PROCEDURE</option>
                                <option value="OTHER_SERVICE">OTHER_SERVICE</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Service description..."
                                value={it.description}
                                onChange={(e) => {
                                  const copy = [...newItemRows];
                                  copy[idx].description = e.target.value;
                                  setNewItemRows(copy);
                                }}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                className="form-control form-control-sm"
                                value={it.quantity}
                                onChange={(e) => {
                                  const copy = [...newItemRows];
                                  copy[idx].quantity = parseInt(e.target.value) || 1;
                                  setNewItemRows(copy);
                                }}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control form-control-sm font-monospace"
                                value={it.unitPrice}
                                onChange={(e) => {
                                  const copy = [...newItemRows];
                                  copy[idx].unitPrice = parseFloat(e.target.value) || 0;
                                  setNewItemRows(copy);
                                }}
                                required
                              />
                            </td>
                            <td className="text-end">
                              {newItemRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setNewItemRows(newItemRows.filter((_, i) => i !== idx))}
                                  className="btn btn-outline-danger btn-sm p-1"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddItemsModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-4">
                    Append Items & Recalculate Totals
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: APPLY AUTHORIZED DISCOUNT */}
      {/* ========================================================================= */}
      {showDiscountModal && selectedBill && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Tag size={18} />
                  <span>Authorize Discount: {selectedBill.billNumber}</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDiscountModal(false)}></button>
              </div>

              <form onSubmit={handleDiscountSubmit}>
                <div className="modal-body p-4 small">
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Invoice Subtotal:</span>
                      <span className="fw-bold font-monospace">₹{selectedBill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Already Collected:</span>
                      <span className="fw-bold font-monospace text-success">₹{selectedBill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Discount Mode *</label>
                    <select
                      className="form-select form-select-sm"
                      value={discountForm.discountType}
                      onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}
                    >
                      <option value="PERCENTAGE">Percentage (%) of Subtotal</option>
                      <option value="AMOUNT">Fixed Rupee Amount (₹)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      {discountForm.discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control form-control-sm font-monospace fs-6"
                      value={discountForm.discountValue}
                      onChange={(e) => setDiscountForm({ ...discountForm, discountValue: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Authorization Justification / Reason *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={discountForm.discountReason}
                      onChange={(e) => setDiscountForm({ ...discountForm, discountReason: e.target.value })}
                      placeholder="e.g. Senior citizen welfare concession, military veteran courtesy, hardship waiver"
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowDiscountModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-dark px-4">
                    Apply Authorized Discount
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

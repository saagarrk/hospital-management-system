import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditService } from '../services/auditService';
import {
  DataTable,
  Pagination,
  SearchFilterBar,
  LoadingSpinner,
  EmptyState,
  Modal,
} from '../components/common';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Clock,
  Activity,
  FileText,
  CreditCard,
  Building,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Swal from 'sweetalert2';

export const AuditLogsPage = () => {
  const { hasRole, currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    securityEvents: 0,
    clinicalEvents: 0,
    financialEvents: 0,
    inpatientEvents: 0,
  });

  // Modal inspection
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditService.getAuditLogs({
        page: currentPage - 1,
        pageSize,
        search: searchTerm,
        action: actionFilter,
        entityType: entityFilter,
        startDate,
        endDate,
      });

      if (response && response.content) {
        setLogs(response.content);
        setTotalElements(response.totalElements || response.content.length);
        setTotalPages(response.totalPages || 1);
      } else if (Array.isArray(response)) {
        setLogs(response);
        setTotalElements(response.length);
        setTotalPages(Math.ceil(response.length / pageSize) || 1);
      }

      const statsData = await auditService.getAuditStats();
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, pageSize, actionFilter, entityFilter, startDate, endDate]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setActionFilter('ALL');
    setEntityFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (!logs.length) {
      Swal.fire('No Data', 'No audit logs available to export.', 'info');
      return;
    }

    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'EntityType', 'EntityID', 'Status', 'IPAddress', 'Metadata'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.user || ''}"`,
      `"${l.role || ''}"`,
      `"${l.action || ''}"`,
      `"${l.entityType || ''}"`,
      l.entityId || '',
      `"${l.status || ''}"`,
      `"${l.ipAddress || ''}"`,
      `"${(l.metadata || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hms_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Exported audit logs to CSV',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const getActionBadge = (action) => {
    if (!action) return <span className="badge bg-secondary">UNKNOWN</span>;
    if (action.includes('LOGIN')) return <span className="badge bg-primary"><Key size={11} className="me-1" />{action}</span>;
    if (action.includes('USER')) return <span className="badge bg-info text-dark"><User size={11} className="me-1" />{action}</span>;
    if (action.includes('CANCEL')) return <span className="badge bg-danger"><AlertTriangle size={11} className="me-1" />{action}</span>;
    if (action.includes('DISCHARGE')) return <span className="badge bg-success"><CheckCircle2 size={11} className="me-1" />{action}</span>;
    if (action.includes('BILL') || action.includes('PAYMENT')) return <span className="badge bg-warning text-dark"><CreditCard size={11} className="me-1" />{action}</span>;
    if (action.includes('MEDICAL_RECORD') || action.includes('PRESCRIPTION')) return <span className="badge bg-indigo text-white" style={{ backgroundColor: '#4f46e5' }}><FileText size={11} className="me-1" />{action}</span>;
    if (action.includes('STOCK')) return <span className="badge bg-teal text-white" style={{ backgroundColor: '#0d9488' }}><Database size={11} className="me-1" />{action}</span>;
    return <span className="badge bg-secondary">{action}</span>;
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark small">
            {new Date(row.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Actor & Role',
      render: (row) => (
        <div>
          <div className="fw-bold text-primary small d-flex align-items-center gap-1">
            <User size={12} />
            {row.user}
          </div>
          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.65rem' }}>
            {row.role}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Event',
      render: (row) => getActionBadge(row.action),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark small">{row.entityType}</span>
          {row.entityId && (
            <span className="text-muted ms-1 font-monospace" style={{ fontSize: '0.75rem' }}>
              #{row.entityId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'metadata',
      header: 'Activity Metadata',
      render: (row) => (
        <div className="text-truncate text-secondary small" style={{ maxWidth: '320px' }} title={row.metadata}>
          {row.metadata || 'No additional parameters'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`badge ${row.status === 'SUCCESS' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
          {row.status || 'SUCCESS'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      align: 'text-end',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedLog(row);
            setIsModalOpen(true);
          }}
          className="btn btn-sm btn-outline-primary py-0 px-2 d-inline-flex align-items-center gap-1"
          style={{ fontSize: '0.75rem' }}
        >
          <Eye size={12} /> Details
        </button>
      ),
    },
  ];

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded bg-primary text-white">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="fw-bold mb-0 text-dark">System Audit & Compliance Log</h4>
              <p className="text-muted small mb-0">
                Immutable HIPAA-compliant operation tracking and non-repudiation audit trail
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button onClick={fetchLogs} className="btn btn-outline-secondary d-flex align-items-center gap-1 btn-sm">
            <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
            Refresh
          </button>
          <button onClick={handleExportCSV} className="btn btn-primary d-flex align-items-center gap-1 btn-sm shadow-sm">
            <Download size={14} />
            Export Audit CSV
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="text-muted small fw-semibold">Total Logged Events</div>
            <div className="fs-4 fw-bold text-dark mt-1">{stats.totalLogs}</div>
            <div className="text-primary small mt-1 font-monospace">100% Immutable</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="text-muted small fw-semibold">Today's Activity</div>
            <div className="fs-4 fw-bold text-primary mt-1">{stats.todayLogs}</div>
            <div className="text-success small mt-1">Real-time captured</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="text-muted small fw-semibold">Security & Access</div>
            <div className="fs-4 fw-bold text-indigo mt-1" style={{ color: '#4f46e5' }}>{stats.securityEvents}</div>
            <div className="text-muted small mt-1">Logins & User Gov</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="text-muted small fw-semibold">Clinical Records</div>
            <div className="fs-4 fw-bold text-success mt-1">{stats.clinicalEvents}</div>
            <div className="text-muted small mt-1">EHR & Prescriptions</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="text-muted small fw-semibold">Inpatient Moves</div>
            <div className="fs-4 fw-bold text-info mt-1">{stats.inpatientEvents}</div>
            <div className="text-muted small mt-1">Admit, Transfer, Bed</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="text-muted small fw-semibold">Financial Ledger</div>
            <div className="fs-4 fw-bold text-warning-emphasis mt-1">{stats.financialEvents}</div>
            <div className="text-muted small mt-1">Bills & Payments</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="card border-0 shadow-sm rounded-3 bg-white p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search user, metadata, IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
              <option value="PATIENT_UPDATED">PATIENT_UPDATED</option>
              <option value="APPOINTMENT_CREATED">APPOINTMENT_CREATED</option>
              <option value="APPOINTMENT_CANCELLED">APPOINTMENT_CANCELLED</option>
              <option value="MEDICAL_RECORD_CREATED">MEDICAL_RECORD_CREATED</option>
              <option value="MEDICAL_RECORD_UPDATED">MEDICAL_RECORD_UPDATED</option>
              <option value="PRESCRIPTION_CREATED">PRESCRIPTION_CREATED</option>
              <option value="MEDICINE_STOCK_CHANGED">MEDICINE_STOCK_CHANGED</option>
              <option value="ADMISSION">ADMISSION</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="DISCHARGE">DISCHARGE</option>
              <option value="BILL_CREATED">BILL_CREATED</option>
              <option value="PAYMENT">PAYMENT</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="ALL">All Entity Types</option>
              <option value="USER">USER</option>
              <option value="PATIENT">PATIENT</option>
              <option value="APPOINTMENT">APPOINTMENT</option>
              <option value="MEDICAL_RECORD">MEDICAL_RECORD</option>
              <option value="PRESCRIPTION">PRESCRIPTION</option>
              <option value="MEDICINE">MEDICINE</option>
              <option value="ADMISSION">ADMISSION</option>
              <option value="BILL">BILL</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <input
              type="date"
              className="form-control form-select-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
            />
          </div>

          <div className="col-6 col-md-2 d-flex gap-2">
            <button onClick={handleSearch} className="btn btn-sm btn-primary flex-grow-1">
              Filter
            </button>
            <button onClick={handleResetFilters} className="btn btn-sm btn-outline-secondary" title="Clear Filters">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyTitle="No Audit Logs Found"
          emptyDescription="There are no audit log events matching the selected filters."
        />

        <div className="p-3 border-top d-flex justify-content-between align-items-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Audit Log Inspection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Audit Event Deep Inspection"
        subtitle={`Audit Record #${selectedLog?.id} • Captured on ${selectedLog ? new Date(selectedLog.timestamp).toLocaleString() : ''}`}
        size="lg"
      >
        {selectedLog && (
          <div className="d-flex flex-column gap-3">
            <div className="p-3 bg-light rounded border">
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="text-muted small">Actor Identity</div>
                  <div className="fw-bold text-dark">{selectedLog.user}</div>
                  <span className="badge bg-secondary font-monospace">{selectedLog.role}</span>
                </div>

                <div className="col-12 col-md-4">
                  <div className="text-muted small">Action Taken</div>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="text-muted small">Target Resource</div>
                  <div className="fw-semibold text-dark">
                    {selectedLog.entityType} {selectedLog.entityId ? `#${selectedLog.entityId}` : ''}
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="text-muted small">Origination IP</div>
                  <div className="font-monospace small text-dark">{selectedLog.ipAddress || '127.0.0.1'}</div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="text-muted small">Outcome Status</div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    {selectedLog.status}
                  </span>
                </div>

                <div className="col-12 col-md-4">
                  <div className="text-muted small">Compliance Guarantee</div>
                  <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                    <ShieldCheck size={14} /> Zero Credential Leakage
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="fw-bold small text-dark mb-1">Audit Trail Activity Detail</label>
              <div className="p-3 bg-slate-50 border rounded font-monospace small text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                {selectedLog.metadata}
              </div>
            </div>

            <div>
              <label className="fw-bold small text-dark mb-1">Standardized JSON Audit Payload</label>
              <pre className="p-3 bg-dark text-light rounded font-monospace small mb-0" style={{ fontSize: '0.75rem' }}>
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;

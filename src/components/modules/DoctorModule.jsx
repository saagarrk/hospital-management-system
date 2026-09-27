import React, { useState } from 'react';
import { mockDataService } from '../../services/mockDataService';
import { RuleBadge } from '../common/RuleBadge';
import { Stethoscope, Calendar, Clock, IndianRupee, MapPin, Award } from 'lucide-react';

export const DoctorModule = () => {
  const doctors = mockDataService.getDoctors();
  const [selectedDept, setSelectedDept] = useState('ALL');

  const departments = [
    'ALL',
    'General Medicine',
    'Cardiology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology',
    'Dermatology',
    'ENT',
    'Neurology',
  ];

  const filtered = selectedDept === 'ALL' ? doctors : doctors.filter((d) => d.department === selectedDept);

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-dark mb-0">Doctor & OPD Roster</h2>
            <RuleBadge ruleNumber={2} title="Availability Validation" />
          </div>
          <p className="text-muted small mb-0">
            Shree Jeevan Multispeciality Hospital medical faculty, OPD room assignments, and consultation schedule.
          </p>
        </div>

        {/* Dept Filter */}
        <div className="d-flex flex-wrap gap-2">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`btn btn-sm ${selectedDept === dept ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="row g-4">
        {filtered.map((doc) => (
          <div key={doc.id} className="col-12 col-md-6 col-xl-4">
            <div className="card border-0 shadow-sm rounded-3 bg-white h-100 p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-primary-subtle text-primary p-3 rounded-circle d-flex align-items-center justify-content-center">
                  <Stethoscope size={26} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">{doc.name}</h5>
                  <div className="text-primary small fw-semibold">{doc.specialization}</div>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>{doc.qualification}</div>
                  {doc.experienceYears && (
                    <span className="badge bg-teal-subtle text-teal-800 border border-teal-200 mt-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
                      <Award size={10} />
                      {doc.experienceYears} years experience
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-light p-3 rounded-2 mb-3 small d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <MapPin size={13} /> Room:
                  </span>
                  <span className="fw-bold font-monospace">{doc.roomNumber}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <IndianRupee size={13} /> Consultation Fee:
                  </span>
                  <span className="fw-bold text-success">₹{Number(doc.consultationFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <Clock size={13} /> OPD Hours:
                  </span>
                  <span className="font-monospace">{doc.startTime} - {doc.endTime}</span>
                </div>
              </div>

              <div className="mt-auto">
                <div className="text-muted small mb-1 fw-semibold d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                  <Calendar size={12} /> AVAILABLE DUTY DAYS:
                </div>
                <div className="d-flex flex-wrap gap-1">
                  {doc.availableDays.split(',').map((day) => (
                    <span key={day} className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: '0.65rem' }}>
                      {day.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

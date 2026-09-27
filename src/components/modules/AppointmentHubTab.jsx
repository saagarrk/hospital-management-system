import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCode,
  Copy,
  Layers,
  Shield,
  Server,
  Database,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Users
} from 'lucide-react';
import Swal from 'sweetalert2';

export const AppointmentHubTab = () => {
  const [selectedFile, setSelectedFile] = useState('service');
  const [apiAction, setApiAction] = useState('book');
  const [simRole, setSimRole] = useState('RECEPTIONIST');
  const [simDoctorId, setSimDoctorId] = useState('1');
  const [simPatientId, setSimPatientId] = useState('1');
  const [simDate, setSimDate] = useState('2026-10-15');
  const [simTime, setSimTime] = useState('10:00:00');
  const [simApptId, setSimApptId] = useState('1');
  const [simStatus, setSimStatus] = useState('ALL');
  const [apiResponse, setApiResponse] = useState(null);
  const [copiedLabel, setCopiedLabel] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Copied ${label} to clipboard!`,
      showConfirmButton: false,
      timer: 1500,
    });
    setTimeout(() => setCopiedLabel(''), 2000);
  };

  const runSimulator = () => {
    const timestamp = new Date().toISOString();
    let result = {};

    switch (apiAction) {
      case 'book': {
        // Test Rule 1 conflict (Dr. Eleanor Sterling on 2026-10-15 at 10:00:00 is already booked)
        if (simDoctorId === '1' && simDate === '2026-10-15' && simTime === '10:00:00') {
          result = {
            timestamp,
            status: 409,
            error: 'Conflict',
            message: 'Conflict detected: Dr. Eleanor Sterling already has an active consultation scheduled for 2026-10-15 at 10:00:00. Please select an alternate available slot.',
            path: '/api/appointments',
            ruleEnforced: 'SRS Rule 1: A doctor cannot have two appointments at the same time.',
          };
        } else if (simRole === 'PATIENT' && simPatientId !== '1') {
          // Rule 5 violation
          result = {
            timestamp,
            status: 403,
            error: 'Forbidden',
            message: 'SRS Rule 5 Security Violation: Patients are strictly restricted to managing their own appointments.',
            path: '/api/appointments',
            ruleEnforced: 'SRS Rule 5: Patient Health Record Isolation',
          };
        } else {
          result = {
            timestamp,
            status: 201,
            message: 'Appointment successfully booked with status PENDING',
            data: {
              id: 9024,
              patientId: Number(simPatientId),
              patientName: simPatientId === '1' ? 'Johnathan Doe' : 'Elena Rostova',
              patientCode: simPatientId === '1' ? 'PT-0001' : 'PT-0002',
              doctorId: Number(simDoctorId),
              doctorName: simDoctorId === '1' ? 'Dr. Eleanor Sterling' : 'Dr. Marcus Holloway',
              departmentName: simDoctorId === '1' ? 'Cardiology' : 'Neurology',
              consultationFee: simDoctorId === '1' ? 150.00 : 180.00,
              appointmentDate: simDate,
              appointmentTime: simTime,
              status: 'PENDING',
              reason: 'Clinical consultation request',
              notes: 'Scheduled via REST API',
              createdAt: timestamp,
            },
          };
        }
        break;
      }

      case 'confirm': {
        if (simRole === 'PATIENT') {
          result = {
            timestamp,
            status: 403,
            error: 'Forbidden',
            message: 'Rule 4 Security Violation: Only clinical staff, doctors, or administrators can confirm appointments.',
            path: `/api/appointments/${simApptId}/confirm`,
            ruleEnforced: 'SRS Rule 4: Only authorized roles can perform each operation.',
          };
        } else {
          result = {
            timestamp,
            status: 200,
            message: 'Appointment successfully confirmed',
            data: {
              id: Number(simApptId),
              status: 'CONFIRMED',
              notes: '[Confirmation Note]: Slot verified by attending physician.',
              updatedAt: timestamp,
            },
          };
        }
        break;
      }

      case 'reschedule': {
        // If rescheduling to occupied slot (Dr. 1 at 2026-10-15 10:00:00)
        if (simDoctorId === '1' && simDate === '2026-10-15' && simTime === '10:00:00' && simApptId !== '1') {
          result = {
            timestamp,
            status: 409,
            error: 'Conflict',
            message: 'Reschedule Conflict: Dr. Eleanor Sterling already has an active appointment at 2026-10-15 10:00:00. Please select an available slot.',
            path: `/api/appointments/${simApptId}/reschedule`,
            ruleEnforced: 'SRS Rule 6: Rescheduling must also validate conflicts.',
          };
        } else {
          result = {
            timestamp,
            status: 200,
            message: 'Appointment rescheduled successfully',
            data: {
              id: Number(simApptId),
              appointmentDate: simDate,
              appointmentTime: simTime,
              status: 'CONFIRMED',
              notes: `[Rescheduled: ${new Date().toISOString().split('T')[0]}]: Patient requested adjusted slot.`,
              updatedAt: timestamp,
            },
          };
        }
        break;
      }

      case 'complete': {
        if (simRole === 'PATIENT') {
          result = {
            timestamp,
            status: 403,
            error: 'Forbidden',
            message: 'Rule 4 Security Violation: Only attending doctors or clinical staff can mark consultations as completed.',
            path: `/api/appointments/${simApptId}/complete`,
          };
        } else if (simApptId === '4') {
          // Appointment 4 is CANCELLED! Rule 3 violation
          result = {
            timestamp,
            status: 400,
            error: 'Bad Request',
            message: 'Rule 3 Violation: Cancelled appointments cannot become completed. Rebooking is strictly required.',
            path: `/api/appointments/${simApptId}/complete`,
            ruleEnforced: 'SRS Rule 3: Cancelled appointments cannot become completed.',
          };
        } else {
          result = {
            timestamp,
            status: 200,
            message: 'Appointment marked as completed',
            data: {
              id: Number(simApptId),
              status: 'COMPLETED',
              notes: '[Clinical Completion Notes]: Consultation concluded. Prescription emitted.',
              updatedAt: timestamp,
            },
          };
        }
        break;
      }

      case 'cancel': {
        result = {
          timestamp,
          status: 200,
          message: 'Appointment cancelled successfully',
          data: {
            id: Number(simApptId),
            status: 'CANCELLED',
            cancellationReason: 'Patient requested schedule cancellation.',
            updatedAt: timestamp,
          },
        };
        break;
      }

      case 'availability': {
        result = {
          timestamp,
          status: 200,
          message: 'Doctor availability schedule retrieved',
          data: {
            doctorId: Number(simDoctorId),
            doctorName: simDoctorId === '1' ? 'Dr. Eleanor Sterling' : 'Dr. Marcus Holloway',
            specialization: simDoctorId === '1' ? 'Cardiology' : 'Neurology',
            checkDate: simDate,
            dayOfWeek: 'THURSDAY',
            isWorkingDay: true,
            doctorScheduleDays: 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
            startTime: '09:00:00',
            endTime: '17:00:00',
            slotDurationMinutes: 30,
            totalSlots: 14,
            availableSlotsCount: 13,
            bookedSlotsCount: 1,
            slots: [
              { slotTime: '09:00:00', formattedTime: '09:00 AM', available: true, statusMessage: 'Available' },
              { slotTime: '09:30:00', formattedTime: '09:30 AM', available: true, statusMessage: 'Available' },
              { slotTime: '10:00:00', formattedTime: '10:00 AM', available: false, statusMessage: 'Booked (Active Appointment)', existingAppointmentId: 1 },
              { slotTime: '10:30:00', formattedTime: '10:30 AM', available: true, statusMessage: 'Available' },
              { slotTime: '11:00:00', formattedTime: '11:00 AM', available: true, statusMessage: 'Available' },
              { slotTime: '11:30:00', formattedTime: '11:30 AM', available: true, statusMessage: 'Available' },
            ],
            statusMessage: 'Slots available for booking.',
          },
        };
        break;
      }

      case 'history': {
        if (simRole === 'PATIENT' && simPatientId !== '1') {
          result = {
            timestamp,
            status: 403,
            error: 'Forbidden',
            message: 'SRS Rule 5 Security Violation: Patients are strictly restricted to accessing their own appointment history.',
            path: `/api/appointments/patient/${simPatientId}/history`,
          };
        } else {
          result = {
            timestamp,
            status: 200,
            message: 'Patient appointment history retrieved',
            data: {
              patientId: Number(simPatientId),
              patientName: 'Johnathan Doe',
              patientCode: 'PT-0001',
              totalAppointments: 2,
              completedAppointments: 0,
              cancelledAppointments: 0,
              upcomingAppointments: 2,
              history: [
                {
                  id: 1,
                  doctorName: 'Dr. Eleanor Sterling',
                  departmentName: 'Cardiology',
                  appointmentDate: '2026-10-15',
                  appointmentTime: '10:00:00',
                  status: 'CONFIRMED',
                  reason: 'Follow-up ECG and blood pressure review',
                },
              ],
            },
          };
        }
        break;
      }

      case 'search': {
        result = {
          timestamp,
          status: 200,
          message: 'Appointments retrieved successfully',
          data: {
            content: [
              {
                id: 1,
                patientName: 'Johnathan Doe',
                patientCode: 'PT-0001',
                doctorName: 'Dr. Eleanor Sterling',
                appointmentDate: '2026-10-15',
                appointmentTime: '10:00:00',
                status: 'CONFIRMED',
              },
              {
                id: 2,
                patientName: 'Elena Rostova',
                patientCode: 'PT-0002',
                doctorName: 'Dr. Marcus Holloway',
                appointmentDate: '2026-10-16',
                appointmentTime: '11:30:00',
                status: 'PENDING',
              },
            ],
            pageNumber: 0,
            pageSize: 10,
            totalElements: 4,
            totalPages: 1,
            last: true,
          },
        };
        break;
      }

      default:
        result = { status: 200, message: 'Ready' };
    }

    setApiResponse(result);
  };

  const codeSnippets = {
    entity: `package com.hospital.management.entity;

import com.hospital.management.enums.AppointmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Enterprise Appointment entity representing physician consultations.
 * Enforces database indexing for optimal slot-lookup and conflict-detection performance.
 */
@Entity
@Table(
    name = "appointments",
    indexes = {
        @Index(name = "idx_appointment_doc_date_time", columnList = "doctor_id, appointment_date, appointment_time"),
        @Index(name = "idx_appointment_patient", columnList = "patient_id"),
        @Index(name = "idx_appointment_status", columnList = "status"),
        @Index(name = "idx_appointment_date", columnList = "appointment_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(nullable = false, length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}`,

    statusEnum: `package com.hospital.management.enums;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * Production Lifecycle Statuses:
 * - PENDING: Initial state upon booking request awaiting clinical verification.
 * - CONFIRMED: Physician or clinical staff accepted/verified the booking slot.
 * - COMPLETED: Patient attended consultation and clinical care was rendered.
 * - CANCELLED: Terminated prior to completion. (Terminal state)
 */
public enum AppointmentStatus {
    PENDING,
    CONFIRMED,
    COMPLETED,
    CANCELLED;

    /**
     * Enforces SRS State Machine & Rule 8 / Rule 3:
     * - PENDING -> CONFIRMED or CANCELLED
     * - CONFIRMED -> COMPLETED or CANCELLED
     * - COMPLETED -> Terminal state (no transitions allowed)
     * - CANCELLED -> Terminal state (Cancelled appointments cannot become completed!)
     */
    public boolean canTransitionTo(AppointmentStatus targetStatus) {
        if (this == targetStatus) return true;
        return switch (this) {
            case PENDING -> targetStatus == CONFIRMED || targetStatus == CANCELLED;
            case CONFIRMED -> targetStatus == COMPLETED || targetStatus == CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    public boolean isActive() {
        return this == PENDING || this == CONFIRMED;
    }
}`,

    repository: `package com.hospital.management.repository;

import com.hospital.management.entity.Appointment;
import com.hospital.management.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /**
     * Enforces SRS Rule 1: A doctor cannot have two appointments at the same time.
     */
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Collection<AppointmentStatus> statuses
    );

    /**
     * Enforces SRS Rule 6: Rescheduling must also validate conflicts.
     * Excludes current appointment ID.
     */
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndIdNot(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Collection<AppointmentStatus> statuses,
            Long excludeId
    );

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            Collection<AppointmentStatus> statuses
    );

    List<Appointment> findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(Long patientId);

    @Query(
        value = "SELECT a FROM Appointment a " +
                "JOIN FETCH a.patient p " +
                "JOIN FETCH a.doctor d " +
                "WHERE (:doctorId IS NULL OR d.id = :doctorId) " +
                "AND (:patientId IS NULL OR p.id = :patientId) " +
                "AND (:date IS NULL OR a.appointmentDate = :date) " +
                "AND (:startDate IS NULL OR a.appointmentDate >= :startDate) " +
                "AND (:endDate IS NULL OR a.appointmentDate <= :endDate) " +
                "AND (:status IS NULL OR a.status = :status) " +
                "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "     OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')))",
        countQuery = "SELECT COUNT(a) FROM Appointment a " +
                     "WHERE (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
                     "AND (:patientId IS NULL OR a.patient.id = :patientId) " +
                     "AND (:date IS NULL OR a.appointmentDate = :date) " +
                     "AND (:startDate IS NULL OR a.appointmentDate >= :startDate) " +
                     "AND (:endDate IS NULL OR a.appointmentDate <= :endDate) " +
                     "AND (:status IS NULL OR a.status = :status) " +
                     "AND (:search IS NULL OR LOWER(a.patient.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(a.patient.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
                     "     OR LOWER(a.doctor.name) LIKE LOWER(CONCAT('%', :search, '%')))"
    )
    Page<Appointment> searchAppointments(
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("date") LocalDate date,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") AppointmentStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}`,

    service: `package com.hospital.management.service.impl;

import com.hospital.management.dto.appointment.*;
import com.hospital.management.entity.*;
import com.hospital.management.enums.AppointmentStatus;
import com.hospital.management.exception.*;
import com.hospital.management.repository.*;
import com.hospital.management.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private static final List<AppointmentStatus> ACTIVE_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentMapper appointmentMapper;

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(AppointmentBookingRequest request) {
        // Rule 7: Validate Patient and Doctor existence
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + request.getDoctorId()));

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.getPatientId()));

        // Rule 5: Patient isolation check
        verifyPatientOwnership(patient);

        // Rule 2: Doctor availability & clinic hours
        validateDoctorAvailability(doctor, request.getAppointmentDate(), request.getAppointmentTime());

        // Rule 1: Conflict-detection algorithm (Doctor cannot have two appointments at the same time)
        boolean hasConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                doctor.getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                ACTIVE_STATUSES
        );

        if (hasConflict) {
            throw new ConflictException(String.format(
                    "Conflict detected: Dr. %s already has an active consultation scheduled for %s at %s.",
                    doctor.getName(), request.getAppointmentDate(), request.getAppointmentTime()
            ));
        }

        Appointment appointment = appointmentMapper.toEntity(request, patient, doctor);
        appointment.setStatus(AppointmentStatus.PENDING);
        return appointmentMapper.toResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, AppointmentRescheduleRequest request) {
        Appointment appointment = findAppointmentById(appointmentId);
        verifyPatientOwnership(appointment.getPatient());

        // Rule 3 & 8: Cancelled or Completed cannot be rescheduled
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessRuleException("Cancelled appointments cannot be rescheduled.", HttpStatus.BAD_REQUEST);
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessRuleException("Completed appointments cannot be rescheduled.", HttpStatus.BAD_REQUEST);
        }

        validateDoctorAvailability(appointment.getDoctor(), request.getNewDate(), request.getNewTime());

        // Rule 6: Rescheduling must validate conflicts excluding current appointment ID
        boolean hasConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndIdNot(
                appointment.getDoctor().getId(),
                request.getNewDate(),
                request.getNewTime(),
                ACTIVE_STATUSES,
                appointment.getId()
        );

        if (hasConflict) {
            throw new ConflictException(String.format(
                    "Reschedule Conflict: Dr. %s already has an active appointment at %s %s.",
                    appointment.getDoctor().getName(), request.getNewDate(), request.getNewTime()
            ));
        }

        appointment.setAppointmentDate(request.getNewDate());
        appointment.setAppointmentTime(request.getNewTime());
        return appointmentMapper.toResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional
    public AppointmentResponse completeAppointment(Long appointmentId, String notes) {
        verifyStaffOrDoctorRole("Only attending doctors or clinical staff can mark consultations completed.");
        Appointment appointment = findAppointmentById(appointmentId);

        // Rule 3: Cancelled appointments cannot become completed
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new InvalidStatusTransitionException(
                    "Rule 3 Violation: Cancelled appointments cannot become completed. Rebooking is strictly required."
            );
        }

        validateStatusTransition(appointment.getStatus(), AppointmentStatus.COMPLETED);
        appointment.setStatus(AppointmentStatus.COMPLETED);
        return appointmentMapper.toResponse(appointmentRepository.save(appointment));
    }
}`,

    controller: `package com.hospital.management.controller;

import com.hospital.management.dto.appointment.*;
import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.enums.AppointmentStatus;
import com.hospital.management.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @Valid @RequestBody AppointmentBookingRequest request) {
        AppointmentResponse response = appointmentService.bookAppointment(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Appointment successfully booked with status PENDING"), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> confirmAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.confirmAppointment(id, notes)));
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRescheduleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.rescheduleAppointment(id, request)));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.cancelAppointment(id, reason)));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> completeAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.completeAppointment(id, notes)));
    }

    @GetMapping("/doctor/{doctorId}/availability")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DoctorAvailabilityResponse>> checkDoctorAvailability(
            @PathVariable Long doctorId,
            @RequestParam LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.checkDoctorAvailability(doctorId, date)));
    }

    @GetMapping("/patient/{patientId}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentHistoryResponse>> getPatientAppointmentHistory(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getPatientAppointmentHistory(patientId)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<AppointmentResponse>>> searchAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) AppointmentStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.searchAppointments(doctorId, patientId, date, null, null, status, null, pageable)));
    }
}`
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / SRS Requirements Overview */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-blue-800/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-md">
                Production Clinical Architecture
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md">
                Spring Boot 3 + JPA + RFC 7807
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
              Appointment Management Module Architecture
            </h2>
            <p className="text-blue-200/90 text-sm max-w-3xl leading-relaxed">
              Enterprise scheduling engine adhering to 8 business rules: doctor double-booking prevention with HTTP 409 Conflict,
              availability scheduling, state machine lifecycle transitions (PENDING, CONFIRMED, COMPLETED, CANCELLED),
              and HIPAA patient health record isolation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
              <CheckCircle2 size={14} /> Rule 1 (409) Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
              <CheckCircle2 size={14} /> Rule 3 (Lock) Active
            </span>
          </div>
        </div>

        {/* 8 Business Rules Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-blue-800/50">
          <div className="bg-blue-950/60 p-3 rounded-lg border border-blue-800/30">
            <div className="text-xs font-bold text-amber-400">Rule 1: Slot Conflict Lock</div>
            <div className="text-xs text-blue-200/80 mt-1">Doctor cannot have 2 appointments at once. Throws HTTP 409 Conflict.</div>
          </div>
          <div className="bg-blue-950/60 p-3 rounded-lg border border-blue-800/30">
            <div className="text-xs font-bold text-cyan-400">Rule 2: Doctor Availability</div>
            <div className="text-xs text-blue-200/80 mt-1">Validates working days & operational hours. Doctor must be ACTIVE.</div>
          </div>
          <div className="bg-blue-950/60 p-3 rounded-lg border border-blue-800/30">
            <div className="text-xs font-bold text-rose-400">Rule 3: Cancelled Immutability</div>
            <div className="text-xs text-blue-200/80 mt-1">Cancelled appointments cannot become completed. Rebooking required.</div>
          </div>
          <div className="bg-blue-950/60 p-3 rounded-lg border border-blue-800/30">
            <div className="text-xs font-bold text-emerald-400">Rule 4 & 5: Role & Isolation</div>
            <div className="text-xs text-blue-200/80 mt-1">RBAC controls per operation; Patients only access their own records.</div>
          </div>
        </div>
      </div>

      {/* Conflict-Detection Algorithm Deep Dive Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold text-slate-800">
            Conflict-Detection Algorithm (SRS Rule 1 & Rule 6)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3 text-sm text-slate-600">
            <p>
              The appointment collision-prevention engine operates across three defensive layers:
              the <b>Presentation DTO validation layer</b>, the <b>Service-Layer Transactional Business Logic</b>,
              and the <b>Database Persistence Constraint layer</b>.
            </p>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2 font-mono text-xs">
              <div className="text-blue-700 font-bold">// 1. Service Layer Active Conflict Detection</div>
              <div className="text-slate-700">
                boolean hasConflict = appointmentRepository.<span className="text-indigo-600 font-semibold">existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn</span>(
                <br />&nbsp;&nbsp;&nbsp;&nbsp;doctorId, appointmentDate, appointmentTime, <span className="text-emerald-600">[PENDING, CONFIRMED]</span>
                <br />);
                <br />if (hasConflict) &#123;
                <br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-600 font-bold">throw new ConflictException("Doctor already has an active appointment..."); // HTTP 409</span>
                <br />&#125;
              </div>

              <div className="text-blue-700 font-bold mt-3">// 2. Rescheduling Exclusion Algorithm</div>
              <div className="text-slate-700">
                boolean hasConflict = appointmentRepository.<span className="text-indigo-600 font-semibold">existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndIdNot</span>(
                <br />&nbsp;&nbsp;&nbsp;&nbsp;doctorId, newDate, newTime, [PENDING, CONFIRMED], <span className="text-amber-600 font-semibold">currentAppointmentId</span>
                <br />);
              </div>
            </div>

            <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs">
              <li><b>Active State Filtering:</b> CANCELLED appointments are soft-filtered out, automatically releasing the slot for other patients.</li>
              <li><b>Rescheduling Exemption:</b> Checking with <code>id != currentAppointmentId</code> prevents self-collision when a patient modifies notes or confirms their existing slot.</li>
              <li><b>Concurrency & Race Condition Prevention:</b> Backed by MySQL composite index <code>(doctor_id, appointment_date, appointment_time)</code> for <code>O(log N)</code> index lookups.</li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Lifecycle State Machine</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200">
                  <span className="font-bold text-amber-800">PENDING</span>
                  <span className="text-slate-500">Initial booking state</span>
                </div>
                <div className="text-center text-slate-400 font-bold">&darr; Staff / Doctor Confirms</div>
                <div className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200">
                  <span className="font-bold text-blue-800">CONFIRMED</span>
                  <span className="text-slate-500">Clinical slot secured</span>
                </div>
                <div className="text-center text-slate-400 font-bold">&darr; Consultation Finished</div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-800">COMPLETED</span>
                  <span className="text-emerald-700 font-semibold">Terminal State</span>
                </div>
                <div className="text-center text-slate-400 font-bold">&darr; or Cancelled Anytime Prior</div>
                <div className="flex items-center justify-between p-2 rounded bg-rose-50 border border-rose-200">
                  <span className="font-bold text-rose-800">CANCELLED</span>
                  <span className="text-rose-700 font-semibold">Rule 3: Cannot complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive REST API Dispatcher & Simulator */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-800">
              Interactive Appointment REST API Dispatcher
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Simulates Spring Boot 3 Security & Exception Responses
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Endpoint Action</label>
              <select
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                value={apiAction}
                onChange={(e) => setApiAction(e.target.value)}
              >
                <option value="book">POST /api/appointments (Book Appointment - Rule 1 Test)</option>
                <option value="confirm">PATCH /api/appointments/{'{id}'}/confirm (Confirm)</option>
                <option value="reschedule">PUT /api/appointments/{'{id}'}/reschedule (Reschedule - Rule 6)</option>
                <option value="complete">PATCH /api/appointments/{'{id}'}/complete (Complete - Rule 3 Test)</option>
                <option value="cancel">PATCH /api/appointments/{'{id}'}/cancel (Cancel)</option>
                <option value="availability">GET /api/appointments/doctor/{'{id}'}/availability (Check Slots)</option>
                <option value="history">GET /api/appointments/patient/{'{id}'}/history (History - Rule 5)</option>
                <option value="search">GET /api/appointments (Paginated Search & Filter)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Simulated User Role Context</label>
              <select
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                value={simRole}
                onChange={(e) => setSimRole(e.target.value)}
              >
                <option value="RECEPTIONIST">ROLE_RECEPTIONIST (Staff Scheduling Access)</option>
                <option value="ADMIN">ROLE_ADMIN (Full Administrative Privileges)</option>
                <option value="DOCTOR">ROLE_DOCTOR (Physician Clinical Authority)</option>
                <option value="PATIENT">ROLE_PATIENT (Patient Portal Isolation - Own Records Only)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor ID</label>
                <select
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  value={simDoctorId}
                  onChange={(e) => setSimDoctorId(e.target.value)}
                >
                  <option value="1">Dr. Eleanor Sterling (Cardiology)</option>
                  <option value="2">Dr. Marcus Holloway (Neurology)</option>
                  <option value="3">Dr. Sarah Lin (Pediatrics)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Patient ID</label>
                <select
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  value={simPatientId}
                  onChange={(e) => setSimPatientId(e.target.value)}
                >
                  <option value="1">Johnathan Doe (PT-0001)</option>
                  <option value="2">Elena Rostova (PT-0002)</option>
                  <option value="3">Robert Chen (PT-0003)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Time Slot</label>
                <select
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono"
                  value={simTime}
                  onChange={(e) => setSimTime(e.target.value)}
                >
                  <option value="10:00:00">10:00:00 (Dr 1 Conflict Slot)</option>
                  <option value="09:00:00">09:00:00</option>
                  <option value="11:30:00">11:30:00</option>
                  <option value="14:00:00">14:00:00</option>
                  <option value="15:30:00">15:30:00</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Appointment ID</label>
              <select
                className="w-full text-sm border border-slate-300 rounded-lg p-2"
                value={simApptId}
                onChange={(e) => setSimApptId(e.target.value)}
              >
                <option value="1">#1 - Johnathan Doe (CONFIRMED)</option>
                <option value="2">#2 - Elena Rostova (PENDING)</option>
                <option value="3">#3 - Robert Chen (COMPLETED)</option>
                <option value="4">#4 - Sophia Martinez (CANCELLED - Rule 3 Test)</option>
              </select>
            </div>

            <button
              onClick={runSimulator}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Play size={16} /> Execute Endpoint Simulation
            </button>
          </div>

          {/* Response Console */}
          <div className="lg:col-span-2 bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs flex flex-col justify-between border border-slate-800 shadow-inner">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                  <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-400 ml-2 font-semibold">Spring Boot REST Response Console</span>
                </div>
                {apiResponse && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    apiResponse.status === 200 || apiResponse.status === 201 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    apiResponse.status === 409 ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    apiResponse.status === 403 ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    HTTP {apiResponse.status}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto max-h-80">
                {apiResponse ? (
                  <pre className="text-slate-200 whitespace-pre-wrap">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-500 py-12 text-center font-sans">
                    Select endpoint parameters on the left and click "Execute Endpoint Simulation" to inspect real HTTP status codes and payloads.
                  </div>
                )}
              </div>
            </div>

            {apiResponse && apiResponse.ruleEnforced && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-amber-300 font-sans text-xs">
                <AlertCircle size={14} />
                <span><b>Enforced Rule:</b> {apiResponse.ruleEnforced}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Production Source Code Explorer */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileCode className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-slate-800">
              Production Source Code Explorer
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(codeSnippets[selectedFile], selectedFile)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Copy size={13} /> Copy {selectedFile}.java
          </button>
        </div>

        {/* File tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-2">
          {[
            { id: 'service', label: 'AppointmentServiceImpl.java' },
            { id: 'controller', label: 'AppointmentController.java' },
            { id: 'repository', label: 'AppointmentRepository.java' },
            { id: 'entity', label: 'Appointment.java' },
            { id: 'statusEnum', label: 'AppointmentStatus.java' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFile(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedFile === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code container */}
        <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-800 text-xs font-mono text-slate-100 max-h-96">
          <pre>{codeSnippets[selectedFile]}</pre>
        </div>
      </div>
    </div>
  );
};

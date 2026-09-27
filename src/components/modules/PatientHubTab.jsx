import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  CheckCircle2,
  Server,
  Database,
  Shield,
  Layers,
  Search,
  UserCheck,
  UserX,
  Play,
  Key,
  ShieldAlert,
  ArrowRight,
  Filter,
  Users
} from 'lucide-react';
import Swal from 'sweetalert2';

export const PatientHubTab = () => {
  const [selectedFile, setSelectedFile] = useState('entity');
  const [apiSimulatorAction, setApiSimulatorAction] = useState('list');
  const [simulatedRole, setSimulatedRole] = useState('RECEPTIONIST');
  const [simQuery, setSimQuery] = useState('');
  const [simStatus, setSimStatus] = useState('ACTIVE');
  const [simPatientId, setSimPatientId] = useState('1');
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

  // Simulated backend API executions
  const runSimulator = () => {
    let result = {};
    const timestamp = new Date().toISOString();

    if (apiSimulatorAction === 'list') {
      if (['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'].includes(simulatedRole)) {
        result = {
          timestamp,
          status: 200,
          message: 'Patients retrieved successfully',
          data: {
            content: [
              {
                id: 1,
                patientCode: 'P-1001',
                name: 'Aarav Sharma',
                dateOfBirth: '1985-06-14',
                age: 39,
                gender: 'MALE',
                bloodGroup: 'O+',
                phone: '+91 98220 88008',
                email: 'aarav.sharma@gmail.com',
                emergencyContactName: 'Pooja Sharma',
                emergencyContactPhone: '+91 98220 88009',
                status: 'ACTIVE',
              },
              {
                id: 2,
                patientCode: 'P-1002',
                name: 'Priya Kulkarni',
                dateOfBirth: '1992-11-03',
                age: 33,
                gender: 'FEMALE',
                bloodGroup: 'A+',
                phone: '+91 98230 45678',
                email: 'priya.kulkarni@gmail.com',
                emergencyContactName: 'Aditya Kulkarni',
                emergencyContactPhone: '+91 98230 45679',
                status: 'ACTIVE',
              },
            ],
            pageNumber: 0,
            pageSize: 10,
            totalElements: 5,
            totalPages: 1,
            last: true,
          },
        };
      } else {
        result = {
          timestamp,
          status: 403,
          error: 'Forbidden',
          message: 'Access Denied: Role PATIENT cannot list hospital patient directory (SRS Rule 9).',
          path: '/api/patients',
        };
      }
    } else if (apiSimulatorAction === 'get') {
      if (simulatedRole === 'PATIENT' && simPatientId !== '1') {
        result = {
          timestamp,
          status: 403,
          error: 'Forbidden',
          message: 'SRS Rule 9 Security Violation: Authenticated patient user cannot access other patients records.',
          path: `/api/patients/${simPatientId}`,
        };
      } else {
        result = {
          timestamp,
          status: 200,
          message: 'Patient profile retrieved',
          data: {
            id: Number(simPatientId),
            patientCode: `P-100${simPatientId}`,
            name: simPatientId === '1' ? 'Aarav Sharma' : 'Priya Kulkarni',
            dateOfBirth: '1985-06-14',
            age: 39,
            gender: 'MALE',
            bloodGroup: 'O+',
            maritalStatus: 'MARRIED',
            occupation: 'Software Engineer',
            phone: '+91 98220 88008',
            email: 'aarav.sharma@gmail.com',
            emergencyContactName: 'Pooja Sharma',
            emergencyContactPhone: '+91 98220 88009',
            emergencyContactRelation: 'Spouse',
            allergies: 'Penicillin, Sulfa drugs',
            status: 'ACTIVE',
          },
        };
      }
    } else if (apiSimulatorAction === 'create') {
      if (['ADMIN', 'RECEPTIONIST'].includes(simulatedRole)) {
        result = {
          timestamp,
          status: 201,
          message: 'Patient registered successfully (HTTP 201 Created)',
          data: {
            id: 106,
            patientCode: 'P-1006',
            name: 'Rohan Patil',
            dateOfBirth: '1990-05-02',
            age: 34,
            gender: 'MALE',
            bloodGroup: 'A+',
            maritalStatus: 'MARRIED',
            occupation: 'Civil Engineer',
            phone: '+91 98231 12345',
            email: 'rohan.patil@gmail.com',
            emergencyContactName: 'Sunita Patil',
            emergencyContactPhone: '+91 98231 12346',
            emergencyContactRelation: 'Spouse',
            status: 'ACTIVE',
          },
        };
      } else {
        result = {
          timestamp,
          status: 403,
          error: 'Forbidden',
          message: `Access Denied: Role ${simulatedRole} is not authorized to register patients (Admin / Receptionist required).`,
          path: '/api/patients',
        };
      }
    } else if (apiSimulatorAction === 'history') {
      if (simulatedRole === 'PATIENT' && simPatientId !== '1') {
        result = {
          timestamp,
          status: 403,
          error: 'Forbidden',
          message: 'SRS Rule 9: You are forbidden from accessing another patient clinical history.',
          path: `/api/patients/${simPatientId}/history-summary`,
        };
      } else {
        result = {
          timestamp,
          status: 200,
          message: 'Patient clinical history summary compiled',
          data: {
            patientId: 1,
            patientCode: 'PT-0001',
            patientName: 'Johnathan Doe',
            age: 39,
            gender: 'MALE',
            bloodGroup: 'O+',
            status: 'ACTIVE',
            totalAppointments: 2,
            totalMedicalRecords: 3,
            totalPrescriptions: 2,
            totalAdmissions: 1,
            recentAppointments: [
              { id: 101, date: '2026-10-15', doctorName: 'Dr. Eleanor Sterling', department: 'Cardiology', status: 'CONFIRMED' },
            ],
            recentClinicalRecords: [
              { id: 201, visitDate: '2026-09-20', doctorName: 'Dr. Eleanor Sterling', diagnosis: 'Unstable Angina, Stage 2 Hypertension', bloodPressure: '165/105 mmHg' },
            ],
            recentPrescriptions: [
              { id: 301, date: '2026-09-20', doctorName: 'Dr. Eleanor Sterling', medicationCount: 2, status: 'ISSUED' },
            ],
          },
        };
      }
    } else if (apiSimulatorAction === 'status') {
      if (['ADMIN', 'RECEPTIONIST'].includes(simulatedRole)) {
        result = {
          timestamp,
          status: 200,
          message: `Patient status updated to ${simStatus}`,
          data: {
            id: Number(simPatientId),
            patientCode: `PT-000${simPatientId}`,
            name: 'Johnathan Doe',
            status: simStatus,
            updatedAt: timestamp,
          },
        };
      } else {
        result = {
          timestamp,
          status: 403,
          error: 'Forbidden',
          message: 'Access Denied: Only Admin or Receptionist can activate/deactivate patient records.',
          path: `/api/patients/${simPatientId}/status`,
        };
      }
    }

    setApiResponse(result);
  };

  // Code snippets mapping
  const codeFiles = {
    entity: {
      name: 'Patient.java',
      path: 'backend-springboot/src/main/java/com/hospital/management/entity/Patient.java',
      code: `package com.hospital.management.entity;

import com.hospital.management.enums.BloodGroup;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.MaritalStatus;
import com.hospital.management.enums.PatientStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "patients",
    indexes = {
        @Index(name = "idx_patient_code", columnList = "patient_code", unique = true),
        @Index(name = "idx_patient_name", columnList = "name"),
        @Index(name = "idx_patient_phone", columnList = "phone"),
        @Index(name = "idx_patient_email", columnList = "email"),
        @Index(name = "idx_patient_status", columnList = "status"),
        @Index(name = "idx_patient_blood_group", columnList = "blood_group")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_code", nullable = false, unique = true, length = 30)
    private String patientCode; // e.g. "PT-0001"

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Links patient to authenticated portal login for SRS Rule 9

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_status", length = 20)
    @Builder.Default
    private MaritalStatus maritalStatus = MaritalStatus.SINGLE;

    @Column(length = 100)
    private String occupation;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "emergency_contact_name", nullable = false, length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", nullable = false, length = 20)
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_relation", length = 50)
    private String emergencyContactRelation;

    @Column(name = "medical_history", columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PatientStatus status = PatientStatus.ACTIVE;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}`,
    },
    requestDto: {
      name: 'PatientRequest.java',
      path: 'backend-springboot/src/main/java/com/hospital/management/dto/patient/PatientRequest.java',
      code: `package com.hospital.management.dto.patient;

import com.hospital.management.enums.BloodGroup;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.MaritalStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientRequest {

    @NotBlank(message = "Patient full legal name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be a past date")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    private MaritalStatus maritalStatus;

    @Size(max = 100, message = "Occupation cannot exceed 100 characters")
    private String occupation;

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "^\\\\+?[0-9. ()-]{7,25}$",
        message = "Mobile number must be a valid phone number (7-25 digits)"
    )
    private String phone;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @NotBlank(message = "Emergency contact name is required")
    @Size(min = 2, max = 100, message = "Emergency contact name must be between 2 and 100 characters")
    private String emergencyContactName;

    @NotBlank(message = "Emergency contact phone is required")
    @Pattern(
        regexp = "^\\\\+?[0-9. ()-]{7,25}$",
        message = "Emergency contact phone must be a valid phone number"
    )
    private String emergencyContactPhone;

    @Size(max = 50, message = "Emergency contact relation cannot exceed 50 characters")
    private String emergencyContactRelation;

    private String medicalHistory;
    private String allergies;
    private Long userId;
}`,
    },
    responseDto: {
      name: 'PatientResponse.java',
      path: 'backend-springboot/src/main/java/com/hospital/management/dto/patient/PatientResponse.java',
      code: `package com.hospital.management.dto.patient;

import com.hospital.management.enums.Gender;
import com.hospital.management.enums.MaritalStatus;
import com.hospital.management.enums.PatientStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {
    private Long id;
    private String patientCode;
    private String name;
    private LocalDate dateOfBirth;
    private Integer age;
    private Gender gender;
    private String bloodGroup;
    private MaritalStatus maritalStatus;
    private String occupation;
    private String phone;
    private String email;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelation;
    private String medicalHistory;
    private String allergies;
    private PatientStatus status;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}`,
    },
    historyDto: {
      name: 'PatientHistorySummaryResponse.java',
      path: 'backend-springboot/src/main/java/com/hospital/management/dto/patient/PatientHistorySummaryResponse.java',
      code: `package com.hospital.management.dto.patient;

import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientHistorySummaryResponse {
    private Long patientId;
    private String patientCode;
    private String patientName;
    private Integer age;
    private Gender gender;
    private String bloodGroup;
    private String phone;
    private String email;
    private PatientStatus status;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String allergies;
    private String chronicConditions;

    private int totalAppointments;
    private int totalMedicalRecords;
    private int totalPrescriptions;
    private int totalAdmissions;

    private List<AppointmentSummaryItem> recentAppointments;
    private List<MedicalRecordSummaryItem> recentClinicalRecords;
    private List<PrescriptionSummaryItem> recentPrescriptions;
    private List<AdmissionSummaryItem> recentHospitalAdmissions;
}`,
    },
    repository: {
      name: 'PatientRepository.java',
      path: 'backend-springboot/src/main/java/com/hospital/management/repository/PatientRepository.java',
      code: `package com.hospital.management.repository;

import com.hospital.management.entity.Patient;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByPatientCode(String patientCode);
    Optional<Patient> findByUserId(Long userId);

    boolean existsByPatientCode(String patientCode);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("SELECT p FROM Patient p WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " p.phone LIKE CONCAT('%', :query, '%') OR " +
           " LOWER(p.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:gender IS NULL OR p.gender = :gender) AND " +
           "(:bloodGroup IS NULL OR :bloodGroup = '' OR p.bloodGroup = :bloodGroup)")
    Page<Patient> findWithFilters(
            @Param("query") String query,
            @Param("status") PatientStatus status,
            @Param("gender") Gender gender,
            @Param("bloodGroup") String bloodGroup,
            Pageable pageable
    );
}`,
    },
    service: {
      name: 'PatientServiceImpl.java',
      path: 'backend-springboot/src/main/java/com/hospital/management/service/impl/PatientServiceImpl.java',
      code: `// Key highlights of PatientServiceImpl.java
@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    @Transactional
    public PatientResponse createPatient(PatientRequest request) {
        if (patientRepository.existsByPhone(request.getPhone())) {
            throw new ConflictException("Mobile number is already registered.");
        }
        if (request.getEmail() != null && patientRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered.");
        }
        Patient patient = patientMapper.toEntity(request);
        String formattedCode = String.format("PT-%04d", patientRepository.count() + 1);
        patient.setPatientCode(formattedCode);
        patient.setStatus(PatientStatus.ACTIVE);
        return patientMapper.toResponse(patientRepository.save(patient));
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));
        verifyPatientDataAccess(patient); // SRS Rule 9 Guard
        return patientMapper.toResponse(patient);
    }

    private void verifyPatientDataAccess(Patient patient) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isPatientRole = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"));
        if (isPatientRole) {
            String currentUsername = auth.getName();
            boolean isOwner = patient.getUser() != null &&
                    currentUsername.equalsIgnoreCase(patient.getUser().getUsername());
            if (!isOwner) {
                throw new UnauthorizedActionException("SRS Rule 9: Patients can only access their own records.");
            }
        }
    }
}`,
    },
    controller: {
      name: 'PatientController.java',
      path: 'backend-springboot/src/main/java/com/hospital/management/controller/PatientController.java',
      code: `package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.patient.*;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import com.hospital.management.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> createPatient(@Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.createPatient(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Patient registered successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatient(
            @PathVariable Long id, @Valid @RequestBody PatientRequest request) {
        return ResponseEntity.ok(ApiResponse.success(patientService.updatePatient(id, request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(patientService.getPatientById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<PagedResponse<PatientResponse>>> searchPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PatientStatus status,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(patientService.searchPatients(search, status, gender, bloodGroup, PageRequest.of(page, size))));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> updateStatus(
            @PathVariable Long id, @Valid @RequestBody PatientStatusUpdateRequest request) {
        PatientResponse resp = request.getStatus() == PatientStatus.ACTIVE
                ? patientService.activatePatient(id)
                : patientService.deactivatePatient(id, request.getReason());
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @GetMapping("/{id}/history-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientHistorySummaryResponse>> getHistorySummary(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(patientService.getPatientHistorySummary(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Patient record archived"));
    }
}`,
    },
  };

  const activeFileData = codeFiles[selectedFile];

  return (
    <div className="p-3">
      {/* Top Banner */}
      <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary fs-6">Patient Module Core</span>
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                SRS Compliant & Production Grade
              </span>
            </div>
            <h4 className="fw-bold text-dark mb-1">
              Enterprise Patient Management Backend Architecture
            </h4>
            <p className="text-muted small mb-0">
              Clean multi-layered Spring Boot 3 architecture adhering strictly to separation of concerns:
              Entity, DTOs, Repository, Service, ServiceImpl, Controller, Mapper, and Security Isolation.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive REST API Simulator */}
      <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div className="d-flex align-items-center gap-2">
            <Server size={18} className="text-primary" />
            <h6 className="fw-bold text-dark mb-0">Interactive Patient REST API Simulator</h6>
          </div>
          <span className="badge bg-light text-dark font-monospace">Spring Boot Mock Dispatcher</span>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-3">
            <label className="form-label fw-semibold small text-muted">1. Authenticated User Role</label>
            <select
              className="form-select form-select-sm"
              value={simulatedRole}
              onChange={(e) => setSimulatedRole(e.target.value)}
            >
              <option value="RECEPTIONIST">RECEPTIONIST (Staff)</option>
              <option value="ADMIN">ADMIN (Full Access)</option>
              <option value="DOCTOR">DOCTOR (Clinical Staff)</option>
              <option value="NURSE">NURSE (Clinical Staff)</option>
              <option value="PATIENT">PATIENT (Protected Rule 9)</option>
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-muted">2. REST Endpoint Action</label>
            <select
              className="form-select form-select-sm"
              value={apiSimulatorAction}
              onChange={(e) => setApiSimulatorAction(e.target.value)}
            >
              <option value="list">GET /api/patients (Paged & Filtered)</option>
              <option value="get">GET /api/patients/:id (View Profile)</option>
              <option value="create">POST /api/patients (Register New Patient)</option>
              <option value="history">GET /api/patients/:id/history-summary (Clinical Aggregator)</option>
              <option value="status">PATCH /api/patients/:id/status (Activate/Deactivate)</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label fw-semibold small text-muted">3. Target Patient ID</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={simPatientId}
              onChange={(e) => setSimPatientId(e.target.value)}
              placeholder="e.g. 1 or 2"
            />
          </div>

          <div className="col-12 col-md-2 d-flex align-items-end">
            <button
              onClick={runSimulator}
              className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
            >
              <Play size={14} /> <span>Execute API</span>
            </button>
          </div>
        </div>

        {/* Simulator Results Box */}
        {apiResponse && (
          <div className="mt-3">
            <div className="d-flex align-items-center justify-content-between bg-dark text-white px-3 py-2 rounded-top small">
              <span className="font-monospace">
                HTTP Response Status: <b>{apiResponse.status}</b> {apiResponse.status === 200 || apiResponse.status === 201 ? 'OK' : 'ERROR'}
              </span>
              <span className="text-white-50">{apiResponse.timestamp}</span>
            </div>
            <pre
              className="bg-light border border-top-0 p-3 rounded-bottom small mb-0 font-monospace overflow-auto"
              style={{ maxHeight: '240px' }}
            >
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Production Java Codebase Explorer */}
      <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div className="d-flex align-items-center gap-2">
            <FileCode size={18} className="text-primary" />
            <h6 className="fw-bold text-dark mb-0">Production Source Code Explorer</h6>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => copyToClipboard(activeFileData.code, activeFileData.name)}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            >
              <Copy size={13} />
              <span>{copiedLabel === activeFileData.name ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* File Select Pills */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setSelectedFile('entity')}
            className={`btn btn-sm ${selectedFile === 'entity' ? 'btn-primary' : 'btn-light border'}`}
          >
            Patient.java (Entity)
          </button>
          <button
            onClick={() => setSelectedFile('requestDto')}
            className={`btn btn-sm ${selectedFile === 'requestDto' ? 'btn-primary' : 'btn-light border'}`}
          >
            PatientRequest.java (DTO)
          </button>
          <button
            onClick={() => setSelectedFile('responseDto')}
            className={`btn btn-sm ${selectedFile === 'responseDto' ? 'btn-primary' : 'btn-light border'}`}
          >
            PatientResponse.java (DTO)
          </button>
          <button
            onClick={() => setSelectedFile('historyDto')}
            className={`btn btn-sm ${selectedFile === 'historyDto' ? 'btn-primary' : 'btn-light border'}`}
          >
            PatientHistorySummaryResponse.java (DTO)
          </button>
          <button
            onClick={() => setSelectedFile('repository')}
            className={`btn btn-sm ${selectedFile === 'repository' ? 'btn-primary' : 'btn-light border'}`}
          >
            PatientRepository.java
          </button>
          <button
            onClick={() => setSelectedFile('service')}
            className={`btn btn-sm ${selectedFile === 'service' ? 'btn-primary' : 'btn-light border'}`}
          >
            PatientServiceImpl.java
          </button>
          <button
            onClick={() => setSelectedFile('controller')}
            className={`btn btn-sm ${selectedFile === 'controller' ? 'btn-primary' : 'btn-light border'}`}
          >
            PatientController.java
          </button>
        </div>

        {/* Code viewer */}
        <div className="position-relative">
          <div className="bg-dark text-white-50 px-3 py-2 rounded-top small d-flex justify-content-between align-items-center">
            <code>{activeFileData.path}</code>
            <span className="badge bg-secondary font-monospace">Java 17 / Spring Boot 3</span>
          </div>
          <pre
            className="bg-light border border-top-0 p-3 rounded-bottom font-monospace small mb-0 overflow-auto"
            style={{ maxHeight: '420px', lineHeight: '1.45' }}
          >
            <code>{activeFileData.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

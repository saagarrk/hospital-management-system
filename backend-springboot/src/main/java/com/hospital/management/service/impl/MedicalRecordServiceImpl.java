package com.hospital.management.service.impl;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.medicalrecord.MedicalRecordAuditDto;
import com.hospital.management.dto.medicalrecord.MedicalRecordCreateRequest;
import com.hospital.management.dto.medicalrecord.MedicalRecordResponse;
import com.hospital.management.dto.medicalrecord.MedicalRecordUpdateRequest;
import com.hospital.management.entity.Appointment;
import com.hospital.management.entity.Doctor;
import com.hospital.management.entity.MedicalRecord;
import com.hospital.management.entity.MedicalRecordAuditLog;
import com.hospital.management.entity.Patient;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.MedicalRecordMapper;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.MedicalRecordAuditLogRepository;
import com.hospital.management.repository.MedicalRecordRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Enterprise Service Implementation for Clinical Medical Record Management.
 * Enforces role-based access control, HIPAA PHI isolation, physician authorization,
 * immutable audit logging, and clinical validation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalRecordAuditLogRepository medicalRecordAuditLogRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordMapper medicalRecordMapper;
    private final com.hospital.management.service.AuditLogService centralAuditLogService;

    /**
     * Requirement: Only authorized doctors can create medical records.
     * Validates required fields and physician credentials.
     */
    @Override
    @Transactional
    public MedicalRecordResponse createRecord(MedicalRecordCreateRequest request, String authenticatedUsername, boolean isAdmin) {
        log.info("Processing medical record creation for Patient ID={} by User='{}'", request.getPatientId(), authenticatedUsername);

        // 1. Authorizing Doctor Validation
        Doctor doctor = null;
        if (request.getDoctorId() != null) {
            doctor = doctorRepository.findById(request.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + request.getDoctorId()));
        } else {
            // Infer doctor from authenticated user context
            doctor = doctorRepository.findAll().stream()
                    .filter(d -> d.getUser() != null && authenticatedUsername.equalsIgnoreCase(d.getUser().getUsername()))
                    .findFirst()
                    .orElse(null);
        }

        // Enforce: Only authorized doctors or administrative proxies can create clinical medical records
        if (doctor == null && !isAdmin) {
            log.warn("Access Denied: User '{}' is not registered as an attending physician", authenticatedUsername);
            throw new UnauthorizedActionException(
                    "SRS Rule 3 Violation: Only authorized licensed doctors have clinical authority to author medical records."
            );
        }

        // If not admin, ensure doctor user matches authenticated identity
        if (!isAdmin && doctor != null && doctor.getUser() != null &&
                !authenticatedUsername.equalsIgnoreCase(doctor.getUser().getUsername())) {
            throw new UnauthorizedActionException(
                    "SRS Rule 3 Violation: You cannot author a clinical medical record under another physician's credentials."
            );
        }

        // If admin created without specific doctor, fall back to first doctor or assigned doctor
        if (doctor == null) {
            doctor = doctorRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No doctors registered in the hospital system"));
        }

        // 2. Patient Validation
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + request.getPatientId()));

        // 3. Clinical Date & Required Fields Validation
        LocalDate visitDate = request.getVisitDate() != null ? request.getVisitDate() : LocalDate.now();
        if (request.getFollowUpDate() != null && request.getFollowUpDate().isBefore(visitDate)) {
            throw new BusinessRuleException(
                    "Clinical Validation Error: Scheduled follow-up date (" + request.getFollowUpDate() +
                            ") cannot be earlier than consultation visit date (" + visitDate + ").",
                    HttpStatus.BAD_REQUEST
            );
        }

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
        }

        // 4. Persistence
        MedicalRecord record = medicalRecordMapper.toEntity(request, patient, doctor, appointment, authenticatedUsername);
        MedicalRecord saved = medicalRecordRepository.save(record);

        // 5. Audit History Logging
        MedicalRecordAuditLog auditLog = MedicalRecordAuditLog.builder()
                .medicalRecordId(saved.getId())
                .action("RECORD_CREATED")
                .performedBy(authenticatedUsername + (doctor != null ? " (" + doctor.getName() + ")" : ""))
                .performedByRole(isAdmin ? "ROLE_ADMIN" : "ROLE_DOCTOR")
                .timestamp(LocalDateTime.now())
                .amendmentReason("Initial clinical diagnosis and treatment documentation")
                .changeSummary(String.format("Initial chart created for patient %s (%s). Primary Diagnosis: %s",
                        patient.getName(), patient.getPatientCode(), saved.getDiagnosis()))
                .build();
        medicalRecordAuditLogRepository.save(auditLog);

        centralAuditLogService.recordEvent(
                authenticatedUsername,
                isAdmin ? "ADMIN" : "DOCTOR",
                "MEDICAL_RECORD_CREATED",
                "MEDICAL_RECORD",
                saved.getId(),
                "SUCCESS",
                String.format("Created medical record for patient %s. Diagnosis: %s", patient.getName(), saved.getDiagnosis())
        );

        log.info("Medical record created successfully with ID={} for Patient={}", saved.getId(), patient.getName());
        return medicalRecordMapper.toResponse(saved, List.of(auditLog));
    }

    /**
     * Requirement: Prevent unauthorized modification.
     * Only the authoring doctor or medical administrator can amend a medical record.
     * Records history/audit information for every update.
     */
    @Override
    @Transactional
    public MedicalRecordResponse updateRecord(Long id, MedicalRecordUpdateRequest request, String authenticatedUsername, boolean isAdmin) {
        log.info("Processing medical record update for Record ID={} by User='{}'", id, authenticatedUsername);

        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with ID: " + id));

        // Enforce: Prevent unauthorized modification
        if (!isAdmin) {
            Doctor doctor = doctorRepository.findAll().stream()
                    .filter(d -> d.getUser() != null && authenticatedUsername.equalsIgnoreCase(d.getUser().getUsername()))
                    .findFirst()
                    .orElse(null);

            if (doctor == null) {
                throw new UnauthorizedActionException(
                        "Unauthorized Modification: Non-physician users cannot amend clinical medical records."
                );
            }

            boolean isAuthor = (record.getDoctor() != null && record.getDoctor().getId().equals(doctor.getId())) ||
                    (record.getCreatedBy() != null && record.getCreatedBy().equalsIgnoreCase(authenticatedUsername));

            if (!isAuthor) {
                log.warn("Access Denied: Doctor '{}' attempted to modify record authored by '{}'",
                        doctor.getName(), record.getDoctor() != null ? record.getDoctor().getName() : record.getCreatedBy());
                throw new UnauthorizedActionException(
                        "Clinical Compliance Violation: Only the authoring attending doctor (" +
                                (record.getDoctor() != null ? record.getDoctor().getName() : record.getCreatedBy()) +
                                ") or an authorized Medical Administrator can amend this clinical record."
                );
            }
        }

        // Validate follow-up date
        if (request.getFollowUpDate() != null && request.getFollowUpDate().isBefore(record.getVisitDate())) {
            throw new BusinessRuleException(
                    "Follow-up date cannot be earlier than consultation visit date (" + record.getVisitDate() + ").",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Update Entity
        medicalRecordMapper.updateEntity(record, request, authenticatedUsername);
        MedicalRecord updated = medicalRecordRepository.save(record);

        // Maintain history/audit information
        MedicalRecordAuditLog auditLog = MedicalRecordAuditLog.builder()
                .medicalRecordId(updated.getId())
                .action("RECORD_AMENDED")
                .performedBy(authenticatedUsername)
                .performedByRole(isAdmin ? "ROLE_ADMIN" : "ROLE_DOCTOR")
                .timestamp(LocalDateTime.now())
                .amendmentReason(request.getAmendmentReason())
                .changeSummary(String.format("Clinical chart amended. Reason: %s. Diagnosis: %s",
                        request.getAmendmentReason(), request.getDiagnosis()))
                .build();
        medicalRecordAuditLogRepository.save(auditLog);

        centralAuditLogService.recordEvent(
                authenticatedUsername,
                isAdmin ? "ADMIN" : "DOCTOR",
                "MEDICAL_RECORD_UPDATED",
                "MEDICAL_RECORD",
                updated.getId(),
                "SUCCESS",
                String.format("Amended medical record for patient %s. Reason: %s", updated.getPatient().getName(), request.getAmendmentReason())
        );

        List<MedicalRecordAuditLog> allLogs = medicalRecordAuditLogRepository.findByMedicalRecordIdOrderByTimestampDesc(updated.getId());
        log.info("Medical record ID={} successfully amended by User='{}'", id, authenticatedUsername);
        return medicalRecordMapper.toResponse(updated, allLogs);
    }

    /**
     * Requirement: Authorized users can view records according to their role.
     * Requirement: Patients can view only their own records.
     */
    @Override
    @Transactional(readOnly = true)
    public MedicalRecordResponse getRecordById(Long id, String authenticatedUsername, boolean isStaff) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with ID: " + id));

        // Enforce: Patients can view only their own records
        if (!isStaff) {
            verifyPatientOwnership(record.getPatient(), authenticatedUsername);
        }

        List<MedicalRecordAuditLog> auditLogs = medicalRecordAuditLogRepository.findByMedicalRecordIdOrderByTimestampDesc(record.getId());
        return medicalRecordMapper.toResponse(record, auditLogs);
    }

    /**
     * Requirement: Patients can view only their own records.
     */
    @Override
    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> getRecordsByPatient(Long patientId, String authenticatedUsername, boolean isStaff) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        if (!isStaff) {
            verifyPatientOwnership(patient, authenticatedUsername);
        }

        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByVisitDateDescCreatedAtDesc(patientId);
        return records.stream()
                .map(rec -> {
                    List<MedicalRecordAuditLog> logs = medicalRecordAuditLogRepository.findByMedicalRecordIdOrderByTimestampDesc(rec.getId());
                    return medicalRecordMapper.toResponse(rec, logs);
                })
                .collect(Collectors.toList());
    }

    /**
     * Requirement: Add pagination where appropriate.
     * Requirement: Add search/filter by patient and date.
     */
    @Override
    @Transactional(readOnly = true)
    public PagedResponse<MedicalRecordResponse> searchMedicalRecords(
            Long patientId,
            Long doctorId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable,
            String authenticatedUsername,
            boolean isStaff) {

        Long effectivePatientId = patientId;

        // If patient role, strictly isolate to their own medical records (SRS Rule 9)
        if (!isStaff) {
            Patient authenticatedPatient = patientRepository.findAll().stream()
                    .filter(p -> p.getUser() != null && authenticatedUsername.equalsIgnoreCase(p.getUser().getUsername()))
                    .findFirst()
                    .orElse(null);

            if (authenticatedPatient != null) {
                if (patientId != null && !patientId.equals(authenticatedPatient.getId())) {
                    throw new UnauthorizedActionException(
                            "SRS Rule 9 Privacy Violation: Patients are strictly restricted from searching records of other patients."
                    );
                }
                effectivePatientId = authenticatedPatient.getId();
            }
        }

        Page<MedicalRecord> page = medicalRecordRepository.searchMedicalRecords(
                effectivePatientId,
                doctorId,
                date,
                startDate,
                endDate,
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                pageable
        );

        List<MedicalRecordResponse> content = page.getContent().stream()
                .map(rec -> {
                    List<MedicalRecordAuditLog> logs = medicalRecordAuditLogRepository.findByMedicalRecordIdOrderByTimestampDesc(rec.getId());
                    return medicalRecordMapper.toResponse(rec, logs);
                })
                .collect(Collectors.toList());

        return PagedResponse.<MedicalRecordResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * Requirement: Maintain history/audit information.
     */
    @Override
    @Transactional(readOnly = true)
    public List<MedicalRecordAuditDto> getRecordAuditHistory(Long id, String authenticatedUsername, boolean isStaff) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with ID: " + id));

        if (!isStaff) {
            verifyPatientOwnership(record.getPatient(), authenticatedUsername);
        }

        return medicalRecordAuditLogRepository.findByMedicalRecordIdOrderByTimestampDesc(id).stream()
                .map(medicalRecordMapper::toAuditDto)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // PRIVATE VALIDATION & ACCESS VERIFICATION HELPERS
    // =========================================================================

    private void verifyPatientOwnership(Patient patient, String authenticatedUsername) {
        boolean isOwner = patient.getUser() != null &&
                authenticatedUsername.equalsIgnoreCase(patient.getUser().getUsername());

        if (!isOwner) {
            log.warn("Access Denied: Patient user '{}' attempted unauthorized access on patient ID: {}",
                    authenticatedUsername, patient.getId());
            throw new UnauthorizedActionException(
                    "SRS Rule 9 Security Violation: Patients are strictly restricted to accessing their own medical records."
            );
        }
    }
}

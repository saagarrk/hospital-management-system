package com.hospital.management.service;

import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.medicalrecord.MedicalRecordAuditDto;
import com.hospital.management.dto.medicalrecord.MedicalRecordCreateRequest;
import com.hospital.management.dto.medicalrecord.MedicalRecordResponse;
import com.hospital.management.dto.medicalrecord.MedicalRecordUpdateRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

/**
 * Service Contract for Clinical Medical Record (EMR) Management.
 * Enforces role-based access control, HIPAA PHI isolation, physician authorization,
 * immutable audit logging, and clinical validation.
 */
public interface MedicalRecordService {

    /**
     * Creates a new clinical medical record.
     * Enforces: Only authorized licensed doctors (or system admin) can create medical records.
     */
    MedicalRecordResponse createRecord(MedicalRecordCreateRequest request, String authenticatedUsername, boolean isAdmin);

    /**
     * Amends/Updates an existing medical record.
     * Enforces: Prevents unauthorized modification. Only authoring doctor or admin can amend.
     * Generates a permanent audit log entry with amendment explanation.
     */
    MedicalRecordResponse updateRecord(Long id, MedicalRecordUpdateRequest request, String authenticatedUsername, boolean isAdmin);

    /**
     * Retrieves a single medical record by ID.
     * Enforces: Patients can view only their own records; clinical staff have authorized access.
     */
    MedicalRecordResponse getRecordById(Long id, String authenticatedUsername, boolean isStaff);

    /**
     * Retrieves all medical records for a specific patient.
     * Enforces: Patients can view only their own records.
     */
    List<MedicalRecordResponse> getRecordsByPatient(Long patientId, String authenticatedUsername, boolean isStaff);

    /**
     * Searches and filters medical records by patient, doctor, date range, or keyword with pagination.
     */
    PagedResponse<MedicalRecordResponse> searchMedicalRecords(
            Long patientId,
            Long doctorId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable,
            String authenticatedUsername,
            boolean isStaff
    );

    /**
     * Retrieves the audit history / revision trail for a medical record.
     */
    List<MedicalRecordAuditDto> getRecordAuditHistory(Long id, String authenticatedUsername, boolean isStaff);
}

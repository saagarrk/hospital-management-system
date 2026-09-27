package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.medicalrecord.MedicalRecordAuditDto;
import com.hospital.management.dto.medicalrecord.MedicalRecordCreateRequest;
import com.hospital.management.dto.medicalrecord.MedicalRecordResponse;
import com.hospital.management.dto.medicalrecord.MedicalRecordUpdateRequest;
import com.hospital.management.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Enterprise REST Controller for Clinical Medical Record Management (EMR).
 * Adheres to RFC standards, HIPAA role-based data protection, and clinical audit logging.
 */
@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    /**
     * POST /api/medical-records : Create a clinical medical record
     * Requirement: Only authorized doctors can create medical records.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> createRecord(
            @Valid @RequestBody MedicalRecordCreateRequest request,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));

        MedicalRecordResponse response = medicalRecordService.createRecord(request, authentication.getName(), isAdmin);
        return new ResponseEntity<>(
                ApiResponse.created(response, "Medical record created successfully"),
                HttpStatus.CREATED
        );
    }

    /**
     * PUT /api/medical-records/{id} : Amend/Update an existing medical record
     * Requirement: Prevent unauthorized modification.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> updateRecord(
            @PathVariable Long id,
            @Valid @RequestBody MedicalRecordUpdateRequest request,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));

        MedicalRecordResponse response = medicalRecordService.updateRecord(id, request, authentication.getName(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(response, "Medical record amended successfully with audit logging"));
    }

    /**
     * GET /api/medical-records/{id} : Retrieve single medical record
     * Requirement: Authorized users can view records according to their role; Patients view only their own.
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getRecordById(
            @PathVariable Long id,
            Authentication authentication) {

        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> !a.getAuthority().equals("ROLE_PATIENT") && !a.getAuthority().equals("PATIENT"));

        MedicalRecordResponse response = medicalRecordService.getRecordById(id, authentication.getName(), isStaff);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/medical-records/patient/{patientId} : Retrieve records for a patient
     * Requirement: Patients can view only their own records.
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getRecordsByPatient(
            @PathVariable Long patientId,
            Authentication authentication) {

        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> !a.getAuthority().equals("ROLE_PATIENT") && !a.getAuthority().equals("PATIENT"));

        List<MedicalRecordResponse> responses = medicalRecordService.getRecordsByPatient(patientId, authentication.getName(), isStaff);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * GET /api/medical-records : Search and filter medical records with pagination
     * Requirement: Add search/filter by patient and date; Add pagination where appropriate.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PagedResponse<MedicalRecordResponse>>> searchMedicalRecords(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "visitDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            Authentication authentication) {

        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> !a.getAuthority().equals("ROLE_PATIENT") && !a.getAuthority().equals("PATIENT"));

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<MedicalRecordResponse> response = medicalRecordService.searchMedicalRecords(
                patientId, doctorId, date, startDate, endDate, search, pageable, authentication.getName(), isStaff
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/medical-records/{id}/audit : Retrieve audit history trail
     * Requirement: Maintain history/audit information.
     */
    @GetMapping("/{id}/audit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MedicalRecordAuditDto>>> getRecordAuditHistory(
            @PathVariable Long id,
            Authentication authentication) {

        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> !a.getAuthority().equals("ROLE_PATIENT") && !a.getAuthority().equals("PATIENT"));

        List<MedicalRecordAuditDto> auditLogs = medicalRecordService.getRecordAuditHistory(id, authentication.getName(), isStaff);
        return ResponseEntity.ok(ApiResponse.success(auditLogs));
    }
}

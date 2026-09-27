package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.patient.PatientHistorySummaryResponse;
import com.hospital.management.dto.patient.PatientRequest;
import com.hospital.management.dto.patient.PatientResponse;
import com.hospital.management.dto.patient.PatientStatusUpdateRequest;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.PatientStatus;
import com.hospital.management.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    /**
     * Register a new patient (EMR intake).
     * Accessible by ADMIN and RECEPTIONIST.
     * HTTP 201 Created.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> createPatient(@Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.createPatient(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Patient registered successfully"), HttpStatus.CREATED);
    }

    /**
     * Update an existing patient's demographic or clinical profile.
     * Accessible by ADMIN, RECEPTIONIST, and DOCTOR.
     * HTTP 200 OK.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.updatePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Patient demographics updated successfully"));
    }

    /**
     * View detailed patient profile by database ID.
     * Accessible by clinical staff (ADMIN, RECEPTIONIST, DOCTOR, NURSE) and the PATIENT themselves (SRS Rule 9).
     * HTTP 200 OK.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientById(@PathVariable Long id) {
        PatientResponse response = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * View patient profile by unique MRN / patient code (e.g. PT-0001).
     * Accessible by clinical staff.
     * HTTP 200 OK.
     */
    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientByCode(@PathVariable String code) {
        PatientResponse response = patientService.getPatientByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Search and list patients with pagination, sorting, and dynamic multi-criteria filtering.
     * Supports search by MRN, name, phone, or email.
     * Supports filtering by status, biological gender, and blood group.
     * HTTP 200 OK.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<PagedResponse<PatientResponse>>> searchPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PatientStatus status,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<PatientResponse> response = patientService.searchPatients(search, status, gender, bloodGroup, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Activate or Deactivate patient record.
     * Accessible by ADMIN and RECEPTIONIST.
     * HTTP 200 OK.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatientStatus(
            @PathVariable Long id,
            @Valid @RequestBody PatientStatusUpdateRequest request) {

        PatientResponse response;
        if (request.getStatus() == PatientStatus.ACTIVE) {
            response = patientService.activatePatient(id);
        } else {
            response = patientService.deactivatePatient(id, request.getReason());
        }
        return ResponseEntity.ok(ApiResponse.success(response, "Patient status updated to " + request.getStatus()));
    }

    /**
     * View comprehensive Patient Clinical History Summary.
     * Aggregates appointments, medical records, diagnoses, vital trends, prescriptions, and inpatient stays.
     * Accessible by ADMIN, DOCTOR, NURSE, and PATIENT (own record only).
     * HTTP 200 OK.
     */
    @GetMapping("/{id}/history-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientHistorySummaryResponse>> getPatientHistorySummary(@PathVariable Long id) {
        PatientHistorySummaryResponse summary = patientService.getPatientHistorySummary(id);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * Archive (soft-delete) patient record for audit compliance.
     * Accessible by ADMIN only.
     * HTTP 200 OK.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Patient record archived successfully"));
    }
}

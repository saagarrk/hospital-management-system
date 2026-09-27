package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.laboratory.*;
import com.hospital.management.enums.LabTestCategory;
import com.hospital.management.enums.LabTestStatus;
import com.hospital.management.service.LaboratoryService;
import com.hospital.management.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab")
@RequiredArgsConstructor
public class LaboratoryController {

    private final LaboratoryService laboratoryService;

    // =========================================================================
    // 1. REQUISITION & ORDERING
    // =========================================================================

    /**
     * Create a new laboratory test requisition.
     * Enforces Staff Authorization: Doctor, Nurse, Admin.
     */
    @PostMapping("/tests")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> orderTest(@Valid @RequestBody LabTestOrderRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("doctor");
        LabTestResponse response = laboratoryService.createTestRequest(request, username);
        return new ResponseEntity<>(ApiResponse.created(response, "Laboratory test requisition created successfully."), HttpStatus.CREATED);
    }

    // =========================================================================
    // 2. WORKFLOW LIFECYCLE TRANSITIONS
    // =========================================================================

    /**
     * Assign laboratory technician to test order.
     */
    @PatchMapping("/tests/{id}/assign")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<LabTestResponse>> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody LabTechnicianAssignRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("staff");
        LabTestResponse response = laboratoryService.assignTechnician(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Technician assigned to test successfully."));
    }

    /**
     * Collect patient specimen sample.
     */
    @PatchMapping("/tests/{id}/sample")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> collectSample(
            @PathVariable Long id,
            @Valid @RequestBody SampleCollectionRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("phlebotomist");
        LabTestResponse response = laboratoryService.collectSample(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Specimen collected and barcoded successfully."));
    }

    /**
     * Mark test as under active analysis / processing in laboratory.
     */
    @PatchMapping("/tests/{id}/start-processing")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> startProcessing(@PathVariable Long id) {
        String technician = SecurityUtils.getCurrentUsername().orElse("labtech");
        LabTestResponse response = laboratoryService.startProcessing(id, technician);
        return ResponseEntity.ok(ApiResponse.success(response, "Test specimen placed into analyzer processing."));
    }

    /**
     * Record diagnostic findings and telemetry.
     * Enforces SRS Rule 6: Only Laboratory Technicians can enter/update results.
     */
    @PostMapping("/tests/{id}/results")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> recordResult(
            @PathVariable Long id,
            @Valid @RequestBody LabTestResultRequest request) {
        String technician = SecurityUtils.getCurrentUsername().orElse("labtech");
        LabTestResponse response = laboratoryService.recordTestResult(id, request, technician);
        return ResponseEntity.ok(ApiResponse.success(response, "Diagnostic test findings recorded successfully."));
    }

    /**
     * Generate formal, finalized clinical lab report.
     */
    @PostMapping("/tests/{id}/generate-report")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<LabReportResponse>> generateReport(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String technician = SecurityUtils.getCurrentUsername().orElse("labtech");
        String verifiedByDoctor = body != null ? body.get("verifiedByDoctor") : "Chief Clinical Pathologist";
        LabReportResponse response = laboratoryService.generateLabReport(id, verifiedByDoctor, technician);
        return ResponseEntity.ok(ApiResponse.success(response, "Final diagnostic laboratory report generated and signed."));
    }

    /**
     * Cancel an ongoing test order.
     */
    @PatchMapping("/tests/{id}/cancel")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> cancelTest(
            @PathVariable Long id,
            @Valid @RequestBody LabTestCancelRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("staff");
        LabTestResponse response = laboratoryService.cancelTest(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Laboratory test has been cancelled."));
    }

    // =========================================================================
    // 3. QUERIES & PATIENT ACCESS (SRS Rule 9: PHI Isolation)
    // =========================================================================

    /**
     * Retrieve single test details.
     */
    @GetMapping("/tests/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'NURSE', 'PATIENT')")
    public ResponseEntity<ApiResponse<LabTestResponse>> getTestById(@PathVariable Long id) {
        String currentUsername = SecurityUtils.getCurrentUsername().orElse("");
        LabTestResponse response = laboratoryService.getTestById(id, currentUsername);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * List all tests with optional search, status, category, and patient filter.
     */
    @GetMapping("/tests")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'NURSE')")
    public ResponseEntity<ApiResponse<PagedResponse<LabTestResponse>>> getFilteredTests(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) LabTestStatus status,
            @RequestParam(required = false) LabTestCategory category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "orderedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<LabTestResponse> response = laboratoryService.getFilteredTests(patientId, status, category, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieve tests for a specific patient.
     * Enforces SRS Rule 9: Patients can only access their own records.
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'NURSE', 'PATIENT')")
    public ResponseEntity<ApiResponse<List<LabTestResponse>>> getTestsByPatient(@PathVariable Long patientId) {
        String currentUsername = SecurityUtils.getCurrentUsername().orElse("");
        List<LabTestResponse> responses = laboratoryService.getTestsByPatient(patientId, currentUsername);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Retrieve generated reports for a specific patient.
     * Enforces SRS Rule 9: Patients can view only their own reports.
     */
    @GetMapping("/patient/{patientId}/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'NURSE', 'PATIENT')")
    public ResponseEntity<ApiResponse<List<LabReportResponse>>> getReportsByPatient(@PathVariable Long patientId) {
        String currentUsername = SecurityUtils.getCurrentUsername().orElse("");
        List<LabReportResponse> responses = laboratoryService.getReportsByPatient(patientId, currentUsername);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Retrieve specific report by report ID.
     */
    @GetMapping("/reports/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'NURSE', 'PATIENT')")
    public ResponseEntity<ApiResponse<LabReportResponse>> getReportById(@PathVariable Long id) {
        String currentUsername = SecurityUtils.getCurrentUsername().orElse("");
        LabReportResponse response = laboratoryService.getReportById(id, currentUsername);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Worklist of orders waiting for technician action (ORDERED, ASSIGNED, SAMPLE_COLLECTED, PROCESSING).
     */
    @GetMapping("/worklist")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<LabTestResponse>>> getWorklist(
            @RequestParam(required = false) LabTestStatus status) {
        List<LabTestResponse> responses = laboratoryService.getPendingWorklist(status);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}

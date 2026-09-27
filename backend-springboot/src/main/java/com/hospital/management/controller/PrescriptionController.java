package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.dto.prescription.PrescriptionPrintDTO;
import com.hospital.management.dto.prescription.PrescriptionRequest;
import com.hospital.management.dto.prescription.PrescriptionResponse;
import com.hospital.management.service.PrescriptionService;
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
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    /**
     * Issue a new Prescription with multiple items.
     * Enforces SRS Rule 4: Doctor Prescriptive Authority.
     * Executes in an atomic transaction.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> createPrescription(@Valid @RequestBody PrescriptionRequest request) {
        String doctorUsername = SecurityUtils.getCurrentUsername().orElse("doctor");
        PrescriptionResponse response = prescriptionService.createPrescription(request, doctorUsername);
        return new ResponseEntity<>(ApiResponse.created(response, "Prescription successfully authored and issued."), HttpStatus.CREATED);
    }

    /**
     * Retrieve single prescription details.
     * Enforces SRS Rule 9: Patients can only access their own prescriptions.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getPrescriptionById(@PathVariable Long id) {
        String currentUsername = SecurityUtils.getCurrentUsername().orElse("");
        PrescriptionResponse response = prescriptionService.getPrescriptionById(id, currentUsername);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieve all prescriptions for a specific patient.
     * Enforces SRS Rule 9: Patients can only retrieve their own prescription list.
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getPrescriptionsByPatient(@PathVariable Long patientId) {
        String currentUsername = SecurityUtils.getCurrentUsername().orElse("");
        List<PrescriptionResponse> responses = prescriptionService.getPrescriptionsByPatient(patientId, currentUsername);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Paginated and filtered prescription search.
     * Pharmacists can filter by status="ISSUED" to review pending orders.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'PHARMACIST', 'ADMIN', 'NURSE')")
    public ResponseEntity<ApiResponse<PagedResponse<PrescriptionResponse>>> getAllPrescriptions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "prescriptionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<PrescriptionResponse> response = prescriptionService.getAllPrescriptions(pageable, status, patientId, doctorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Dispense medications for an issued prescription.
     * Enforces Pharmacy Operations: Decrements inventory stock and marks prescription as DISPENSED.
     */
    @PatchMapping("/{id}/dispense")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> dispensePrescription(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String pharmacistUsername = SecurityUtils.getCurrentUsername().orElse("pharmacist");
        String dispensingNotes = body != null ? body.get("notes") : null;
        PrescriptionResponse response = prescriptionService.dispensePrescription(id, pharmacistUsername, dispensingNotes);
        return ResponseEntity.ok(ApiResponse.success(response, "Prescription successfully dispensed and inventory updated."));
    }

    /**
     * Cancel an issued prescription before dispensation.
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> cancelPrescription(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String doctorUsername = SecurityUtils.getCurrentUsername().orElse("doctor");
        String reason = body != null ? body.get("reason") : "Cancelled by physician";
        PrescriptionResponse response = prescriptionService.cancelPrescription(id, reason, doctorUsername);
        return ResponseEntity.ok(ApiResponse.success(response, "Prescription has been cancelled."));
    }

    /**
     * Print / Download-friendly clinical prescription slip.
     */
    @GetMapping("/{id}/print")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionPrintDTO>> getPrintablePrescription(@PathVariable Long id) {
        String currentUsername = SecurityUtils.getCurrentUsername().orElse("");
        PrescriptionPrintDTO printDTO = prescriptionService.getPrintablePrescription(id, currentUsername);
        return ResponseEntity.ok(ApiResponse.success(printDTO));
    }
}

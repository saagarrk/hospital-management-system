package com.hospital.management.controller;

import com.hospital.management.dto.admission.*;
import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.service.InpatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@Tag(name = "Admissions & Inpatient", description = "IPD bed allocation, room telemetry, ward transfers, and clinical discharge summaries")
@RestController
@RequestMapping("/api/inpatient")
@RequiredArgsConstructor
public class InpatientController {

    private final InpatientService inpatientService;

    // =========================================================================
    // ROOM ENDPOINTS
    // =========================================================================

    @Operation(summary = "Create inpatient room", description = "Creates a hospital ward room with room type, daily rate, and capacity.")
    @PostMapping("/rooms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(@Valid @RequestBody RoomRequest request) {
        RoomResponse response = inpatientService.createRoom(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Room created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/rooms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
        RoomResponse response = inpatientService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Room updated successfully"));
    }

    @DeleteMapping("/rooms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        inpatientService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Room deleted successfully"));
    }

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getAllRooms() {
        List<RoomResponse> responses = inpatientService.getAllRooms();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomById(@PathVariable Long id) {
        RoomResponse response = inpatientService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // BED ENDPOINTS
    // =========================================================================

    @PostMapping("/beds")
    @PreAuthorize("hasAnyRole('ADMIN', 'NURSE')")
    public ResponseEntity<ApiResponse<BedResponse>> createBed(@Valid @RequestBody BedRequest request) {
        BedResponse response = inpatientService.createBed(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Bed created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/beds/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'NURSE')")
    public ResponseEntity<ApiResponse<BedResponse>> updateBed(@PathVariable Long id, @Valid @RequestBody BedRequest request) {
        BedResponse response = inpatientService.updateBed(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Bed updated successfully"));
    }

    @PatchMapping("/beds/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'NURSE', 'DOCTOR')")
    public ResponseEntity<ApiResponse<BedResponse>> updateBedStatus(
            @PathVariable Long id,
            @Valid @RequestBody BedStatusUpdateRequest request) {
        BedResponse response = inpatientService.updateBedStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Bed status updated successfully"));
    }

    @DeleteMapping("/beds/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBed(@PathVariable Long id) {
        inpatientService.deleteBed(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Bed deleted successfully"));
    }

    @GetMapping("/beds")
    public ResponseEntity<ApiResponse<List<BedResponse>>> getAllBeds(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) String status) {
        List<BedResponse> responses = inpatientService.getAllBeds(roomId, status);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/beds/{id}")
    public ResponseEntity<ApiResponse<BedResponse>> getBedById(@PathVariable Long id) {
        BedResponse response = inpatientService.getBedById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // ADMISSION & PATIENT MANAGEMENT
    // =========================================================================

    @PostMapping("/admit")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AdmissionResponse>> admitPatient(@Valid @RequestBody AdmissionRequest request) {
        AdmissionResponse response = inpatientService.admitPatient(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Patient admitted and bed assigned successfully"), HttpStatus.CREATED);
    }

    @PostMapping("/admissions/{id}/reassign-doctor")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AdmissionResponse>> reassignDoctor(
            @PathVariable Long id,
            @Valid @RequestBody DoctorReassignmentRequest request) {
        AdmissionResponse response = inpatientService.reassignDoctor(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Attending doctor reassigned successfully"));
    }

    // =========================================================================
    // BED TRANSFER & AUDIT TRAIL
    // =========================================================================

    @PostMapping("/admissions/{id}/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'NURSE', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AdmissionResponse>> transferBed(
            @PathVariable Long id,
            @Valid @RequestBody BedTransferRequest request,
            Principal principal) {
        String staff = principal != null ? principal.getName() : "Clinical Staff";
        AdmissionResponse response = inpatientService.transferBed(id, request.getNewBedId(), request.getReason(), staff);
        return ResponseEntity.ok(ApiResponse.success(response, "Ward transfer executed atomically"));
    }

    @GetMapping("/admissions/{id}/transfers")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<List<BedTransferHistoryResponse>>> getTransferHistory(@PathVariable Long id) {
        List<BedTransferHistoryResponse> responses = inpatientService.getTransferHistory(id);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    // =========================================================================
    // DISCHARGE PREPARATION & CLEARANCE
    // =========================================================================

    @GetMapping("/admissions/{id}/prepare-discharge")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<DischargePreparationResponse>> prepareDischarge(@PathVariable Long id) {
        DischargePreparationResponse response = inpatientService.prepareDischarge(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Discharge checklist and financial review generated"));
    }

    @PostMapping("/admissions/{id}/discharge")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<DischargeSummaryResponse>> dischargePatient(
            @PathVariable Long id,
            @Valid @RequestBody DischargeRequest request) {
        DischargeSummaryResponse response = inpatientService.dischargePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Patient successfully discharged and bed released to AVAILABLE"));
    }

    @GetMapping("/admissions/{id}")
    public ResponseEntity<ApiResponse<AdmissionResponse>> getAdmissionById(@PathVariable Long id) {
        AdmissionResponse response = inpatientService.getAdmissionById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/admissions/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<AdmissionResponse>>> getActiveAdmissions() {
        List<AdmissionResponse> responses = inpatientService.getActiveAdmissions();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/admissions")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<PagedResponse<AdmissionResponse>>> getAllAdmissions(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "admissionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<AdmissionResponse> response = inpatientService.getAllAdmissions(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

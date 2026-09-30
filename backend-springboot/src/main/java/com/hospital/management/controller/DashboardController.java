package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.dashboard.*;
import com.hospital.management.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Dashboard & Analytics", description = "Role-tailored clinical aggregations, occupancy metrics, revenue indicators, and queue telemetry")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Get admin dashboard metrics", description = "Aggregates hospital-wide occupancy, OPD appointments, revenue totals, and staff counts.")
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        AdminDashboardResponse data = dashboardService.getAdminDashboard();
        return ResponseEntity.ok(ApiResponse.success(data, "Admin aggregation dashboard loaded successfully"));
    }

    @Operation(summary = "Get doctor clinical dashboard", description = "Summarizes today's appointments, pending consultations, and active patient records.")
    @GetMapping("/doctor")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorDashboardResponse>> getDoctorDashboard(
            @RequestParam(required = false) Long doctorId) {
        DoctorDashboardResponse data = dashboardService.getDoctorDashboard(doctorId);
        return ResponseEntity.ok(ApiResponse.success(data, "Doctor clinical dashboard loaded successfully"));
    }

    @Operation(summary = "Get doctor clinical dashboard by ID", description = "Retrieves doctor dashboard metrics for specified doctor ID.")
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorDashboardResponse>> getDoctorDashboardById(
            @PathVariable Long doctorId) {
        DoctorDashboardResponse data = dashboardService.getDoctorDashboard(doctorId);
        return ResponseEntity.ok(ApiResponse.success(data, "Doctor clinical dashboard loaded successfully"));
    }

    @Operation(summary = "Get receptionist dashboard", description = "Real-time bed occupancy, OPD queue, and daily intake statistics.")
    @GetMapping("/receptionist")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReceptionistDashboardResponse>> getReceptionistDashboard() {
        ReceptionistDashboardResponse data = dashboardService.getReceptionistDashboard();
        return ResponseEntity.ok(ApiResponse.success(data, "Receptionist intake dashboard loaded successfully"));
    }

    @Operation(summary = "Get pharmacist dashboard", description = "Low stock counters, expiring batches, and pending prescription orders.")
    @GetMapping("/pharmacist")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PharmacistDashboardResponse>> getPharmacistDashboard() {
        PharmacistDashboardResponse data = dashboardService.getPharmacistDashboard();
        return ResponseEntity.ok(ApiResponse.success(data, "Pharmacy dispensing dashboard loaded successfully"));
    }

    @Operation(summary = "Get lab technician dashboard", description = "Pending pathology samples, completed reports, and test turnaround queues.")
    @GetMapping("/lab-technician")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ApiResponse<LabTechnicianDashboardResponse>> getLabTechnicianDashboard() {
        LabTechnicianDashboardResponse data = dashboardService.getLabTechnicianDashboard();
        return ResponseEntity.ok(ApiResponse.success(data, "Laboratory diagnostic dashboard loaded successfully"));
    }

    @Operation(summary = "Get patient portal dashboard", description = "Patient's upcoming consultations, unread lab reports, and outstanding bills.")
    @GetMapping("/patient")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDashboardResponse>> getPatientDashboard(
            @RequestParam(required = false) Long patientId) {
        PatientDashboardResponse data = dashboardService.getPatientDashboard(patientId);
        return ResponseEntity.ok(ApiResponse.success(data, "Patient portal dashboard loaded successfully"));
    }

    @Operation(summary = "Get patient portal dashboard by patient ID", description = "Retrieves dashboard telemetry for specified patient ID.")
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDashboardResponse>> getPatientDashboardById(
            @PathVariable Long patientId) {
        PatientDashboardResponse data = dashboardService.getPatientDashboard(patientId);
        return ResponseEntity.ok(ApiResponse.success(data, "Patient portal dashboard loaded successfully"));
    }
}

package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.dashboard.*;
import com.hospital.management.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        AdminDashboardResponse data = dashboardService.getAdminDashboard();
        return ResponseEntity.ok(ApiResponse.success(data, "Admin aggregation dashboard loaded successfully"));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorDashboardResponse>> getDoctorDashboard(
            @RequestParam(required = false) Long doctorId) {
        DoctorDashboardResponse data = dashboardService.getDoctorDashboard(doctorId);
        return ResponseEntity.ok(ApiResponse.success(data, "Doctor clinical dashboard loaded successfully"));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorDashboardResponse>> getDoctorDashboardById(
            @PathVariable Long doctorId) {
        DoctorDashboardResponse data = dashboardService.getDoctorDashboard(doctorId);
        return ResponseEntity.ok(ApiResponse.success(data, "Doctor clinical dashboard loaded successfully"));
    }

    @GetMapping("/receptionist")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReceptionistDashboardResponse>> getReceptionistDashboard() {
        ReceptionistDashboardResponse data = dashboardService.getReceptionistDashboard();
        return ResponseEntity.ok(ApiResponse.success(data, "Receptionist intake dashboard loaded successfully"));
    }

    @GetMapping("/pharmacist")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PharmacistDashboardResponse>> getPharmacistDashboard() {
        PharmacistDashboardResponse data = dashboardService.getPharmacistDashboard();
        return ResponseEntity.ok(ApiResponse.success(data, "Pharmacy dispensing dashboard loaded successfully"));
    }

    @GetMapping("/lab-technician")
    @PreAuthorize("hasAnyRole('LAB_TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ApiResponse<LabTechnicianDashboardResponse>> getLabTechnicianDashboard() {
        LabTechnicianDashboardResponse data = dashboardService.getLabTechnicianDashboard();
        return ResponseEntity.ok(ApiResponse.success(data, "Laboratory diagnostic dashboard loaded successfully"));
    }

    @GetMapping("/patient")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDashboardResponse>> getPatientDashboard(
            @RequestParam(required = false) Long patientId) {
        PatientDashboardResponse data = dashboardService.getPatientDashboard(patientId);
        return ResponseEntity.ok(ApiResponse.success(data, "Patient portal dashboard loaded successfully"));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDashboardResponse>> getPatientDashboardById(
            @PathVariable Long patientId) {
        PatientDashboardResponse data = dashboardService.getPatientDashboard(patientId);
        return ResponseEntity.ok(ApiResponse.success(data, "Patient portal dashboard loaded successfully"));
    }
}

package com.hospital.management.controller;

import com.hospital.management.dto.appointment.*;
import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.enums.AppointmentStatus;
import com.hospital.management.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Enterprise REST Controller for Clinical Appointment Management.
 * Exposes clean RESTful endpoints adhering to RFC standards, appropriate HTTP status codes,
 * and Spring Security role-based access control.
 */
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * POST /api/appointments : Book a new appointment
     * Returns HTTP 201 Created on success, HTTP 409 Conflict if slot is occupied.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @Valid @RequestBody AppointmentBookingRequest request) {
        AppointmentResponse response = appointmentService.bookAppointment(request);
        return new ResponseEntity<>(
                ApiResponse.created(response, "Appointment successfully booked with status PENDING"),
                HttpStatus.CREATED
        );
    }

    /**
     * PATCH /api/appointments/{id}/confirm : Confirm a pending appointment
     * Restricted to clinical staff/doctors/admin.
     */
    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> confirmAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String notes) {
        AppointmentResponse response = appointmentService.confirmAppointment(id, notes);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment successfully confirmed"));
    }

    /**
     * PUT /api/appointments/{id}/reschedule : Reschedule an existing appointment
     * Validates conflicts (HTTP 409) and doctor schedule.
     */
    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRescheduleRequest request) {
        AppointmentResponse response = appointmentService.rescheduleAppointment(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment rescheduled successfully"));
    }

    /**
     * PATCH /api/appointments/{id}/cancel : Cancel an appointment
     * Terminal state transition.
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        AppointmentResponse response = appointmentService.cancelAppointment(id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment cancelled successfully"));
    }

    /**
     * PATCH /api/appointments/{id}/complete : Complete an appointment
     * Enforces Rule 3: Cancelled appointments cannot become completed.
     * Restricted to attending doctors or clinical staff.
     */
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> completeAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String notes) {
        AppointmentResponse response = appointmentService.completeAppointment(id, notes);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment marked as completed"));
    }

    /**
     * GET /api/appointments/doctor/{doctorId}/availability : Check doctor slot availability
     */
    @GetMapping("/doctor/{doctorId}/availability")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DoctorAvailabilityResponse>> checkDoctorAvailability(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DoctorAvailabilityResponse response = appointmentService.checkDoctorAvailability(doctorId, date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/appointments/patient/{patientId}/history : Appointment history for patient
     * Protected by patient record isolation.
     */
    @GetMapping("/patient/{patientId}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentHistoryResponse>> getPatientAppointmentHistory(
            @PathVariable Long patientId) {
        AppointmentHistoryResponse response = appointmentService.getPatientAppointmentHistory(patientId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/appointments/patient/{patientId} : List of appointments for patient
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAppointmentsByPatient(
            @PathVariable Long patientId) {
        List<AppointmentResponse> responses = appointmentService.getAppointmentsByPatient(patientId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * GET /api/appointments/{id} : View single appointment
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(@PathVariable Long id) {
        AppointmentResponse response = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/appointments : Search and filter appointments with pagination
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<AppointmentResponse>>> searchAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<AppointmentResponse> response = appointmentService.searchAppointments(
                doctorId, patientId, date, startDate, endDate, status, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

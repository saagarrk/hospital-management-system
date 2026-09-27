package com.hospital.management.service;

import com.hospital.management.dto.appointment.*;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.enums.AppointmentStatus;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

/**
 * Service Contract for Clinical Appointment Management.
 * Enforces business logic, RBAC security, state machine transitions, and slot conflict checks.
 */
public interface AppointmentService {

    /**
     * Books a new clinical appointment.
     * Enforces: Doctor availability, active status, slot conflicts (HTTP 409), patient isolation.
     */
    AppointmentResponse bookAppointment(AppointmentBookingRequest request);

    /**
     * Confirms an existing pending appointment.
     * Transition: PENDING -> CONFIRMED.
     * Role restriction: Clinical staff/Admin/Doctor only.
     */
    AppointmentResponse confirmAppointment(Long appointmentId, String notes);

    /**
     * Reschedules an appointment to a new date and time.
     * Enforces: Conflict detection (HTTP 409), Doctor working schedule, Status validation.
     */
    AppointmentResponse rescheduleAppointment(Long appointmentId, AppointmentRescheduleRequest request);

    /**
     * Cancels an appointment.
     * Enforces: Patient ownership or clinical staff role. Terminal state transition.
     */
    AppointmentResponse cancelAppointment(Long appointmentId, String cancellationReason);

    /**
     * Marks an appointment as completed following consultation.
     * Enforces Rule 3: Cancelled appointments cannot become completed.
     * Role restriction: Doctor or clinical staff only.
     */
    AppointmentResponse completeAppointment(Long appointmentId, String clinicalNotes);

    /**
     * Checks a doctor's availability schedule and calculates occupied vs free time slots for a given date.
     */
    DoctorAvailabilityResponse checkDoctorAvailability(Long doctorId, LocalDate date);

    /**
     * Retrieves aggregated appointment history for a patient.
     * Enforces Rule 5: Patients can only view their own history.
     */
    AppointmentHistoryResponse getPatientAppointmentHistory(Long patientId);

    /**
     * Retrieves a single appointment by ID with role-based access verification.
     */
    AppointmentResponse getAppointmentById(Long id);

    /**
     * Retrieves list of appointments by patient ID.
     */
    List<AppointmentResponse> getAppointmentsByPatient(Long patientId);

    /**
     * Searches and filters appointments with dynamic criteria, sorting, and pagination.
     */
    PagedResponse<AppointmentResponse> searchAppointments(
            Long doctorId,
            Long patientId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            AppointmentStatus status,
            String search,
            Pageable pageable
    );
}

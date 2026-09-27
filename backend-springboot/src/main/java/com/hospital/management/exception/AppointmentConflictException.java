package com.hospital.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Exception thrown when an appointment booking or reschedule violates scheduling concurrency rules
 * (e.g. physician or patient double-booking for the requested date and time slot).
 * Enforces SRS Rule 1 & Rule 2.
 * Maps to HTTP 409 Conflict.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class AppointmentConflictException extends ConflictException {

    public AppointmentConflictException(String message) {
        super(message);
    }

    public AppointmentConflictException(Long doctorId, LocalDate date, LocalTime time) {
        super(String.format("Appointment conflict: Doctor ID %d is already booked for date %s at %s. Please select another time slot.",
                doctorId, date, time));
    }

    public AppointmentConflictException(String doctorName, LocalDate date, String time) {
        super(String.format("Appointment conflict: %s is already scheduled for an appointment on %s at %s. Please select an available slot.",
                doctorName, date, time));
    }

    public AppointmentConflictException(String patientName, LocalDate date, LocalTime time, boolean isPatient) {
        super(String.format("Appointment conflict: Patient '%s' already has an active appointment on %s at %s.",
                patientName, date, time));
    }
}

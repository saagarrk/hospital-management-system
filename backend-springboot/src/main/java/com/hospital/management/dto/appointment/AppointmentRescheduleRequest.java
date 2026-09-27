package com.hospital.management.dto.appointment;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for rescheduling an existing appointment.
 * Validates new proposed date/time slot and optional reason.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRescheduleRequest {

    @NotNull(message = "New appointment date is required")
    @FutureOrPresent(message = "New date must be today or in the future")
    private LocalDate newDate;

    @NotNull(message = "New appointment time is required")
    private LocalTime newTime;

    @Size(max = 255, message = "Reason for rescheduling cannot exceed 255 characters")
    private String rescheduleReason;

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;
}

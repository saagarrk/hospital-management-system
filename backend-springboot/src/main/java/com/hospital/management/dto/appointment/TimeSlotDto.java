package com.hospital.management.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * Representation of a specific consultation time slot in doctor availability checks.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotDto {
    private LocalTime slotTime;
    private String formattedTime;
    private boolean available;
    private String statusMessage; // "Available", "Booked (Active Appointment)", "Past Slot", "Out of Hours"
    private Long existingAppointmentId;
}

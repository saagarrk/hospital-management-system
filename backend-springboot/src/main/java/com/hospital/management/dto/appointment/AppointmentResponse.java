package com.hospital.management.dto.appointment;

import com.hospital.management.enums.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Standard enterprise response representation for an Appointment.
 * Safe presentation layer object: NEVER exposes JPA Entity directly.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private String patientPhone;
    private String patientEmail;

    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String departmentName;
    private BigDecimal consultationFee;
    private String roomNumber;

    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private AppointmentStatus status;
    private String reason;
    private String notes;
    private String cancellationReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

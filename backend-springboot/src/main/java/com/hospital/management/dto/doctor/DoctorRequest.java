package com.hospital.management.dto.doctor;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorRequest {

    @NotBlank(message = "Doctor name is required")
    private String name;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    private String qualification;

    @NotBlank(message = "Contact phone is required")
    private String phone;

    private String email;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Consultation fee must be greater than zero")
    private BigDecimal consultationFee;

    @NotBlank(message = "Available days are required (e.g. MONDAY,TUESDAY,WEDNESDAY)")
    private String availableDays;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private Long userId;
}

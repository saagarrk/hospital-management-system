package com.hospital.management.dto.medicalrecord;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for amending/updating an existing clinical medical record.
 * Enforces mandatory amendment reason for audit logging.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordUpdateRequest {

    @NotBlank(message = "Updated symptoms description is required")
    @Size(min = 3, max = 5000, message = "Symptoms description must be between 3 and 5000 characters")
    private String symptoms;

    @NotBlank(message = "Updated clinical diagnosis is required")
    @Size(min = 2, max = 5000, message = "Diagnosis must be between 2 and 5000 characters")
    private String diagnosis;

    @NotBlank(message = "Updated treatment plan is required")
    @Size(min = 2, max = 5000, message = "Treatment plan must be between 2 and 5000 characters")
    private String treatment;

    @Size(max = 5000, message = "Clinical notes cannot exceed 5000 characters")
    private String notes;

    private LocalDate followUpDate;

    @NotBlank(message = "Reason for clinical record amendment is required for audit compliance")
    @Size(min = 5, max = 500, message = "Amendment reason must be between 5 and 500 characters")
    private String amendmentReason;

    // Optional Vitals Telemetry
    private String bloodPressure;
    private Integer heartRate;
    private Double temperature;
    private Integer spo2;
    private Integer respiratoryRate;
}

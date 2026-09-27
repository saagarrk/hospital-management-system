package com.hospital.management.dto.medicalrecord;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for creating a new patient medical record.
 * Enforces validation on required clinical fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordCreateRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long doctorId; // Optional: Inferred from authenticated doctor if omitted

    private Long appointmentId;

    private LocalDate visitDate; // Defaults to current date if omitted

    @NotBlank(message = "Clinical symptoms description is required")
    @Size(min = 3, max = 5000, message = "Symptoms description must be between 3 and 5000 characters")
    private String symptoms;

    @NotBlank(message = "Clinical diagnosis is required")
    @Size(min = 2, max = 5000, message = "Diagnosis must be between 2 and 5000 characters")
    private String diagnosis;

    @NotBlank(message = "Treatment plan is required")
    @Size(min = 2, max = 5000, message = "Treatment plan must be between 2 and 5000 characters")
    private String treatment;

    @Size(max = 5000, message = "Clinical notes cannot exceed 5000 characters")
    private String notes;

    private LocalDate followUpDate;

    // Optional physical examination & lab tests
    private String physicalExamination;
    private String labTestsRecommended;

    // Optional Vitals Telemetry
    private String bloodPressure;
    private Integer heartRate;
    private Double temperature;
    private Integer spo2;
    private Integer respiratoryRate;
}

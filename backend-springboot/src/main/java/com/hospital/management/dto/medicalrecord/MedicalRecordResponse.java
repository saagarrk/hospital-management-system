package com.hospital.management.dto.medicalrecord;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Standard enterprise presentation DTO for Medical Records.
 * Encapsulates clinical, doctor, patient, telemetry, and audit history data
 * without exposing internal JPA entity structures.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordResponse {

    private Long id;

    // Patient Information
    private Long patientId;
    private String patientName;
    private String patientCode;
    private String patientGender;
    private LocalDate patientDateOfBirth;
    private String patientPhone;

    // Doctor Information
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String departmentName;

    // Optional linked appointment
    private Long appointmentId;

    // Clinical Consultation Data
    private LocalDate visitDate;
    private String symptoms;
    private String diagnosis;
    private String treatment;
    private String notes;
    private LocalDate followUpDate;

    // Optional Clinical Extensions
    private String physicalExamination;
    private String labTestsRecommended;

    // Vitals Telemetry
    private String bloodPressure;
    private Integer heartRate;
    private Double temperature;
    private Integer spo2;
    private Integer respiratoryRate;

    // Audit Information
    private String createdBy;
    private String lastModifiedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Audit history trail
    private List<MedicalRecordAuditDto> auditHistory;
}

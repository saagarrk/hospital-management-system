package com.hospital.management.dto.prescription;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private String patientGender;
    private String patientPhone;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String departmentName;
    private Long appointmentId;
    private LocalDate prescriptionDate;
    private String status; // ISSUED, DISPENSED, CANCELLED
    private String generalInstructions;
    private java.time.LocalDateTime dispensedAt;
    private String dispensedBy;
    private String dispensingNotes;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private List<PrescriptionItemDTO> items;
}

package com.hospital.management.dto.patient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long doctorId;
    private String doctorName;
    private Long appointmentId;
    private String diagnosis;
    private String symptoms;
    private String physicalExamination;
    private String treatmentPlan;
    private String labTestsRecommended;
    private String followUpDate;
    private String doctorNotes;
    private LocalDateTime recordDate;
}

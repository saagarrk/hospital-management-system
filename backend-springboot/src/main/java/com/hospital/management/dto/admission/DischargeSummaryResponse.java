package com.hospital.management.dto.admission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DischargeSummaryResponse {
    private Long id;
    private Long admissionId;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private LocalDateTime dischargeDate;
    private String diagnosisSummary;
    private String treatmentGiven;
    private String dischargeAdvice;
    private boolean billingCleared;
}

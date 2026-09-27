package com.hospital.management.dto.admission;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DischargeRequest {

    @NotBlank(message = "Diagnosis summary is required")
    private String diagnosisSummary;

    private String treatmentGiven;

    private String dischargeAdvice;
}

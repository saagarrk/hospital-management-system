package com.hospital.management.dto.admission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdmissionRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Bed ID is required")
    private Long bedId;

    @NotNull(message = "Attending doctor ID is required")
    private Long doctorId;

    @NotBlank(message = "Reason for admission is required")
    private String reasonForAdmission;
}

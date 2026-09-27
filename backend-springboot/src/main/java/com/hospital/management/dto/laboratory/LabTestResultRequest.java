package com.hospital.management.dto.laboratory;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabTestResultRequest {

    @NotBlank(message = "Result value is required")
    private String resultValue;

    private String normalRange;

    private String units;

    private String interpretation;

    private String remarks;
}

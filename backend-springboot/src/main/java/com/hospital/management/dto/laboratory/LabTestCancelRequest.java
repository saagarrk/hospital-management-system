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
public class LabTestCancelRequest {

    @NotBlank(message = "Cancellation justification is required")
    private String reason;
}

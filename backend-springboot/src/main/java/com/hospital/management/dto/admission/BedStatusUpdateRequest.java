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
public class BedStatusUpdateRequest {

    @NotBlank(message = "Bed status is required (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE)")
    private String status;

    private String reason;
}

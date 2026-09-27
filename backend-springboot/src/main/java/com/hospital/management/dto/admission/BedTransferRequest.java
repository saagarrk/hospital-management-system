package com.hospital.management.dto.admission;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedTransferRequest {

    @NotNull(message = "New Bed ID is required")
    private Long newBedId;

    private String reason;
}

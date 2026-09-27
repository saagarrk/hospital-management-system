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
public class BedRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotBlank(message = "Bed number is required")
    private String bedNumber;

    private String status; // AVAILABLE, RESERVED, MAINTENANCE

    private String notes;
}

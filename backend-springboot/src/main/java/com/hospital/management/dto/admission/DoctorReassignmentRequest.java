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
public class DoctorReassignmentRequest {

    @NotNull(message = "New doctor ID is required")
    private Long newDoctorId;

    private String reason;
}

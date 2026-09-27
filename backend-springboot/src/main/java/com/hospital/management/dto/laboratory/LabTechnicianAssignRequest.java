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
public class LabTechnicianAssignRequest {

    @NotBlank(message = "Technician name/handle is required")
    private String technicianName;

    private String notes;
}

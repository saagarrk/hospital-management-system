package com.hospital.management.dto.laboratory;

import com.hospital.management.enums.LabTestCategory;
import com.hospital.management.enums.LabTestPriority;
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
public class LabTestOrderRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long doctorId;

    @NotBlank(message = "Test name is required")
    private String testName;

    @NotNull(message = "Category is required")
    private LabTestCategory category;

    @NotNull(message = "Priority is required")
    private LabTestPriority priority;

    private String clinicalNotes;
}

package com.hospital.management.dto.laboratory;

import com.hospital.management.enums.LabTestCategory;
import com.hospital.management.enums.LabTestPriority;
import com.hospital.management.enums.LabTestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabTestResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private String patientGender;
    private Long doctorId;
    private String doctorName;
    private String testName;
    private LabTestCategory category;
    private LabTestPriority priority;
    private LabTestStatus status;
    private String clinicalNotes;

    // Workflow Timestamps & Audit
    private String assignedTechnician;
    private LocalDateTime assignedAt;

    private String sampleType;
    private String sampleBarcode;
    private LocalDateTime sampleCollectedAt;
    private String sampleCollectedBy;

    private LocalDateTime processingStartedAt;

    private String resultValue;
    private String normalRange;
    private String units;
    private String interpretation;
    private String remarks;
    private String technicianName;
    private LocalDateTime resultEnteredAt;

    private String reportNumber;
    private LocalDateTime completedAt;
    private String verifiedByDoctor;

    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private String cancelledBy;

    private LocalDateTime orderedAt;
    private LocalDateTime updatedAt;
}

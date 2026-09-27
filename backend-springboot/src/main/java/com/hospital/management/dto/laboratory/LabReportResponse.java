package com.hospital.management.dto.laboratory;

import com.hospital.management.enums.LabTestCategory;
import com.hospital.management.enums.LabTestPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabReportResponse {
    private Long id;
    private String reportNumber;
    private Long labTestId;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private String patientGender;
    private Long doctorId;
    private String doctorName;
    private String technicianName;
    private String testName;
    private LabTestCategory category;
    private LabTestPriority priority;
    private String sampleType;
    private String sampleBarcode;
    private String resultValue;
    private String normalRange;
    private String units;
    private String interpretation; // NORMAL, ABNORMAL, HIGH, LOW, CRITICAL
    private String remarks;
    private String findings;
    private LocalDateTime orderedAt;
    private LocalDateTime sampleCollectedAt;
    private LocalDateTime reportedAt;
    private String verifiedByDoctor;
    private String status;
}

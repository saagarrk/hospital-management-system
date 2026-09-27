package com.hospital.management.dto.medicalrecord;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Audit log entry DTO representing a historical modification event on a medical record.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordAuditDto {
    private Long id;
    private Long medicalRecordId;
    private String action;
    private String performedBy;
    private String performedByRole;
    private LocalDateTime timestamp;
    private String amendmentReason;
    private String changeSummary;
}

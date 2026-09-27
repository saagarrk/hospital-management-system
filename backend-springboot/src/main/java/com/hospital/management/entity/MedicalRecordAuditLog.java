package com.hospital.management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Audit log entity tracking all creation and modification events for Medical Records.
 * Enforces HIPAA accountability and non-repudiation standards.
 */
@Entity
@Table(
    name = "medical_record_audit_logs",
    indexes = {
        @Index(name = "idx_audit_med_record", columnList = "medical_record_id"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class MedicalRecordAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "medical_record_id", nullable = false)
    private Long medicalRecordId;

    @Column(nullable = false, length = 50)
    private String action; // e.g. "RECORD_CREATED", "RECORD_AMENDED"

    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy;

    @Column(name = "performed_by_role", length = 50)
    private String performedByRole;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "amendment_reason", length = 500)
    private String amendmentReason;

    @Column(name = "change_summary", columnDefinition = "TEXT")
    private String changeSummary;
}

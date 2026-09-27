package com.hospital.management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Enterprise Audit Log Entity for tracking all critical system operations.
 * Enforces HIPAA accountability, compliance, and non-repudiation.
 */
@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_username", columnList = "username"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_entity_type", columnList = "entity_type"),
        @Index(name = "idx_audit_entity_id", columnList = "entity_id"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(length = 50)
    private String role;

    @Column(nullable = false, length = 100)
    private String action; // e.g., "LOGIN", "USER_CREATED", "USER_DEACTIVATED", "PATIENT_UPDATED", "APPOINTMENT_CREATED", "APPOINTMENT_CANCELLED", "MEDICAL_RECORD_CREATED", "PRESCRIPTION_CREATED", "STOCK_CHANGED", "ADMISSION", "TRANSFER", "DISCHARGE", "BILL_CREATED", "PAYMENT"

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // e.g., "USER", "PATIENT", "APPOINTMENT", "MEDICAL_RECORD", "PRESCRIPTION", "MEDICINE", "ADMISSION", "BILL", "PAYMENT"

    @Column(name = "entity_id")
    private Long entityId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "SUCCESS"; // "SUCCESS", "FAILURE", "DENIED"

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // Non-sensitive sanitized audit summary or JSON details
}

package com.hospital.management.entity;

import com.hospital.management.enums.LabTestCategory;
import com.hospital.management.enums.LabTestPriority;
import com.hospital.management.enums.LabTestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class LabTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Column(name = "test_name", nullable = false, length = 150)
    private String testName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private LabTestCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private LabTestPriority priority = LabTestPriority.ROUTINE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private LabTestStatus status = LabTestStatus.ORDERED;

    @Column(name = "clinical_notes", columnDefinition = "TEXT")
    private String clinicalNotes;

    // Assignment Phase
    @Column(name = "assigned_technician", length = 100)
    private String assignedTechnician;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    // Sample Collection Phase
    @Column(name = "sample_type", length = 50)
    private String sampleType; // e.g. "WHOLE_BLOOD", "SERUM", "URINE", "SWAB", "TISSUE"

    @Column(name = "sample_barcode", length = 50)
    private String sampleBarcode;

    @Column(name = "sample_collected_at")
    private LocalDateTime sampleCollectedAt;

    @Column(name = "sample_collected_by", length = 100)
    private String sampleCollectedBy;

    // Processing Phase
    @Column(name = "processing_started_at")
    private LocalDateTime processingStartedAt;

    // Result Entry Phase (SRS Rule 6: Lab Tech only)
    @Column(name = "result_value", columnDefinition = "TEXT")
    private String resultValue;

    @Column(name = "normal_range", length = 100)
    private String normalRange;

    @Column(length = 30)
    private String units;

    @Column(length = 100)
    private String interpretation; // NORMAL, ABNORMAL, HIGH, LOW, CRITICAL

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "technician_name", length = 100)
    private String technicianName;

    @Column(name = "result_entered_at")
    private LocalDateTime resultEnteredAt;

    // Report Generation & Completion
    @Column(name = "report_number", length = 50)
    private String reportNumber;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "verified_by_doctor", length = 100)
    private String verifiedByDoctor;

    // Cancellation Audit
    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by", length = 100)
    private String cancelledBy;

    @CreatedDate
    @Column(name = "ordered_at", nullable = false, updatable = false)
    private LocalDateTime orderedAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

package com.hospital.management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class LabReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_number", nullable = false, unique = true, length = 30)
    private String reportNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_test_id", nullable = false, unique = true)
    private LabTest labTest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_doctor_id")
    private Doctor verifiedByDoctor;

    @Column(name = "result_summary", nullable = false, columnDefinition = "TEXT")
    private String resultSummary;

    @Column(columnDefinition = "JSON")
    private String findings;

    @Column(name = "normal_range", length = 100)
    private String normalRange;

    @Column(length = 50)
    private String units;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String interpretation = "NORMAL";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "FINAL";

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @CreatedDate
    @Column(name = "reported_at", nullable = false, updatable = false)
    private LocalDateTime reportedAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

package com.hospital.management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Enterprise Medical Record (EMR) entity representing clinical consultations,
 * diagnoses, treatment protocols, and physician evaluations.
 * Enforces database indexing for optimal patient history lookups and audit trails.
 */
@Entity
@Table(
    name = "medical_records",
    indexes = {
        @Index(name = "idx_med_record_patient", columnList = "patient_id"),
        @Index(name = "idx_med_record_doctor", columnList = "doctor_id"),
        @Index(name = "idx_med_record_visit", columnList = "visit_date"),
        @Index(name = "idx_med_record_created", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String symptoms;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String diagnosis;

    @Column(name = "treatment_plan", columnDefinition = "TEXT", nullable = false)
    private String treatment;

    @Column(name = "clinical_notes", columnDefinition = "TEXT")
    private String clinicalNotes;

    // Physical examination and test recommendations (optional clinical extensions)
    @Column(name = "physical_examination", columnDefinition = "TEXT")
    private String physicalExamination;

    @Column(name = "lab_tests_recommended", columnDefinition = "TEXT")
    private String labTestsRecommended;

    // Vitals Telemetry
    @Column(name = "blood_pressure", length = 20)
    private String bloodPressure;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "spo2")
    private Integer spo2;

    @Column(name = "respiratory_rate")
    private Integer respiratoryRate;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    // Audit and Compliance Fields
    @Column(name = "created_by", length = 100, updatable = false)
    private String createdBy;

    @Column(name = "last_modified_by", length = 100)
    private String lastModifiedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Compatibility Getters & Setters for notes and treatmentPlan
    public String getNotes() {
        return this.clinicalNotes;
    }

    public void setNotes(String notes) {
        this.clinicalNotes = notes;
    }

    public String getTreatmentPlan() {
        return this.treatment;
    }

    public void setTreatmentPlan(String treatmentPlan) {
        this.treatment = treatmentPlan;
    }

    public String getDoctorNotes() {
        return this.clinicalNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.clinicalNotes = doctorNotes;
    }

    public LocalDateTime getRecordDate() {
        return this.createdAt != null ? this.createdAt : LocalDateTime.now();
    }
}

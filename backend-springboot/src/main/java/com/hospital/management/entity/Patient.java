package com.hospital.management.entity;

import com.hospital.management.enums.BloodGroup;
import com.hospital.management.enums.Gender;
import com.hospital.management.enums.MaritalStatus;
import com.hospital.management.enums.PatientStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "patients",
    indexes = {
        @Index(name = "idx_patient_code", columnList = "patient_code", unique = true),
        @Index(name = "idx_patient_name", columnList = "name"),
        @Index(name = "idx_patient_phone", columnList = "phone"),
        @Index(name = "idx_patient_email", columnList = "email"),
        @Index(name = "idx_patient_status", columnList = "status"),
        @Index(name = "idx_patient_blood_group", columnList = "blood_group")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_code", nullable = false, unique = true, length = 30)
    private String patientCode; // e.g. "PT-2026-0001" or "PT-0001"

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Links patient to their authenticated login account for portal isolation

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup; // e.g. "O+", "A+"

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_status", length = 20)
    @Builder.Default
    private MaritalStatus maritalStatus = MaritalStatus.SINGLE;

    @Column(length = 100)
    private String occupation;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "emergency_contact_name", nullable = false, length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", nullable = false, length = 20)
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_relation", length = 50)
    private String emergencyContactRelation; // e.g. "Spouse", "Father", "Sibling"

    @Column(name = "medical_history", columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PatientStatus status = PatientStatus.ACTIVE;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

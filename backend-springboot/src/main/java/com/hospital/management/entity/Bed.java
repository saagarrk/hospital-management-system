package com.hospital.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "beds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "bed_number", nullable = false, length = 20)
    private String bedNumber;

    /**
     * Enforces SRS Rule 7: Occupied beds cannot be assigned.
     * Status values: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "AVAILABLE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_patient_id")
    private Patient currentPatient;

    @Column(name = "admission_id")
    private Long admissionId;

    @Column(name = "notes", length = 255)
    private String notes;

    /**
     * Optimistic locking version field
     */
    @Version
    @Column(name = "version")
    private Long version;
}

package com.hospital.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(nullable = false, length = 50)
    private String dosage; // e.g. "500mg"

    @Column(nullable = false, length = 50)
    private String frequency; // e.g. "TID (3x/day)"

    @Column(nullable = false, length = 50)
    private String duration; // e.g. "7 days"

    @Column(length = 255)
    private String instructions; // e.g. "Take after meals"
}

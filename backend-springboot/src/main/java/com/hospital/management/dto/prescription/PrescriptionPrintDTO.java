package com.hospital.management.dto.prescription;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Print & Download-friendly DTO formatted for clinical prescription slips,
 * pharmacy dispensing records, and patient medication schedules.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionPrintDTO {

    // Hospital Facility Header
    private String hospitalName;
    private String hospitalTagline;
    private String hospitalAddress;
    private String hospitalPhone;
    private String hospitalEmail;
    private String hospitalWebsite;

    // Prescription Document Metadata
    private Long prescriptionId;
    private String rxNumber; // e.g. "RX-2026-0001"
    private LocalDate prescriptionDate;
    private LocalDateTime issuedAt;
    private String status;

    // Attending Physician Demographics
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String doctorQualification;
    private String doctorDepartment;
    private String doctorPhone;
    private String doctorLicenseNumber;

    // Patient Demographics & Clinical Profile
    private Long patientId;
    private String patientName;
    private String patientCode;
    private String patientGender;
    private LocalDate patientDob;
    private Integer patientAge;
    private String patientPhone;
    private String patientBloodGroup;
    private String knownAllergies;

    // Associated Consultation / Appointment
    private Long appointmentId;

    // Structured Posology & Medication Line Items
    private List<PrintItem> items;

    // Instructions, Warnings & Regimen
    private String generalInstructions;
    private String dietaryAdvice;
    private String safetyWarnings;
    private String refillsAllowed;

    // Dispensing Record (for pharmacy fulfillment)
    private LocalDateTime dispensedAt;
    private String dispensedBy;
    private String dispensingNotes;

    // Security & Cryptographic Verification
    private String digitalVerificationHash;
    private String barcodeData;
    private String legalDisclaimer;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrintItem {
        private int itemIndex;
        private Long medicineId;
        private String medicineName;
        private String genericName;
        private String category;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
    }
}

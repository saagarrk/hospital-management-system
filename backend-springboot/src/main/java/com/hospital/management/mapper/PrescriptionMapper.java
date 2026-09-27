package com.hospital.management.mapper;

import com.hospital.management.dto.prescription.PrescriptionItemDTO;
import com.hospital.management.dto.prescription.PrescriptionPrintDTO;
import com.hospital.management.dto.prescription.PrescriptionResponse;
import com.hospital.management.entity.Prescription;
import com.hospital.management.entity.PrescriptionItem;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class PrescriptionMapper {

    public PrescriptionResponse toResponse(Prescription prescription) {
        if (prescription == null) return null;

        List<PrescriptionItemDTO> itemDTOs = prescription.getItems() != null
                ? prescription.getItems().stream().map(this::toItemDTO).collect(Collectors.toList())
                : Collections.emptyList();

        return PrescriptionResponse.builder()
                .id(prescription.getId())
                .patientId(prescription.getPatient().getId())
                .patientName(prescription.getPatient().getName())
                .patientCode(prescription.getPatient().getPatientCode())
                .patientGender(prescription.getPatient().getGender() != null ? prescription.getPatient().getGender().name() : null)
                .patientPhone(prescription.getPatient().getPhone())
                .doctorId(prescription.getDoctor().getId())
                .doctorName(prescription.getDoctor().getName())
                .doctorSpecialization(prescription.getDoctor().getSpecialization())
                .departmentName(prescription.getDoctor().getDepartment() != null ? prescription.getDoctor().getDepartment().getName() : prescription.getDoctor().getSpecialization())
                .appointmentId(prescription.getAppointment() != null ? prescription.getAppointment().getId() : null)
                .prescriptionDate(prescription.getPrescriptionDate())
                .status(prescription.getStatus())
                .generalInstructions(prescription.getGeneralInstructions())
                .dispensedAt(prescription.getDispensedAt())
                .dispensedBy(prescription.getDispensedBy())
                .dispensingNotes(prescription.getDispensingNotes())
                .createdAt(prescription.getCreatedAt())
                .updatedAt(prescription.getUpdatedAt())
                .items(itemDTOs)
                .build();
    }

    public PrescriptionItemDTO toItemDTO(PrescriptionItem item) {
        if (item == null) return null;
        return PrescriptionItemDTO.builder()
                .id(item.getId())
                .medicineId(item.getMedicine().getId())
                .medicineName(item.getMedicine().getName())
                .genericName(item.getMedicine().getGenericName())
                .category(item.getMedicine().getCategory())
                .unitPrice(item.getMedicine().getUnitPrice())
                .dosage(item.getDosage())
                .frequency(item.getFrequency())
                .duration(item.getDuration())
                .instructions(item.getInstructions())
                .build();
    }

    public PrescriptionPrintDTO toPrintDTO(Prescription prescription) {
        if (prescription == null) return null;

        LocalDate dob = prescription.getPatient().getDateOfBirth();
        Integer age = dob != null ? Period.between(dob, LocalDate.now()).getYears() : null;

        List<PrescriptionPrintDTO.PrintItem> printItems = prescription.getItems() != null
                ? prescription.getItems().stream().map(it -> PrescriptionPrintDTO.PrintItem.builder()
                .itemIndex(prescription.getItems().indexOf(it) + 1)
                .medicineId(it.getMedicine().getId())
                .medicineName(it.getMedicine().getName())
                .genericName(it.getMedicine().getGenericName())
                .category(it.getMedicine().getCategory())
                .dosage(it.getDosage())
                .frequency(it.getFrequency())
                .duration(it.getDuration())
                .instructions(it.getInstructions())
                .build()).collect(Collectors.toList())
                : Collections.emptyList();

        return PrescriptionPrintDTO.builder()
                .hospitalName("St. Jude Memorial Hospital")
                .hospitalTagline("Excellence in Clinical Care & Pharmacotherapy")
                .hospitalAddress("1200 Health Science Blvd, Metropolis, NY 10001")
                .hospitalPhone("+1 (555) 900-HOSP")
                .hospitalEmail("pharmacy@stjudememorial.org")
                .hospitalWebsite("https://hospital.stjudememorial.org")
                .prescriptionId(prescription.getId())
                .rxNumber(String.format("RX-%d-%04d", prescription.getPrescriptionDate().getYear(), prescription.getId()))
                .prescriptionDate(prescription.getPrescriptionDate())
                .issuedAt(prescription.getCreatedAt())
                .status(prescription.getStatus())
                .doctorId(prescription.getDoctor().getId())
                .doctorName(prescription.getDoctor().getName())
                .doctorSpecialization(prescription.getDoctor().getSpecialization())
                .doctorQualification(prescription.getDoctor().getQualification())
                .doctorDepartment(prescription.getDoctor().getDepartment() != null ? prescription.getDoctor().getDepartment().getName() : prescription.getDoctor().getSpecialization())
                .doctorPhone(prescription.getDoctor().getPhone())
                .doctorLicenseNumber("MD-LIC-" + (10000 + prescription.getDoctor().getId()))
                .patientId(prescription.getPatient().getId())
                .patientName(prescription.getPatient().getName())
                .patientCode(prescription.getPatient().getPatientCode())
                .patientGender(prescription.getPatient().getGender() != null ? prescription.getPatient().getGender().name() : "N/A")
                .patientDob(prescription.getPatient().getDateOfBirth())
                .patientAge(age)
                .patientPhone(prescription.getPatient().getPhone())
                .patientBloodGroup(prescription.getPatient().getBloodGroup() != null ? prescription.getPatient().getBloodGroup().name() : null)
                .knownAllergies(prescription.getPatient().getAllergies())
                .appointmentId(prescription.getAppointment() != null ? prescription.getAppointment().getId() : null)
                .items(printItems)
                .generalInstructions(prescription.getGeneralInstructions())
                .dietaryAdvice("Drink plenty of water and follow dietary precautions indicated by physician.")
                .safetyWarnings("Keep all medicines out of reach of children. Store in a cool, dry place away from direct sunlight.")
                .refillsAllowed("0 Refills (Physician consultation required for renewal)")
                .dispensedAt(prescription.getDispensedAt())
                .dispensedBy(prescription.getDispensedBy())
                .dispensingNotes(prescription.getDispensingNotes())
                .digitalVerificationHash(String.format("SHA256:RX-%d-%d-%d", prescription.getId(), prescription.getPatient().getId(), prescription.getDoctor().getId()))
                .barcodeData(String.format("*RX%06d*", prescription.getId()))
                .legalDisclaimer("This prescription is valid for 30 days from date of issuance. Tampering with this prescription is a federal offense.")
                .build();
    }
}

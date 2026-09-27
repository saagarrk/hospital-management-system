package com.hospital.management.mapper;

import com.hospital.management.dto.patient.PatientRequest;
import com.hospital.management.dto.patient.PatientResponse;
import com.hospital.management.dto.patient.PatientSummaryResponse;
import com.hospital.management.entity.Patient;
import com.hospital.management.enums.MaritalStatus;
import com.hospital.management.enums.PatientStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;

@Component
public class PatientMapper {

    public Patient toEntity(PatientRequest request) {
        if (request == null) return null;
        return Patient.builder()
                .name(request.getName().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .bloodGroup(request.getBloodGroup() != null ? request.getBloodGroup().getLabel() : null)
                .maritalStatus(request.getMaritalStatus() != null ? request.getMaritalStatus() : MaritalStatus.SINGLE)
                .occupation(request.getOccupation())
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null)
                .address(request.getAddress())
                .emergencyContactName(request.getEmergencyContactName().trim())
                .emergencyContactPhone(request.getEmergencyContactPhone().trim())
                .emergencyContactRelation(request.getEmergencyContactRelation())
                .medicalHistory(request.getMedicalHistory())
                .allergies(request.getAllergies())
                .status(PatientStatus.ACTIVE)
                .build();
    }

    public PatientResponse toResponse(Patient patient) {
        if (patient == null) return null;

        Integer calculatedAge = null;
        if (patient.getDateOfBirth() != null) {
            calculatedAge = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        return PatientResponse.builder()
                .id(patient.getId())
                .patientCode(patient.getPatientCode())
                .name(patient.getName())
                .dateOfBirth(patient.getDateOfBirth())
                .age(calculatedAge)
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .maritalStatus(patient.getMaritalStatus())
                .occupation(patient.getOccupation())
                .phone(patient.getPhone())
                .email(patient.getEmail())
                .address(patient.getAddress())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .emergencyContactRelation(patient.getEmergencyContactRelation())
                .medicalHistory(patient.getMedicalHistory())
                .allergies(patient.getAllergies())
                .status(patient.getStatus())
                .userId(patient.getUser() != null ? patient.getUser().getId() : null)
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }

    public PatientSummaryResponse toSummaryResponse(Patient patient) {
        if (patient == null) return null;

        Integer calculatedAge = null;
        if (patient.getDateOfBirth() != null) {
            calculatedAge = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        boolean hasAllergies = patient.getAllergies() != null && !patient.getAllergies().trim().isEmpty() && !patient.getAllergies().equalsIgnoreCase("None");

        return PatientSummaryResponse.builder()
                .id(patient.getId())
                .patientCode(patient.getPatientCode())
                .name(patient.getName())
                .age(calculatedAge)
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .phone(patient.getPhone())
                .email(patient.getEmail())
                .status(patient.getStatus())
                .hasAllergies(hasAllergies)
                .build();
    }
}

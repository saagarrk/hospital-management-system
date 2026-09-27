package com.hospital.management.mapper;

import com.hospital.management.dto.medicalrecord.MedicalRecordAuditDto;
import com.hospital.management.dto.medicalrecord.MedicalRecordCreateRequest;
import com.hospital.management.dto.medicalrecord.MedicalRecordResponse;
import com.hospital.management.dto.medicalrecord.MedicalRecordUpdateRequest;
import com.hospital.management.entity.Appointment;
import com.hospital.management.entity.Doctor;
import com.hospital.management.entity.MedicalRecord;
import com.hospital.management.entity.MedicalRecordAuditLog;
import com.hospital.management.entity.Patient;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Enterprise Mapper responsible for safe DTO-Entity transformations for Medical Records.
 * Ensures internal entity identifiers, passwords, and sensitive system pointers are never leaked.
 */
@Component
public class MedicalRecordMapper {

    public MedicalRecord toEntity(
            MedicalRecordCreateRequest request,
            Patient patient,
            Doctor doctor,
            Appointment appointment,
            String authorUsername) {

        if (request == null) return null;

        return MedicalRecord.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .visitDate(request.getVisitDate() != null ? request.getVisitDate() : LocalDate.now())
                .symptoms(request.getSymptoms())
                .diagnosis(request.getDiagnosis())
                .treatment(request.getTreatment())
                .clinicalNotes(request.getNotes())
                .physicalExamination(request.getPhysicalExamination())
                .labTestsRecommended(request.getLabTestsRecommended())
                .followUpDate(request.getFollowUpDate())
                .bloodPressure(request.getBloodPressure())
                .heartRate(request.getHeartRate())
                .temperature(request.getTemperature())
                .spo2(request.getSpo2())
                .respiratoryRate(request.getRespiratoryRate())
                .createdBy(authorUsername)
                .lastModifiedBy(authorUsername)
                .build();
    }

    public void updateEntity(
            MedicalRecord record,
            MedicalRecordUpdateRequest request,
            String modifyingUsername) {

        if (record == null || request == null) return;

        record.setSymptoms(request.getSymptoms());
        record.setDiagnosis(request.getDiagnosis());
        record.setTreatment(request.getTreatment());
        record.setClinicalNotes(request.getNotes());
        record.setFollowUpDate(request.getFollowUpDate());

        if (request.getBloodPressure() != null) record.setBloodPressure(request.getBloodPressure());
        if (request.getHeartRate() != null) record.setHeartRate(request.getHeartRate());
        if (request.getTemperature() != null) record.setTemperature(request.getTemperature());
        if (request.getSpo2() != null) record.setSpo2(request.getSpo2());
        if (request.getRespiratoryRate() != null) record.setRespiratoryRate(request.getRespiratoryRate());

        record.setLastModifiedBy(modifyingUsername);
        record.setUpdatedAt(LocalDateTime.now());
    }

    public MedicalRecordResponse toResponse(MedicalRecord record) {
        return toResponse(record, Collections.emptyList());
    }

    public MedicalRecordResponse toResponse(MedicalRecord record, List<MedicalRecordAuditLog> auditLogs) {
        if (record == null) return null;

        Patient patient = record.getPatient();
        Doctor doctor = record.getDoctor();

        List<MedicalRecordAuditDto> auditDtos = (auditLogs != null)
                ? auditLogs.stream().map(this::toAuditDto).collect(Collectors.toList())
                : Collections.emptyList();

        return MedicalRecordResponse.builder()
                .id(record.getId())
                .patientId(patient != null ? patient.getId() : null)
                .patientName(patient != null ? patient.getName() : "Unknown Patient")
                .patientCode(patient != null ? patient.getPatientCode() : null)
                .patientGender(patient != null && patient.getGender() != null ? patient.getGender().name() : null)
                .patientDateOfBirth(patient != null ? patient.getDateOfBirth() : null)
                .patientPhone(patient != null ? patient.getPhone() : null)
                .doctorId(doctor != null ? doctor.getId() : null)
                .doctorName(doctor != null ? doctor.getName() : "Unknown Doctor")
                .doctorSpecialization(doctor != null ? doctor.getSpecialization() : null)
                .departmentName(doctor != null && doctor.getDepartment() != null
                        ? doctor.getDepartment().getName()
                        : null)
                .appointmentId(record.getAppointment() != null ? record.getAppointment().getId() : null)
                .visitDate(record.getVisitDate())
                .symptoms(record.getSymptoms())
                .diagnosis(record.getDiagnosis())
                .treatment(record.getTreatment())
                .notes(record.getClinicalNotes())
                .followUpDate(record.getFollowUpDate())
                .physicalExamination(record.getPhysicalExamination())
                .labTestsRecommended(record.getLabTestsRecommended())
                .bloodPressure(record.getBloodPressure())
                .heartRate(record.getHeartRate())
                .temperature(record.getTemperature())
                .spo2(record.getSpo2())
                .respiratoryRate(record.getRespiratoryRate())
                .createdBy(record.getCreatedBy())
                .lastModifiedBy(record.getLastModifiedBy())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .auditHistory(auditDtos)
                .build();
    }

    public MedicalRecordAuditDto toAuditDto(MedicalRecordAuditLog auditLog) {
        if (auditLog == null) return null;
        return MedicalRecordAuditDto.builder()
                .id(auditLog.getId())
                .medicalRecordId(auditLog.getMedicalRecordId())
                .action(auditLog.getAction())
                .performedBy(auditLog.getPerformedBy())
                .performedByRole(auditLog.getPerformedByRole())
                .timestamp(auditLog.getTimestamp())
                .amendmentReason(auditLog.getAmendmentReason())
                .changeSummary(auditLog.getChangeSummary())
                .build();
    }
}

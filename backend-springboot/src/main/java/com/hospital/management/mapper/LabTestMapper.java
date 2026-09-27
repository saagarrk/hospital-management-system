package com.hospital.management.mapper;

import com.hospital.management.dto.laboratory.LabReportResponse;
import com.hospital.management.dto.laboratory.LabTestOrderRequest;
import com.hospital.management.dto.laboratory.LabTestResponse;
import com.hospital.management.entity.Doctor;
import com.hospital.management.entity.LabReport;
import com.hospital.management.entity.LabTest;
import com.hospital.management.entity.Patient;
import com.hospital.management.enums.LabTestStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class LabTestMapper {

    public LabTest toEntity(LabTestOrderRequest request, Patient patient, Doctor doctor) {
        if (request == null) return null;
        return LabTest.builder()
                .patient(patient)
                .doctor(doctor)
                .testName(request.getTestName().trim())
                .category(request.getCategory())
                .priority(request.getPriority())
                .status(LabTestStatus.ORDERED)
                .clinicalNotes(request.getClinicalNotes() != null ? request.getClinicalNotes().trim() : null)
                .orderedAt(LocalDateTime.now())
                .build();
    }

    public LabTestResponse toResponse(LabTest test) {
        if (test == null) return null;
        return LabTestResponse.builder()
                .id(test.getId())
                .patientId(test.getPatient().getId())
                .patientName(test.getPatient().getName())
                .patientCode(test.getPatient().getPatientCode())
                .patientGender(test.getPatient().getGender() != null ? test.getPatient().getGender().name() : null)
                .doctorId(test.getDoctor() != null ? test.getDoctor().getId() : null)
                .doctorName(test.getDoctor() != null ? test.getDoctor().getName() : null)
                .testName(test.getTestName())
                .category(test.getCategory())
                .priority(test.getPriority())
                .status(test.getStatus())
                .clinicalNotes(test.getClinicalNotes())
                .assignedTechnician(test.getAssignedTechnician())
                .assignedAt(test.getAssignedAt())
                .sampleType(test.getSampleType())
                .sampleBarcode(test.getSampleBarcode())
                .sampleCollectedAt(test.getSampleCollectedAt())
                .sampleCollectedBy(test.getSampleCollectedBy())
                .processingStartedAt(test.getProcessingStartedAt())
                .resultValue(test.getResultValue())
                .normalRange(test.getNormalRange())
                .units(test.getUnits())
                .interpretation(test.getInterpretation())
                .remarks(test.getRemarks())
                .technicianName(test.getTechnicianName())
                .resultEnteredAt(test.getResultEnteredAt())
                .reportNumber(test.getReportNumber())
                .completedAt(test.getCompletedAt())
                .verifiedByDoctor(test.getVerifiedByDoctor())
                .cancellationReason(test.getCancellationReason())
                .cancelledAt(test.getCancelledAt())
                .cancelledBy(test.getCancelledBy())
                .orderedAt(test.getOrderedAt())
                .updatedAt(test.getUpdatedAt())
                .build();
    }

    public LabReportResponse toReportResponse(LabReport report) {
        if (report == null) return null;
        LabTest test = report.getLabTest();
        return LabReportResponse.builder()
                .id(report.getId())
                .reportNumber(report.getReportNumber())
                .labTestId(test != null ? test.getId() : null)
                .patientId(report.getPatient().getId())
                .patientName(report.getPatient().getName())
                .patientCode(report.getPatient().getPatientCode())
                .patientGender(report.getPatient().getGender() != null ? report.getPatient().getGender().name() : null)
                .doctorId(report.getVerifiedByDoctor() != null ? report.getVerifiedByDoctor().getId() : (test != null && test.getDoctor() != null ? test.getDoctor().getId() : null))
                .doctorName(report.getVerifiedByDoctor() != null ? report.getVerifiedByDoctor().getName() : (test != null && test.getDoctor() != null ? test.getDoctor().getName() : "Attending Physician"))
                .technicianName(report.getTechnician() != null ? report.getTechnician().getFullName() : (test != null ? test.getTechnicianName() : "Laboratory Specialist"))
                .testName(test != null ? test.getTestName() : "Diagnostic Profile")
                .category(test != null ? test.getCategory() : null)
                .priority(test != null ? test.getPriority() : null)
                .sampleType(test != null ? test.getSampleType() : null)
                .sampleBarcode(test != null ? test.getSampleBarcode() : null)
                .resultValue(report.getResultSummary())
                .normalRange(report.getNormalRange())
                .units(report.getUnits())
                .interpretation(report.getInterpretation())
                .remarks(report.getRemarks())
                .findings(report.getFindings())
                .orderedAt(test != null ? test.getOrderedAt() : null)
                .sampleCollectedAt(test != null ? test.getSampleCollectedAt() : null)
                .reportedAt(report.getReportedAt())
                .verifiedByDoctor(report.getVerifiedByDoctor() != null ? report.getVerifiedByDoctor().getName() : (test != null ? test.getVerifiedByDoctor() : null))
                .status(report.getStatus())
                .build();
    }
}

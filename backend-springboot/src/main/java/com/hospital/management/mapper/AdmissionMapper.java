package com.hospital.management.mapper;

import com.hospital.management.dto.admission.AdmissionResponse;
import com.hospital.management.entity.Admission;
import org.springframework.stereotype.Component;

@Component
public class AdmissionMapper {

    public AdmissionResponse toResponse(Admission admission) {
        if (admission == null) return null;
        return AdmissionResponse.builder()
                .id(admission.getId())
                .patientId(admission.getPatient().getId())
                .patientName(admission.getPatient().getName())
                .patientCode(admission.getPatient().getPatientCode())
                .bedId(admission.getBed().getId())
                .bedNumber(admission.getBed().getBedNumber())
                .roomNumber(admission.getBed().getRoom() != null ? admission.getBed().getRoom().getRoomNumber() : null)
                .roomType(admission.getBed().getRoom() != null ? admission.getBed().getRoom().getRoomType() : null)
                .doctorId(admission.getDoctor().getId())
                .doctorName(admission.getDoctor().getName())
                .admissionDate(admission.getAdmissionDate())
                .dischargeDate(admission.getDischargeDate())
                .status(admission.getStatus())
                .reasonForAdmission(admission.getReasonForAdmission())
                .build();
    }
}

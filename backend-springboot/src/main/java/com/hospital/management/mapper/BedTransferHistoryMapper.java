package com.hospital.management.mapper;

import com.hospital.management.dto.admission.BedTransferHistoryResponse;
import com.hospital.management.entity.BedTransferHistory;
import org.springframework.stereotype.Component;

@Component
public class BedTransferHistoryMapper {

    public BedTransferHistoryResponse toResponse(BedTransferHistory history) {
        if (history == null) return null;
        return BedTransferHistoryResponse.builder()
                .id(history.getId())
                .admissionId(history.getAdmission() != null ? history.getAdmission().getId() : null)
                .patientId(history.getPatient() != null ? history.getPatient().getId() : null)
                .patientName(history.getPatient() != null ? history.getPatient().getName() : null)
                .patientCode(history.getPatient() != null ? history.getPatient().getPatientCode() : null)
                .fromBedId(history.getFromBed() != null ? history.getFromBed().getId() : null)
                .fromBedNumber(history.getFromBed() != null ? history.getFromBed().getBedNumber() : null)
                .fromRoomNumber(history.getFromBed() != null && history.getFromBed().getRoom() != null ? history.getFromBed().getRoom().getRoomNumber() : null)
                .toBedId(history.getToBed() != null ? history.getToBed().getId() : null)
                .toBedNumber(history.getToBed() != null ? history.getToBed().getBedNumber() : null)
                .toRoomNumber(history.getToBed() != null && history.getToBed().getRoom() != null ? history.getToBed().getRoom().getRoomNumber() : null)
                .transferReason(history.getTransferReason())
                .transferredBy(history.getTransferredBy())
                .transferDate(history.getTransferDate())
                .build();
    }
}

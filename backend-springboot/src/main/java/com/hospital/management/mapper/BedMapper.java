package com.hospital.management.mapper;

import com.hospital.management.dto.admission.BedResponse;
import com.hospital.management.entity.Bed;
import org.springframework.stereotype.Component;

@Component
public class BedMapper {

    public BedResponse toResponse(Bed bed) {
        if (bed == null) return null;
        return BedResponse.builder()
                .id(bed.getId())
                .roomId(bed.getRoom() != null ? bed.getRoom().getId() : null)
                .roomNumber(bed.getRoom() != null ? bed.getRoom().getRoomNumber() : null)
                .roomType(bed.getRoom() != null ? bed.getRoom().getRoomType() : null)
                .floor(bed.getRoom() != null ? bed.getRoom().getFloor() : null)
                .dailyRate(bed.getRoom() != null ? bed.getRoom().getDailyRate() : null)
                .bedNumber(bed.getBedNumber())
                .status(bed.getStatus())
                .currentPatientId(bed.getCurrentPatient() != null ? bed.getCurrentPatient().getId() : null)
                .currentPatientName(bed.getCurrentPatient() != null ? bed.getCurrentPatient().getName() : null)
                .currentPatientCode(bed.getCurrentPatient() != null ? bed.getCurrentPatient().getPatientCode() : null)
                .admissionId(bed.getAdmissionId())
                .notes(bed.getNotes())
                .build();
    }
}

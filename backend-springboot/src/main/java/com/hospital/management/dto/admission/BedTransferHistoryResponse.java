package com.hospital.management.dto.admission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedTransferHistoryResponse {
    private Long id;
    private Long admissionId;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long fromBedId;
    private String fromBedNumber;
    private String fromRoomNumber;
    private Long toBedId;
    private String toBedNumber;
    private String toRoomNumber;
    private String transferReason;
    private String transferredBy;
    private LocalDateTime transferDate;
}

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
public class AdmissionResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long bedId;
    private String bedNumber;
    private String roomNumber;
    private String roomType;
    private Long doctorId;
    private String doctorName;
    private LocalDateTime admissionDate;
    private LocalDateTime dischargeDate;
    private String status;
    private String reasonForAdmission;
}

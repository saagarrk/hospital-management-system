package com.hospital.management.dto.admission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedResponse {
    private Long id;
    private Long roomId;
    private String roomNumber;
    private String roomType;
    private String floor;
    private BigDecimal dailyRate;
    private String bedNumber;
    private String status; // AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
    private Long currentPatientId;
    private String currentPatientName;
    private String currentPatientCode;
    private Long admissionId;
    private String notes;
}

package com.hospital.management.dto.admission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DischargePreparationResponse {
    private Long admissionId;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long bedId;
    private String bedNumber;
    private String roomNumber;
    private String roomType;
    private BigDecimal dailyRate;
    private Long doctorId;
    private String doctorName;
    private LocalDateTime admissionDate;
    private LocalDateTime proposedDischargeDate;
    private long lengthOfStayDays;
    private BigDecimal accruedRoomCharges;
    private BigDecimal totalBilledAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal outstandingBalance;
    private boolean billingCleared;
    private boolean vitalsStable;
    private boolean labReportsCompleted;
    private boolean pharmacyCleared;
    private boolean doctorApproved;
    private boolean readyForDischarge;
    private String clearanceNotes;
    private List<String> warnings;
}

package com.hospital.management.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientBillingSummaryResponse {
    private Long patientId;
    private String patientName;
    private String patientCode;
    private int totalBillsCount;
    private int unpaidBillsCount;
    private BigDecimal totalBilled;
    private BigDecimal totalPaid;
    private BigDecimal totalOutstanding;
    private boolean hasOutstandingBalance;
    private List<BillResponse> bills;
}

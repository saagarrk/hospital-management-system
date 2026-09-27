package com.hospital.management.dto.billing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class BillCreateRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long admissionId;
    private Long appointmentId;

    @NotNull(message = "Bill type is required (e.g. INPATIENT, OUTPATIENT, PHARMACY, LAB)")
    private String billType;

    private BigDecimal discountAmount;
    private BigDecimal taxAmount;

    @NotEmpty(message = "At least one bill item is required")
    @Valid
    private List<BillItemRequest> items;
}

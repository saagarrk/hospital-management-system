package com.hospital.management.dto.pharmacy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacySummaryDTO {
    private long totalMedicines;
    private long availableMedicines;
    private long lowStockCount;
    private long expiredCount;
    private long outOfStockCount;
    private BigDecimal totalInventoryValue;
    private long pendingPrescriptionsCount;
}

package com.hospital.management.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacistDashboardResponse {
    // Inventory Metrics
    private long lowStockMedicinesCount;
    private long expiringMedicinesCount;
    private long outOfStockCount;
    private long totalMedicinesCount;
    private BigDecimal totalInventoryValuation;

    // Prescriptions
    private long todaysPrescriptionsCount;
    private long pendingDispenseCount;
    private long dispensedCount;

    // Worklists
    private List<Map<String, Object>> lowStockMedicines;
    private List<Map<String, Object>> expiringMedicines;
    private List<Map<String, Object>> todaysPrescriptions;
}

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
public class AdminDashboardResponse {
    // Top Core Counts
    private long totalPatients;
    private long totalDoctors;
    private long todaysAppointmentsCount;
    private long pendingPaymentsCount;
    private BigDecimal pendingPaymentsAmount;

    // Revenue Summary
    private BigDecimal totalBilledRevenue;
    private BigDecimal totalCollectedRevenue;
    private BigDecimal totalPendingRevenue;

    // Bed Utilization
    private long totalBeds;
    private long availableBeds;
    private long occupiedBeds;
    private long reservedBeds;
    private long maintenanceBeds;
    private int bedOccupancyPercentage;

    // Pharmacy Alerts
    private long lowStockMedicinesCount;
    private long expiredMedicinesCount;

    // Laboratory Diagnostics
    private long pendingLabTestsCount;
    private long processingLabTestsCount;
    private long completedLabTestsCount;

    // Actionable Summaries
    private List<Map<String, Object>> todaysAppointments;
    private List<Map<String, Object>> lowStockMedicines;
    private List<Map<String, Object>> pendingLabTests;
    private List<Map<String, Object>> pendingBills;
}

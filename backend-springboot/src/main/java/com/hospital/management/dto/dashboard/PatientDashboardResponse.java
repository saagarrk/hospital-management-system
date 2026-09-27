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
public class PatientDashboardResponse {
    private Long patientId;
    private String patientName;
    private String patientCode;

    // Core Metrics
    private long upcomingAppointmentsCount;
    private long recentPrescriptionsCount;
    private long completedLabReportsCount;
    private long outstandingBillsCount;
    private BigDecimal outstandingBalanceAmount;

    // Patient Worklists
    private List<Map<String, Object>> upcomingAppointments;
    private List<Map<String, Object>> recentPrescriptions;
    private List<Map<String, Object>> labReports;
    private List<Map<String, Object>> outstandingBills;
}

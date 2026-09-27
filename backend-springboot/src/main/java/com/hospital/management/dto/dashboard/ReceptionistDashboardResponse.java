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
public class ReceptionistDashboardResponse {
    // Core Front-Desk Counters
    private long todaysAppointmentsCount;
    private long newRegistrationsCount;
    private long availableDoctorsCount;
    private long availableBedsCount;
    private long pendingPaymentsCount;
    private BigDecimal pendingPaymentsAmount;

    // Worklists
    private List<Map<String, Object>> todaysAppointments;
    private List<Map<String, Object>> recentRegistrations;
    private List<Map<String, Object>> availableDoctors;
    private List<Map<String, Object>> availableBeds;
    private List<Map<String, Object>> pendingCounterBills;
}

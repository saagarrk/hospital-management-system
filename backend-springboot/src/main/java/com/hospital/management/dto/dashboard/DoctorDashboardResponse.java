package com.hospital.management.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDashboardResponse {
    private Long doctorId;
    private String doctorName;
    private String specialization;

    // Core Metrics
    private long todaysAppointmentsCount;
    private long upcomingAppointmentsCount;
    private long totalPatientsTreated;
    private long pendingLabReportsCount;
    private long recentPrescriptionsCount;

    // Detailed Worklists
    private List<Map<String, Object>> todaysAppointments;
    private List<Map<String, Object>> upcomingAppointments;
    private List<Map<String, Object>> pendingLabReports;
    private List<Map<String, Object>> recentPrescriptions;
}

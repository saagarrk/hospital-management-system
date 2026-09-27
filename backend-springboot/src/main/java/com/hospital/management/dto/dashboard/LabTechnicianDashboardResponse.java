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
public class LabTechnicianDashboardResponse {
    // Laboratory Metrics
    private long pendingTestsCount;
    private long testsInProgressCount;
    private long completedTestsCount;
    private long statUrgentTestsCount;
    private long totalTestsCount;

    // Diagnostic Queues
    private List<Map<String, Object>> pendingTests;
    private List<Map<String, Object>> inProgressTests;
    private List<Map<String, Object>> completedTests;
    private List<Map<String, Object>> urgentQueue;
}

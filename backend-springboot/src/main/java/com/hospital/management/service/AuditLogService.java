package com.hospital.management.service;

import com.hospital.management.dto.audit.AuditLogResponse;
import com.hospital.management.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogService {

    AuditLog recordEvent(String username, String role, String action, String entityType, Long entityId, String status, String metadata);

    AuditLog logCurrentActor(String action, String entityType, Long entityId, String metadata);

    Page<AuditLogResponse> getAuditLogs(
            String username,
            String action,
            String entityType,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    List<AuditLogResponse> getRecentLogs(int limit);

    List<String> getAvailableActions();

    List<String> getAvailableEntityTypes();
}

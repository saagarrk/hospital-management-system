package com.hospital.management.controller;

import com.hospital.management.dto.ApiResponse;
import com.hospital.management.dto.audit.AuditLogResponse;
import com.hospital.management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Enterprise Audit Log REST Controller.
 * Restricted strictly to system ADMINISTRATORS for security compliance and audit oversight.
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Pageable pageable
    ) {
        Page<AuditLogResponse> logs = auditLogService.getAuditLogs(username, action, entityType, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs, "Audit logs retrieved successfully"));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getRecentLogs(
            @RequestParam(defaultValue = "15") int limit
    ) {
        List<AuditLogResponse> recent = auditLogService.getRecentLogs(limit);
        return ResponseEntity.ok(ApiResponse.success(recent, "Recent audit logs retrieved successfully"));
    }

    @GetMapping("/actions")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableActions() {
        List<String> actions = auditLogService.getAvailableActions();
        return ResponseEntity.ok(ApiResponse.success(actions, "Available actions retrieved"));
    }

    @GetMapping("/entity-types")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableEntityTypes() {
        List<String> entityTypes = auditLogService.getAvailableEntityTypes();
        return ResponseEntity.ok(ApiResponse.success(entityTypes, "Available entity types retrieved"));
    }
}

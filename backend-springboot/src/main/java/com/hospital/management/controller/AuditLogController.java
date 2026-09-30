package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.audit.AuditLogResponse;
import com.hospital.management.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Audit Logs", description = "HIPAA/NABH compliant regulatory audit trail capturing all system mutations")
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @Operation(summary = "Search system audit logs", description = "Retrieves filtered and paginated audit trail by username, action, entity, and timestamp range.")
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

    @Operation(summary = "Get recent audit activity", description = "Returns most recent audit events across the hospital application.")
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getRecentLogs(
            @RequestParam(defaultValue = "15") int limit
    ) {
        List<AuditLogResponse> recent = auditLogService.getRecentLogs(limit);
        return ResponseEntity.ok(ApiResponse.success(recent, "Recent audit logs retrieved successfully"));
    }

    @Operation(summary = "Get registered audit actions", description = "Returns list of all trackable audit actions (LOGIN, APPOINTMENT_CREATED, etc.).")
    @GetMapping("/actions")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableActions() {
        List<String> actions = auditLogService.getAvailableActions();
        return ResponseEntity.ok(ApiResponse.success(actions, "Available actions retrieved"));
    }

    @Operation(summary = "Get trackable entity types", description = "Returns list of domain entities audited (USER, PATIENT, BILL, etc.).")
    @GetMapping("/entity-types")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableEntityTypes() {
        List<String> entityTypes = auditLogService.getAvailableEntityTypes();
        return ResponseEntity.ok(ApiResponse.success(entityTypes, "Available entity types retrieved"));
    }
}

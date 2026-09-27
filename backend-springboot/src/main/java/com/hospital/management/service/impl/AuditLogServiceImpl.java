package com.hospital.management.service.impl;

import com.hospital.management.dto.audit.AuditLogResponse;
import com.hospital.management.entity.AuditLog;
import com.hospital.management.repository.AuditLogRepository;
import com.hospital.management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog recordEvent(String username, String role, String action, String entityType, Long entityId, String status, String metadata) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .username(username != null ? username : "ANONYMOUS")
                    .role(role != null ? role : "N/A")
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .timestamp(LocalDateTime.now())
                    .status(status != null ? status : "SUCCESS")
                    .metadata(sanitizeMetadata(metadata))
                    .build();

            AuditLog saved = auditLogRepository.save(auditLog);
            log.info("AUDIT EVENT: [action={}, user={}, entity={}:{}]", action, username, entityType, entityId);
            return saved;
        } catch (Exception ex) {
            log.error("Failed to persist audit log entry: {}", ex.getMessage());
            return null;
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog logCurrentActor(String action, String entityType, Long entityId, String metadata) {
        String username = "SYSTEM";
        String role = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            username = auth.getName();
            role = auth.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .orElse("USER");
        }

        return recordEvent(username, role, action, entityType, entityId, "SUCCESS", metadata);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(
            String username,
            String action,
            String entityType,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        // Enforce descending sort by timestamp if not specified
        Pageable sortedPageable = pageable;
        if (!pageable.getSort().isSorted()) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("timestamp").descending());
        }

        return auditLogRepository.searchAuditLogs(username, action, entityType, startDate, endDate, sortedPageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getRecentLogs(int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, 100), Sort.by("timestamp").descending());
        return auditLogRepository.findAll(pageable)
                .getContent()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableActions() {
        return auditLogRepository.findDistinctActions();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableEntityTypes() {
        return auditLogRepository.findDistinctEntityTypes();
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .username(log.getUsername())
                .role(log.getRole())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .status(log.getStatus())
                .metadata(log.getMetadata())
                .build();
    }

    /**
     * Sanitizes audit metadata to prevent leakage of credentials, tokens, or raw secrets.
     */
    private String sanitizeMetadata(String metadata) {
        if (metadata == null) return null;
        // Strip or redact sensitive patterns
        return metadata.replaceAll("(?i)(password|token|secret|pin)\\s*[:=]\\s*\"?[^\",;}\\]]+", "$1: [REDACTED]");
    }
}

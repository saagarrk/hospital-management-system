package com.hospital.management.dto.audit;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private String username;
    private String role;
    private String action;
    private String entityType;
    private Long entityId;
    private LocalDateTime timestamp;
    private String ipAddress;
    private String status;
    private String metadata;
}

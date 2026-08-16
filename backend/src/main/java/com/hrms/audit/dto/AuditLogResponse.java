package com.hrms.audit.dto;

import java.time.Instant;

public record AuditLogResponse(Long id, Long actorUserId, String actorEmail, String action, String entityType, String entityId, String metadata, String requestMethod, String requestPath, Instant createdAt) {
}

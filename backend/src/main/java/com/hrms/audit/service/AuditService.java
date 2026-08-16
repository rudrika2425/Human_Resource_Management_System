package com.hrms.audit.service;

import com.hrms.audit.dto.AuditLogResponse;
import com.hrms.audit.entity.AuditLog;
import com.hrms.audit.repository.AuditLogRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    // Constructor injection
    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long actorUserId, String actorEmail, String action, 
                    String entityType, String entityId, String metadata, 
                    String requestMethod, String requestPath) {
        
        AuditLog auditLog = new AuditLog();
        auditLog.setActorUserId(actorUserId);
        auditLog.setActorEmail(actorEmail);
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setMetadata(metadata);
        auditLog.setRequestMethod(requestMethod);
        auditLog.setRequestPath(requestPath);
        
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> list() {
        return auditLogRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorUserId(),
                log.getActorEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getMetadata(),
                log.getRequestMethod(),
                log.getRequestPath(),
                log.getCreatedAt()
        );
    }
}
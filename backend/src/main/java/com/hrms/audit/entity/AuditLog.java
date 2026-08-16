package com.hrms.audit.entity;

import com.hrms.common.entity.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_logs")
public class AuditLog extends AuditableEntity {

    private Long actorUserId;
    private String actorEmail;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String entityType;

    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(nullable = false)
    private String requestMethod;

    @Column(nullable = false)
    private String requestPath;

    // Default constructor
    public AuditLog() {
    }

    // Constructor with all fields
    public AuditLog(Long actorUserId, String actorEmail, String action, 
                    String entityType, String entityId, String metadata, 
                    String requestMethod, String requestPath) {
        this.actorUserId = actorUserId;
        this.actorEmail = actorEmail;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.metadata = metadata;
        this.requestMethod = requestMethod;
        this.requestPath = requestPath;
    }

    // Getters
    public Long getActorUserId() {
        return actorUserId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public String getMetadata() {
        return metadata;
    }

    public String getRequestMethod() {
        return requestMethod;
    }

    public String getRequestPath() {
        return requestPath;
    }

    // Setters
    public void setActorUserId(Long actorUserId) {
        this.actorUserId = actorUserId;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public void setRequestMethod(String requestMethod) {
        this.requestMethod = requestMethod;
    }

    public void setRequestPath(String requestPath) {
        this.requestPath = requestPath;
    }

    // Builder pattern
    public static AuditLogBuilder builder() {
        return new AuditLogBuilder();
    }

    public static class AuditLogBuilder {
        private Long actorUserId;
        private String actorEmail;
        private String action;
        private String entityType;
        private String entityId;
        private String metadata;
        private String requestMethod;
        private String requestPath;

        public AuditLogBuilder actorUserId(Long actorUserId) {
            this.actorUserId = actorUserId;
            return this;
        }

        public AuditLogBuilder actorEmail(String actorEmail) {
            this.actorEmail = actorEmail;
            return this;
        }

        public AuditLogBuilder action(String action) {
            this.action = action;
            return this;
        }

        public AuditLogBuilder entityType(String entityType) {
            this.entityType = entityType;
            return this;
        }

        public AuditLogBuilder entityId(String entityId) {
            this.entityId = entityId;
            return this;
        }

        public AuditLogBuilder metadata(String metadata) {
            this.metadata = metadata;
            return this;
        }

        public AuditLogBuilder requestMethod(String requestMethod) {
            this.requestMethod = requestMethod;
            return this;
        }

        public AuditLogBuilder requestPath(String requestPath) {
            this.requestPath = requestPath;
            return this;
        }

        public AuditLog build() {
            return new AuditLog(actorUserId, actorEmail, action, entityType, 
                              entityId, metadata, requestMethod, requestPath);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuditLog auditLog = (AuditLog) o;
        return getId() != null && getId().equals(auditLog.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "AuditLog{" +
                "id=" + getId() +
                ", actorUserId=" + actorUserId +
                ", actorEmail='" + actorEmail + '\'' +
                ", action='" + action + '\'' +
                ", entityType='" + entityType + '\'' +
                ", entityId='" + entityId + '\'' +
                ", requestMethod='" + requestMethod + '\'' +
                ", requestPath='" + requestPath + '\'' +
                '}';
    }
}
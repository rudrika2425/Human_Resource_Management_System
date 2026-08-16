package com.hrms.document.entity;

import com.hrms.common.entity.AuditableEntity;
import com.hrms.employee.entity.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "documents")
public class DocumentMetadata extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String documentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DocumentCategory category;

    @Column(nullable = false)
    private String publicId;

    @Column(nullable = false, length = 1000)
    private String secureUrl;

    @Column(nullable = false)
    private String resourceType;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private Long uploadedByUserId;

    // Default Constructor
    public DocumentMetadata() {
    }

    // Parameterized Constructor
    public DocumentMetadata(Employee employee, String originalFilename, String documentType,
                            DocumentCategory category, String publicId, String secureUrl,
                            String resourceType, Long fileSize, Long uploadedByUserId) {
        this.employee = employee;
        this.originalFilename = originalFilename;
        this.documentType = documentType;
        this.category = category;
        this.publicId = publicId;
        this.secureUrl = secureUrl;
        this.resourceType = resourceType;
        this.fileSize = fileSize;
        this.uploadedByUserId = uploadedByUserId;
    }

    // Getters and Setters
    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public DocumentCategory getCategory() {
        return category;
    }

    public void setCategory(DocumentCategory category) {
        this.category = category;
    }

    public String getPublicId() {
        return publicId;
    }

    public void setPublicId(String publicId) {
        this.publicId = publicId;
    }

    public String getSecureUrl() {
        return secureUrl;
    }

    public void setSecureUrl(String secureUrl) {
        this.secureUrl = secureUrl;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Long getUploadedByUserId() {
        return uploadedByUserId;
    }

    public void setUploadedByUserId(Long uploadedByUserId) {
        this.uploadedByUserId = uploadedByUserId;
    }

    // Builder pattern
    public static DocumentMetadataBuilder builder() {
        return new DocumentMetadataBuilder();
    }

    public static class DocumentMetadataBuilder {
        private Employee employee;
        private String originalFilename;
        private String documentType;
        private DocumentCategory category;
        private String publicId;
        private String secureUrl;
        private String resourceType;
        private Long fileSize;
        private Long uploadedByUserId;

        public DocumentMetadataBuilder employee(Employee employee) {
            this.employee = employee;
            return this;
        }

        public DocumentMetadataBuilder originalFilename(String originalFilename) {
            this.originalFilename = originalFilename;
            return this;
        }

        public DocumentMetadataBuilder documentType(String documentType) {
            this.documentType = documentType;
            return this;
        }

        public DocumentMetadataBuilder category(DocumentCategory category) {
            this.category = category;
            return this;
        }

        public DocumentMetadataBuilder publicId(String publicId) {
            this.publicId = publicId;
            return this;
        }

        public DocumentMetadataBuilder secureUrl(String secureUrl) {
            this.secureUrl = secureUrl;
            return this;
        }

        public DocumentMetadataBuilder resourceType(String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        public DocumentMetadataBuilder fileSize(Long fileSize) {
            this.fileSize = fileSize;
            return this;
        }

        public DocumentMetadataBuilder uploadedByUserId(Long uploadedByUserId) {
            this.uploadedByUserId = uploadedByUserId;
            return this;
        }

        public DocumentMetadata build() {
            return new DocumentMetadata(employee, originalFilename, documentType, category,
                    publicId, secureUrl, resourceType, fileSize, uploadedByUserId);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DocumentMetadata that = (DocumentMetadata) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "DocumentMetadata{" +
                "id=" + getId() +
                ", employeeId=" + (employee != null ? employee.getId() : null) +
                ", originalFilename='" + originalFilename + '\'' +
                ", documentType='" + documentType + '\'' +
                ", category=" + category +
                ", publicId='" + publicId + '\'' +
                ", secureUrl='" + secureUrl + '\'' +
                ", resourceType='" + resourceType + '\'' +
                ", fileSize=" + fileSize +
                ", uploadedByUserId=" + uploadedByUserId +
                '}';
    }
}
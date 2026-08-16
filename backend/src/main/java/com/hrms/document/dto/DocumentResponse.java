package com.hrms.document.dto;

import com.hrms.document.entity.DocumentCategory;
import java.time.Instant;

public record DocumentResponse(
        Long id,
        Long employeeId,
        String originalFilename,
        String documentType,
        DocumentCategory category,
        String publicId,
        String secureUrl,
        String resourceType,
        Long fileSize,
        Long uploadedByUserId,
        Instant createdAt,
        Instant updatedAt) {
}

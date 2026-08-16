package com.hrms.designation.dto;

import java.time.Instant;

public record DesignationResponse(
        Long id,
        String name,
        Long departmentId,
        String departmentName,
        String description,
        Integer level,
        boolean active,
        long employeeCount,
        Instant createdAt,
        Instant updatedAt) {
}

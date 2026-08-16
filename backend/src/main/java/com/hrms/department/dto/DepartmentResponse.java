package com.hrms.department.dto;

import java.time.Instant;

public record DepartmentResponse(
        Long id,
        String name,
        String description,
        Long managerId,
        String managerName,
        boolean active,
        long employeeCount,
        Instant createdAt,
        Instant updatedAt) {
}

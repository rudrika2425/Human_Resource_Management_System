package com.hrms.department.dto;

import jakarta.validation.constraints.NotBlank;

public record DepartmentRequest(
        @NotBlank String name,
        String description,
        Long managerId,
        Boolean active) {
}
